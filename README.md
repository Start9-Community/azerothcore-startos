<p align="center">
  <img src="icon.png" alt="AzerothCore Logo" width="21%">
</p>

# AzerothCore on StartOS

> Everything not listed in this document should behave the same as upstream
> AzerothCore. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[AzerothCore](https://github.com/azerothcore/azerothcore-wotlk) is an open-source World of Warcraft 3.3.5a (Wrath of the Lich King) server emulator. This package runs the auth server, the world server, and their MySQL database as one service, downloads the client map data on first boot, and writes the realm's own address into the realm list so a client on the network can reach it.

This is the **vanilla flavor**. It shares the `azerothcore` package id with the Playerbots flavor on the `playerbots` branch, so a user can switch between them in place and keep their world and characters — see [Limitations and Differences](#limitations-and-differences).

- **Upstream repo:** <https://github.com/azerothcore/azerothcore-wotlk>
- **Wrapper repo:** <https://github.com/Start9-Community/azerothcore-startos>

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

Five images, all upstream and unmodified, pinned by immutable digest in the manifest rather than by tag.

| Property      | Value                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Images        | `mysql`, `acore/ac-wotlk-authserver`, `acore/ac-wotlk-worldserver`, `acore/ac-wotlk-db-import`, `acore/ac-wotlk-client-data` |
| Architectures | x86_64 only                                                                                                                  |
| Entrypoint    | Upstream's, via `sdk.useEntrypoint()`, for all three daemons                                                                 |

| Subcontainer       | Kind    | Purpose                                                               |
| ------------------ | ------- | --------------------------------------------------------------------- |
| `database-sub`     | daemon  | MySQL, holding all three AzerothCore databases                        |
| `authserver-sub`   | daemon  | Login and realm list — the address a client's `realmlist.wtf` targets |
| `worldserver-sub`  | daemon  | The game world — attach here for gameplay logs                        |
| `client-data-sub`  | oneshot | Downloads maps, vmaps, mmaps and DBC on first boot                    |
| `db-import-sub`    | oneshot | Creates and upgrades the three databases                              |
| `realm-config-sub` | oneshot | Writes this realm's address into `acore_auth.realmlist`               |

Digest pins rather than tags mean a given package version always runs the exact image it was tested against, even though upstream's tags are rolling.

## Volume and Data Layout

One volume, carved into three subpaths that are mounted into different containers.

| Subpath             | Mounted at                   | In                                             | Purpose                                |
| ------------------- | ---------------------------- | ---------------------------------------------- | -------------------------------------- |
| `mysql/`            | `/var/lib/mysql`             | `database-sub`                                 | All three databases                    |
| `data/`             | `/azerothcore/env/dist/data` | `client-data-sub` (rw), `worldserver-sub` (ro) | Maps, vmaps, mmaps, DBC                |
| `start9/store.json` | —                            | package-internal                               | Database password, realm name, address |

The world server mounts `data/` **read-only**, so only the download oneshot can write it — a corrupted map set comes from a failed download, never from the running server.

The client data is the bulk of the volume, and it is downloaded rather than shipped: it is over a gigabyte of extracted game data that would otherwise have to be redistributed inside the package.

## File Models

One model, `store.json`, holding the three values the package decides on the user's behalf.

| File                | Format | Modelled                | Written by                            |
| ------------------- | ------ | ----------------------- | ------------------------------------- |
| `start9/store.json` | JSON   | Yes — `FileHelper.json` | Init and the Set Realm Address action |

- **`dbPassword`** — generated once at install and never shown. It is MySQL's root password and is passed to every container that talks to the database. Nothing regenerates it, because rotating it would leave the existing data directory unopenable.
- **`realmName`** — the realm's display name in the client's realm list. Defaults to `AzerothCore`.
- **`realmAddress`** — the address written into the realm list. Empty means "resolve one automatically", which is the default; [Set Realm Address](#actions) fills it in.

Init merges the model on **every** init, not only install, so a field added in a later version picks up its default on upgrade rather than reading as unset.

AzerothCore's own `.conf` files are not modelled. Every setting the package needs is passed as an `AC_*` environment variable to the daemons, so there is no configuration file on disk for a user to edit or for the package to rewrite.

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

The boot chain is `database` → `client-data` → `db-import` → `realm-config` → `authserver` and `worldserver`, wired with `requires` rather than with sleeps. Two of those steps are slow exactly once:

1. **`client-data`** downloads and extracts the map data. It is idempotent — it checks for the DBC directory and skips the download if it is already there — so this cost is paid on first boot and never again.
2. **`db-import`** creates the three databases and applies upstream's schema and world data.

Then `realm-config` resolves the realm address and writes it into `acore_auth.realmlist`, and the two game daemons come up. First boot therefore takes minutes with the World Server check reporting "loading" throughout; subsequent starts take seconds.

Address resolution prefers a `192.168.x.x` address over any other non-local IPv4, because a box with both a home LAN and a tunnel or VPN interface will otherwise advertise an address the game client cannot route to. It falls back to the first non-local address, then to `127.0.0.1`.

## Actions

Three actions, all in the **Setup** group, covering the three things a new realm needs.

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

The auth server has no extra grace because it comes up last in the chain and has nothing to load.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. Nothing is dumped and nothing is excluded.

A plain file copy is safe for MySQL here because StartOS stops the service before taking a backup, and MySQL flushes to disk on graceful shutdown. That guarantee is what makes it acceptable to skip a logical dump for a single-instance database.

Consequences worth knowing: the backup includes the downloaded client data, so it is large — over a gigabyte before a single character exists. A restored instance needs nothing done to it; the realm, its accounts, its characters and its map data all come back together, and the realm address travels with them, so a restore onto a box with a different LAN address needs [Set Realm Address](#actions) re-run.

## Limitations and Differences

1. **LAN and clearnet only — no Tor.** The game protocol is raw TCP rather than HTTP, so both interfaces are declared `p2p` and Tor cannot carry them.
2. **x86_64 only.** Upstream publishes no ARM images for this stack.
3. **The game client is not included.** A clean 3.3.5a (build 12340) client is required and is copyrighted; a modified client with custom DBC files produces "Filler text" NPCs and broken quests from the data mismatch.
4. **The world is unpopulated.** This flavor is vanilla AzerothCore, so only real players are in it. The Playerbots flavor of this same package fills the world with AI players; the two share the `azerothcore` id and can be switched between in place.
5. **The interactive world server console is disabled** (`AC_CONSOLE_ENABLE=0`), so console commands are not available and the logs carry only server output.
6. **There is no password-reset action.** Accounts are created but not otherwise managed by the package.

---

## Quick Reference for AI Consumers

```yaml
package_id: azerothcore # unflavored; the playerbots branch is the #playerbots flavor of this id
image: acore/ac-wotlk-worldserver # plus authserver, db-import, client-data, mysql
architectures:
  - x86_64
subcontainers:
  - database-sub # daemon
  - authserver-sub # daemon
  - worldserver-sub # daemon
  - client-data-sub # oneshot
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
  - AC_DATA_DIR
  - AC_CONSOLE_ENABLE
dependencies: []
interfaces:
  authserver: { type: p2p, port: 3724 }
  worldserver: { type: p2p, port: 8085 }
actions:
  - get-server-info
  - set-realm-address
  - create-account
tasks: []
health_checks:
  - database # displayed "Database"
  - authserver # displayed "Auth Server"
  - worldserver # displayed "World Server"
```
