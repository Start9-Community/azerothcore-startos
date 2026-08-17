# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Two flavors share the `azerothcore` package id across two long-lived branches** — `main` (this one: vanilla, upstream's prebuilt images) and `playerbots` (the mod-playerbots fork, built from source). There is no build flag: work on the flavor whose branch you are on, and don't unify the id apart, because sharing it is what lets a user switch flavors and keep their world and characters.
- **`db.ts` tries three hosts on purpose.** An action does not share the daemon's loopback, so a connection to `127.0.0.1` alone fails from action context — it falls back to the container IP and then the OS IP, the same way `minecraft-startos` reaches RCON. Don't simplify it to one host.
