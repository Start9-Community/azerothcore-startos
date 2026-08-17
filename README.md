<p align="center">
  <img src="icon.png" alt="AzerothCore Logo" width="21%">
</p>

# AzerothCore Playerbots on StartOS

> Everything not listed in this document should behave the same as upstream
> AzerothCore. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[AzerothCore](https://github.com/azerothcore/azerothcore-wotlk) is an open-source World of Warcraft 3.3.5a (Wrath of the Lich King) server emulator. This package runs the [mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork, which fills the realm with AI players, alongside the auth server, world server, and their MySQL database.

This is the **Playerbots flavor**. It shares the `azerothcore` package id with the vanilla flavor on the `main` branch, so a user can switch between them in place and keep their world and characters. Turning the bots off here leaves the realm behaving as vanilla does — see [Actions](#actions).

- **Upstream repo:** <https://github.com/mod-playerbots/azerothcore-wotlk>
- **Wrapper repo:** <https://github.com/Start9-Community/azerothcore-startos/tree/playerbots>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Three images. Two are upstream's, pinned by digest; the third is built from source at pack time, and that is the defining difference from the vanilla flavor.

| Property      | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Images        | `acore` (built here), `mysql`, `acore/ac-wotlk-client-data` |
| Architectures | x86_64 only                                                 |
| Entrypoint    | The fork image's entrypoint, given a binary name per role   |

| Subcontainer       | Image         | Kind    | Purpose                                                     |
| ------------------ | ------------- | ------- | ----------------------------------------------------------- |
| `database-sub`     | `database`    | daemon  | MySQL, holding all four databases                           |
| `authserver-sub`   | `acore`       | daemon  | Login and realm list                                        |
| `worldserver-sub`  | `acore`       | daemon  | The game world and the bots — attach here for gameplay logs |
| `client-data-sub`  | `client-data` | oneshot | Downloads maps, vmaps, mmaps and DBC on first boot          |
| `create-dbs-sub`   | `database`    | oneshot | Creates all four databases up front                         |
| `db-import-sub`    | `acore`       | oneshot | Populates and upgrades the four databases                   |
| `realm-config-sub` | `database`    | oneshot | Writes this realm's address into `acore_auth.realmlist`     |

**Playerbots is a fork, not a loadable module**, so the auth server, world server and database importer all come from one image compiled from the fork's source rather than from upstream's three prebuilt ones. The role is selected per container by the binary passed to the shared entrypoint. That compile is why a first build of this package is slow where the vanilla flavor's is not.

## Volume and Data Layout

One volume, carved into three subpaths that are mounted into different containers.

| Subpath             | Mounted at                   | In                                             | Purpose                                         |
| ------------------- | ---------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `mysql/`            | `/var/lib/mysql`             | `database-sub`                                 | All four databases                              |
| `data/`             | `/azerothcore/env/dist/data` | `client-data-sub` (rw), `worldserver-sub` (ro) | Maps, vmaps, mmaps, DBC                         |
| `start9/store.json` | —                            | package-internal                               | Database password, realm settings, bot settings |

The world server mounts `data/` **read-only**, so only the download oneshot can write it — a corrupted map set comes from a failed download, never from the running server.

Bot characters live in the same databases as real ones, so they are part of the volume's growth and part of every backup.

## File Models

One model, `store.json`, holding everything the package decides on the user's behalf — including both configuration actions' settings.

| File                | Format | Modelled                | Written by                               |
| ------------------- | ------ | ----------------------- | ---------------------------------------- |
| `start9/store.json` | JSON   | Yes — `FileHelper.json` | Init and the three configuration actions |

- **`dbPassword`** — generated once at install and never shown. It is MySQL's root password. Nothing regenerates it, because rotating it would leave the existing data directory unopenable.
- **`realmName`** — the realm's display name in the client's realm list.
- **`realmAddress`** — the address written into the realm list. Empty means "resolve one automatically", which is the default.
- **`playerbots`** — `enabled`, `minBots`, `maxBots`. Written by [Playerbots Settings](#actions).
- **`modules`** — one boolean per optional gameplay module. Written by [Modules](#actions).

Init merges the model on **every** init, not only install, so a field added in a later version picks up its default on upgrade rather than reading as unset. That is what allows new module toggles to appear without a migration.

AzerothCore's own `.conf` files are not modelled. Every setting is passed as an `AC_*` environment variable derived from the store at start-up, which is also why every configuration action restarts the service: the values are read once, when the daemons are built.

## Dependencies

None. MySQL runs as a private sidecar of this service rather than as a StartOS dependency.

## Network Access and Interfaces

Two interfaces, both raw TCP. A WoW client contacts the auth server first, and is handed off to the world server whose address it finds in the realm list.

| Interface    | Id            | Type | Port | Description                               |
| ------------ | ------------- | ---- | ---- | ----------------------------------------- |
| Auth Server  | `authserver`  | p2p  | 3724 | Login server — the `realmlist.wtf` target |
| World Server | `worldserver` | p2p  | 8085 | The game world, connected to after login  |

Bound on the `auth-multi` and `world-multi` MultiHosts respectively, each requesting its own port number as the external one so a client's hard-coded expectations hold. Neither is masked and neither carries TLS — the game protocol is not HTTP and does not negotiate it.

MySQL listens on 3306 inside the service and is never exported.

**The realm list is the reason the address matters more here than for a typical package.** The auth server answers with whatever address `acore_auth.realmlist` holds, and the client then connects to _that_ — so an address that the box can see but the client cannot produces a login that succeeds and a world connection that hangs. That is what [Set Realm Address](#actions) exists to correct.

## Installation and First-Run Flow

Install generates the database password and seeds the store; everything else happens on the first start, in a fixed order.

The boot chain is `database` → `client-data` → `create-dbs` → `db-import` → `realm-config` → `authserver` and `worldserver`, wired with `requires` rather than with sleeps. Three of those steps matter to a first boot:

1. **`client-data`** downloads and extracts the map data. It is idempotent — it checks for the DBC directory and skips the download if it is already there — so this cost is paid on first boot and never again.
2. **`create-dbs`** creates all four databases explicitly. The fork's own auto-create only makes the first one, so without this step `db-import` finds nothing to populate.
3. **`db-import`** applies upstream's schema and world data, plus the fork's bot schema. It runs with database migrations enabled across all four; the long-running daemons run with them **disabled**, so only this one step can ever alter the schema.

Then `realm-config` resolves the realm address and writes it into `acore_auth.realmlist`, and the two game daemons come up. Once the world server is ready, bots log in on their own.

First boot therefore takes minutes with the World Server check reporting "loading" throughout; subsequent starts take seconds.

Address resolution prefers a `192.168.x.x` address over any other non-local IPv4, because a box with both a home LAN and a tunnel or VPN interface will otherwise advertise an address the game client cannot route to. It falls back to the first non-local address, then to `127.0.0.1`.

## Actions

Five actions, all in the **Setup** group. The last two are this flavor's, and both restart the service.

### Connection Info

Shows what to put in the client's `realmlist.wtf`, the auth port, and the client build this realm speaks. Run it before configuring a client, and again after changing the realm address.

- **What it changes:** nothing. It resolves the current address and reports it.
- **Cost:** immediate; available at any status.
- **Repeat safety:** read-only.
- **Outputs:** the full `set realmlist <address>` line, the auth port, and the client version (`3.3.5a`, build 12340).

### Set Realm Address

Overrides the address clients are handed for the world server. Run it when the automatic choice is wrong — the usual cause is a box with more than one network, where the resolver picks a tunnel address a game client cannot reach.

- **What it changes:** `realmAddress` in the store, and through it `acore_auth.realmlist` on the next start.
- **Cost:** **it restarts the service.** The realm list is rewritten by the `realm-config` oneshot, which only runs as part of the boot chain.
- **Repeat safety:** idempotent; the last value wins. The input is validated against a strict character set, so an address containing anything other than letters, digits, dots, colons and hyphens is rejected rather than written.
- **What happens next:** players must set the same address in `realmlist.wtf` — the two have to agree.

### Create Account

Creates a WoW login account, optionally with Game Master privileges. Run it once per player.

- **When to run it:** only while the service is running — it opens a database connection rather than shelling into a container.
- **What it changes:** inserts a row into `acore_auth.account`, and into `account_access` when a GM level above 0 is chosen. The GM grant is realm-wide.
- **Repeat safety:** **not** idempotent — a second run with an existing account name fails rather than overwriting it. There is no action to change or reset a password.
- **Cost:** immediate; no restart.

Account names are upper-cased before insert, matching AzerothCore's own convention, and the password is stored as an SRP6 salt and verifier computed in-package. No SOAP interface is enabled and none is needed, which is what allows the _first_ account to be created without an existing Game Master.

### Playerbots Settings

Turns the bots on or off and sets the random-bot population. Run it to make the realm quieter or busier, or to run this flavor as a vanilla realm.

- **What it changes:** the `playerbots` block in the store, which becomes the fork's bot environment variables at start-up.
- **Cost:** **it restarts the service**, and the bot population then rebuilds toward the new minimum over time rather than immediately.
- **Repeat safety:** idempotent. A minimum above the maximum is silently swapped rather than rejected, and the action's result says so.
- **What happens next:** disabling leaves the existing bot characters in the database, dormant — nothing is deleted, and re-enabling brings the same population back.
- **Sizing:** each bot costs roughly 10–20 MB of RAM, so the population bound is effectively a memory budget. This is the setting to lower first on a box under memory pressure.

### Modules

Toggles the optional gameplay modules compiled into the image. Run it to enable an extra the fork ships but does not turn on.

- **What it changes:** the `modules` block in the store, which becomes one `AC_*` flag per module at start-up.
- **Cost:** **it restarts the service.**
- **Repeat safety:** idempotent.
- **Scope limit:** the module set is fixed by the image, not by configuration. Adding a module means rebuilding, not toggling — which is also why a module that is off still costs image size.
- **A note on Auto-Revive:** it applies to Game Master accounts only, so enabling it changes nothing for ordinary players.

## Tasks

None. This package raises no tasks, so the service is never held on a prompt and its ordinary controls are always available.

## Health Checks

Three checks, one per daemon, and their grace periods encode how long each is allowed to take.

| Check         | Displayed as   | Method                 | Grace Period |
| ------------- | -------------- | ---------------------- | ------------ |
| `database`    | "Database"     | Port 3306 is listening | 30s          |
| `authserver`  | "Auth Server"  | Port 3724 is listening | default      |
| `worldserver` | "World Server" | Port 8085 is listening | 120s         |

The world server's 120 seconds covers loading the map data into memory at start-up, which is why it reports "loading" rather than failing during a normal boot. On a **first** boot it will exceed even that, because the client-data download runs ahead of it — a "loading" world server on a brand-new install is the download, not a fault.

None of the checks say anything about the bots. A green world server with an empty world means the bots are disabled or their maximum is zero — a configuration question, not a health one, answered by [Playerbots Settings](#actions).

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. Nothing is dumped and nothing is excluded.

A plain file copy is safe for MySQL here because StartOS stops the service before taking a backup, and MySQL flushes to disk on graceful shutdown. That guarantee is what makes it acceptable to skip a logical dump for a single-instance database.

Consequences worth knowing: the backup includes the downloaded client data and every bot character, so it is large — over a gigabyte before a real player exists. A restored instance needs nothing done to it, but the realm address travels with the backup, so restoring onto a box with a different LAN address needs [Set Realm Address](#actions) re-run.

## Limitations and Differences

1. **LAN and clearnet only — no Tor.** The game protocol is raw TCP rather than HTTP, so both interfaces are declared `p2p` and Tor cannot carry them.
2. **x86_64 only.** The fork is compiled for 64-bit Intel and AMD; there is no ARM build.
3. **The game client is not included.** A clean 3.3.5a (build 12340) client is required and is copyrighted; a modified client with custom DBC files, or some addons, produce "Filler text" NPCs and broken quests from the data mismatch.
4. **The module set is fixed at build time.** AzerothCore modules are compiled in rather than loaded, so the Modules action can only toggle what the image already contains.
5. **The interactive world server console is disabled** (`AC_CONSOLE_ENABLE=0`), so console commands are not available and the logs carry only server output.
6. **There is no password-reset action.** Accounts are created but not otherwise managed by the package.
7. **Bots are memory-bound, not CPU-bound, in practice.** The population setting is the main lever on this package's footprint.

---

## Quick Reference for AI Consumers

```yaml
package_id: azerothcore # the #playerbots flavor; the main branch is the unflavored one
image: acore # built from Dockerfile.playerbots; plus mysql, acore/ac-wotlk-client-data
architectures:
  - x86_64
subcontainers:
  - database-sub # daemon
  - authserver-sub # daemon
  - worldserver-sub # daemon
  - client-data-sub # oneshot
  - create-dbs-sub # oneshot
  - db-import-sub # oneshot
  - realm-config-sub # oneshot
volumes:
  main:
    mysql: /var/lib/mysql
    data: /azerothcore/env/dist/data
    start9/store.json: package-internal
file_models:
  - start9/store.json
startos_managed_env_vars:
  - MYSQL_ROOT_PASSWORD
  - AC_LOGIN_DATABASE_INFO
  - AC_WORLD_DATABASE_INFO
  - AC_CHARACTER_DATABASE_INFO
  - AC_PLAYERBOTS_DATABASE_INFO
  - AC_DATA_DIR
  - AC_CONSOLE_ENABLE
  - AC_UPDATES_ENABLE_DATABASES
  - AC_AI_PLAYERBOT_* # enabled, autologin, min/max random bots
  - AC_* # one flag per optional module
dependencies: []
interfaces:
  authserver: { type: p2p, port: 3724 }
  worldserver: { type: p2p, port: 8085 }
actions:
  - get-server-info
  - set-realm-address
  - create-account
  - configure-playerbots
  - configure-modules
tasks: []
health_checks:
  - database # displayed "Database"
  - authserver # displayed "Auth Server"
  - worldserver # displayed "World Server"
```
