<p align="center">
  <img src="icon.png" alt="AzerothCore Logo" width="21%">
</p>

# AzerothCore on StartOS

> **Upstream project:** <https://www.azerothcore.org/>
>
> Everything not listed in this document should behave the same as upstream
> AzerothCore. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and applicable.

StartOS package for [AzerothCore](https://www.azerothcore.org/), an open-source
World of Warcraft **3.3.5a (Wrath of the Lich King)** server emulator. Runs the
auth server, world server, and a MySQL database, auto-downloads client map data,
and auto-configures the realm address for LAN play. You bring your own clean
3.3.5a game client.

---

## Variants

This repo builds two separate packages from one codebase (selected at build time
by `VARIANT`):

| Package | id | Core | Arch | Notes |
| --- | --- | --- | --- | --- |
| **AzerothCore** (vanilla) | `azerothcore` | Stock AzerothCore (official prebuilt images) | x86_64 | Lightweight; empty world unless friends join |
| **AzerothCore — Playerbots** | `azerothcore-playerbots` | [mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork, compiled from source | x86_64 | World populated with AI players; bots toggleable |

They install as distinct packages. The Playerbots edition adds a **Playerbots
Settings** action (enable/disable bots, tune population); turning bots off makes
it behave like vanilla. **Don't run both at once** on the same server — they
share ports 3724/8085.

Build: `make` (vanilla) or `make playerbots`. Both editions are x86_64 only. See
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Connecting a Client](#connecting-a-client)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [License](#license)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Image | Role | Source |
| --- | --- | --- |
| `database` | MySQL backend (acore_auth, acore_world, acore_characters) | Upstream `mysql:8.4` |
| `authserver` | Login + realm list | Official `acore/ac-wotlk-authserver`, pinned in `startos/manifest/index.ts` |
| `worldserver` | Game world server | Official `acore/ac-wotlk-worldserver` |
| `db-import` | One-shot database initializer | Official `acore/ac-wotlk-db-import` |
| `client-data` | One-shot map/vmap/mmap/dbc downloader (~1.1GB) | Official `acore/ac-wotlk-client-data` |

In the **Playerbots** edition, `authserver`/`worldserver`/`db-import` are served
by one consolidated image (`acore`) compiled from the mod-playerbots fork at pack
time (`Dockerfile.playerbots`); `database` and `client-data` are unchanged.

| Property | Value |
| --- | --- |
| Architectures | x86_64 (both editions) |
| Entry command | Upstream entrypoint (`sdk.useEntrypoint()`) for the daemons |

---

## Volume and Data Layout

The package uses a single volume, `main`, with these subpaths:

| Subpath in `main` volume | Container mount point | Purpose |
| --- | --- | --- |
| `mysql/` | `/var/lib/mysql` (database) | All three databases |
| `data/` | `/azerothcore/env/dist/data` (worldserver, client-data) | Maps, vmaps, mmaps, dbc |
| `start9/store.json` | (package-internal) | DB password, realm name, realm address, client-data flag |

---

## Installation and First-Run Flow

On first install/start, the package runs an ordered boot sequence:

1. **MySQL** comes up (root password generated once at install, stored in `start9/store.json`).
2. **client-data** one-shot downloads ~1.1GB of map data (only on first boot; idempotent thereafter).
3. **db-import** one-shot creates/updates the three databases.
4. **realm-config** one-shot writes this server's address into `acore_auth.realmlist` so clients can connect.
5. **authserver** and **worldserver** daemons start.

First boot takes several minutes (the client-data download + DB init). The World
Server health check shows "loading" until it finishes. Subsequent starts are fast.

---

## Network Access and Interfaces

| Interface ID | Port | Protocol | Purpose |
| --- | --- | --- | --- |
| `authserver` | 3724 | TCP | WoW login (the address you put in realmlist.wtf) |
| `worldserver` | 8085 | TCP | Game world connection |

Internal-only service ports:
- `3306` MySQL (used by the daemons and the Create Account action)

**LAN / clearnet only.** WoW 3.3.5 uses a raw TCP game protocol and cannot run
over Tor. Both interfaces are declared `p2p`.

---

## Actions (StartOS UI)

| Action ID | Purpose | Availability |
| --- | --- | --- |
| `get-server-info` | Show the realm address + client connection details | any |
| `set-realm-address` | Choose which address clients use to reach the world server (needed when the box has multiple networks, e.g. LAN + tunnel) | any |
| `create-account` | Create a WoW login account (SRP6, written directly to the database) | only-running |
| `configure-playerbots` | Enable/disable AI players and tune the bot population (**Playerbots edition only**) | any |

---

## Connecting a Client

1. Obtain a clean **WoW 3.3.5a (build 12340)** client (not included — copyrighted).
2. Run **Set Realm Address** and pick your LAN address (e.g. `192.168.x.x`).
3. Run **Connection Info** to confirm the address.
4. Run **Create Account** to make a login.
5. Edit `Data/enUS/realmlist.wtf`: `set realmlist <that address>`.
6. Delete the client's `Cache/` folder, launch, log in.

---

## Backups and Restore

**Included in backup:** the `main` volume (all databases + downloaded client data).
**Restore:** standard StartOS restore flow (`restoreInit`); the realm is recreated as it was.

---

## Health Checks

| Check | Method | Notes |
| --- | --- | --- |
| `database` | Port `3306` listening | 30s grace |
| `authserver` | Port `3724` listening | after realm config |
| `worldserver` | Port `8085` listening | 120s grace (first-boot map load) |

---

## Dependencies

None.

---

## Limitations and Differences

1. **LAN / clearnet only** — no Tor (raw TCP game protocol).
2. **Two editions** — the vanilla package has an empty world unless friends on your network join; the [Playerbots edition](#variants) populates it with AI players (toggleable). Only one can run per server (shared ports).
3. **Bring your own client** — the game client is copyrighted and not bundled.
4. Use a **clean 3.3.5a client** — modified clients (custom DBC) can show "Filler text" / broken quests from client-server data mismatch.
5. The interactive worldserver console is disabled (`AC_CONSOLE_ENABLE=0`) so logs stay clean.

---

## What Is Unchanged from Upstream

- The AzerothCore server runtime, databases, and game data.
- Standard WoW 3.3.5a client connection flow (auth on 3724, world on 8085).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local build, install, and release details.

---

## License

The StartOS packaging code in this repository is **MIT** (see [LICENSE](LICENSE)).
The software it installs and runs, **AzerothCore**, is licensed separately under
**GPL-2.0** — see <https://github.com/azerothcore/azerothcore-wotlk>.

---

## Quick Reference for AI Consumers

```yaml
package_id: azerothcore
architectures: [x86_64]
volumes:
  main:
    mysql: /var/lib/mysql                    # database container
    data: /azerothcore/env/dist/data         # worldserver + client-data
    store: start9/store.json                 # dbPassword, realmName, realmAddress, clientDataReady
ports:
  authserver: 3724    # realmlist target
  worldserver: 8085   # game world
  database: 3306      # internal only
dependencies: none
boot_order: [database, client-data, db-import, realm-config, authserver, worldserver]
actions:
  - get-server-info
  - set-realm-address
  - create-account
account_creation: direct DB insert with SRP6 (salt + verifier), no SOAP
notes:
  - LAN/clearnet only (raw TCP, no Tor)
  - clean 3.3.5a client required, not bundled
  - two editions: azerothcore (vanilla) and azerothcore-playerbots (AI players, x86_64 only)
```
