# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `azerothcore`; this is the `playerbots` flavor.** Two variant flavors share the id across long-lived branches — `main` (vanilla, official `acore/ac-wotlk-*` images) and `playerbots` (this branch: the [mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork, compiled from source at pack time via `Dockerfile.playerbots`). Sharing the id lets a user switch flavors in place, keeping their world and characters (same model as Bitcoin Core / Knots). Both are x86_64 only; there is no build flag — work on the flavor whose branch you're on.
- **`create-dbs` oneshot is playerbots-only.** The fork's auto-create makes only the first database, so `main.ts` runs a `create-dbs` one-shot before `db-import` to create all four DBs (`acore_auth`/`acore_world`/`acore_characters` plus the fork's `acore_playerbots`). Boot order: `database` → `client-data` → `create-dbs` → `db-import` → `realm-config` → `authserver` + `worldserver`, chained with `requires`. The auth/world/db-import roles all run from one consolidated `acore` image.
- **Extra actions.** `Playerbots Settings` (bots on/off + population, `configurePlayerbots.ts`) and `Modules` (optional compiled-in gameplay toggles, `configureModules.ts`) — both persist to the store and restart the server. Realm address is resolved in `utils.ts` (`resolveRealmHost`, reads the `auth-multi` host's LAN IPv4) and overridable via **Set Realm Address**; account creation uses SRP6 in `srp6.ts` writing directly to `acore_auth` via `db.ts` (no SOAP).
- **`FREE_DISK_SPACE: true` is enabled in all three CI workflows** because the fork compiles from source — leave it on (do not enable it on the vanilla `main` branch, which uses prebuilt images).

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach azerothcore -n worldserver -- <cmd>`. This package has several subcontainers; select one by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — e.g. `worldserver-sub`, `authserver-sub`, `database-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
