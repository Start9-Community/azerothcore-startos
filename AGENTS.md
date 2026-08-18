# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Two flavors share the `azerothcore` package id across two long-lived branches** — `main` (vanilla, upstream's prebuilt images) and `playerbots` (this one: the mod-playerbots fork, built from source via `Dockerfile.playerbots`). There is no build flag: work on the flavor whose branch you are on, and don't split the id apart, because sharing it is what lets a user switch flavors and keep their world and characters.
- **Don't delete the `create-dbs` oneshot as redundant with `db-import`.** The fork's auto-create makes only the first database; without `create-dbs`, `db-import` finds three of the four missing.
- **Adding a module is four edits, not one.** Pin it in `Dockerfile.playerbots` (they compile in — AzerothCore modules are not runtime-loadable), add its default to `MODULE_DEFAULTS` in `utils.ts`, map it to its `AC_*` flag in `main.ts`, and add the toggle to `configureModules.ts`. The env name is the module's config key with camelCase split by underscores, and the value type is not uniform — `IndividualXp.Enabled` takes `true`/`false` where the rest take `1`/`0`.
- **`AC_UPDATES_ENABLE_DATABASES` is a bitmask and it is set twice on purpose.** `dbimport` gets `15` (all four databases) plus `AC_FORCE_CREATE_DB`; the long-running servers get `0`. Both override the image's own ENV, and letting a server inherit a nonzero value would let it migrate the schema out from under the importer.
- **`db.ts` tries three hosts on purpose.** An action does not share the daemon's loopback, so a connection to `127.0.0.1` alone fails from action context — it falls back to the container IP and then the OS IP, the same way `minecraft-startos` reaches RCON. Don't simplify it to one host.
- **`FREE_DISK_SPACE: true` stays on in all three CI workflows here**, because this flavor compiles the fork from source. Don't mirror it onto the vanilla `main` branch, which pulls prebuilt images and has never needed it.
