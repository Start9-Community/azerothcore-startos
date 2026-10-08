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
`instructions.md` (end-user docs) in sync with your changes. This file restates neither:
whoever changes the package has both, so it carries only what they don't — repo mechanics,
a change that looks right and is not, where the next thing gets added, a naming trap, a
build or test invocation particular to this repo.

**Fix a defect you spot rather than reporting it** — you have the package open and the
context to be sure. File **a GitHub issue on this repo** only when the call isn't yours to
make: you can't pin the cause down, two defensible fixes exist, or it's too large to ride on
the work in hand. An open issue is a report, not a queue — implement one when you're asked
to or when it's labelled `Approved`, then close it with `Closes #<n>`.

Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Two flavors share the `azerothcore` id on long-lived branches:** `main` (vanilla, upstream's prebuilt images) and `playerbots` (this one: the mod-playerbots fork, built from source via `Dockerfile.playerbots`). Port a shared change to both branches, and never give a flavor its own id: the shared id is what lets a user switch flavors in place and keep their world and characters. `FREE_DISK_SPACE: true` stays on in all four build callers here, for the source build; don't mirror it onto `main`.
- **Keep `store.json`'s shapes `z.looseObject`.** After a flavor switch the file carries the other flavor's keys, and a strict shape deletes them on the next write.
- **Don't drop the `create-dbs` oneshot or align the two `AC_UPDATES_ENABLE_DATABASES` values.** The fork's auto-create makes only the first database, so `db-import` needs the other three created first. `dbimport` gets the bitmask `15` (all four databases) plus `AC_FORCE_CREATE_DB`, and the long-running servers get `0`, so they never migrate the schema out from under the importer.
- **Adding a module is four edits.** Pin it in `Dockerfile.playerbots` (modules compile in), add its default to `MODULE_DEFAULTS` in `utils.ts`, map it to its `AC_*` flag in `main.ts`, and add the toggle to `configureModules.ts`. The env name is the module's config key with camelCase split by underscores, and the value type is not uniform: `IndividualXp.Enabled` takes `true`/`false` where the rest take `1`/`0`.
- **Don't reduce `dbConnect` (`utils.ts`) to one host.** An action does not share the daemon's loopback, so `127.0.0.1` alone fails there; it falls back to the container IP, then the OS IP.
