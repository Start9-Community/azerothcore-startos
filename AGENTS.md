# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `azerothcore`.** Two variant flavors share this id across long-lived branches — `main` (vanilla, official `acore/ac-wotlk-*` images) and `playerbots` (the mod-playerbots fork, compiled from source, adds Playerbots actions). Sharing the id lets a user switch flavors in place, keeping their world and characters (same model as Bitcoin Core / Knots). Both are x86_64 only; there is no build flag — work on the flavor whose branch you're on.
- **Boot ordering lives in `main.ts`.** MySQL `database` → `client-data` → `db-import` → `realm-config` → `authserver` + `worldserver`, chained with `requires`. The two game interfaces (`authserver` on the `auth-multi` host, `worldserver` on `world-multi`) are raw TCP `p2p` — LAN/clearnet only, they cannot run over Tor.
- **Realm address + accounts.** The address clients connect to is resolved in `utils.ts` (`resolveRealmHost`, reads the `auth-multi` host's LAN IPv4) and overridable via the **Set Realm Address** action. Account creation computes the SRP6 salt/verifier in `srp6.ts` (pure JS) and writes directly to `acore_auth` via `db.ts` — there is no SOAP dependency.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach azerothcore -n worldserver -- <cmd>`. This package has several subcontainers; select one by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — e.g. `worldserver-sub`, `authserver-sub`, `database-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
