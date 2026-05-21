# Contributing

This repo packages [AzerothCore](https://github.com/azerothcore/azerothcore-wotlk)
(a WoW 3.3.5a server emulator) for StartOS.

## Two flavors, two branches

AzerothCore is shipped as **two flavors that share the `azerothcore` package id**,
so a user can switch between them in place, keeping their world and characters
(the same pattern as Bitcoin Core / Bitcoin Knots). Each flavor is a long-lived
branch:

- **`main`** — **vanilla** flavor. References AzerothCore's official prebuilt
  `acore/ac-wotlk-*` images. Version string `16.0.0:0` (no flavor prefix).
- **`playerbots`** — **Playerbots** flavor. Runs the
  [mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork
  (compiled from source at pack time), adding AI players and a **Playerbots
  Settings** action. Version string `#playerbots:16.0.0:0`.

Both are x86_64 only. Each branch is a self-contained single-flavor package and
has its own CI; shared changes are merged/cherry-picked between branches. Work on
the flavor whose branch you're on — there is no build flag.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (images, volumes, interfaces). For developers and AI assistants.
- **`instructions.md`** — user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS.
- **`UPDATING.md`** — how to bump the upstream version for this flavor.
- **`TODO.md`** — pending work on this package.
- **`CONTRIBUTING.md`** — this file.

**Any code change that affects user-visible behavior must update `README.md` and
`instructions.md` in the same change** — a new or renamed action, an
added/removed volume / port / interface / dependency, a changed default, a new
limitation. See the packaging guide:
[Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and
[Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Environment setup

See [Environment Setup](https://docs.start9.com/packaging/environment-setup.html).

## Building

```bash
npm ci    # install dependencies
make      # build azerothcore_x86_64.s9pk
```

For a complete list of build options, see [Makefile](https://docs.start9.com/packaging/makefile.html).
Sideload the resulting `.s9pk` via the StartOS web UI (System → Sideload) or
`start-cli package install -s azerothcore_x86_64.s9pk`.

## Updating the upstream version

1. Apply the upstream bump per [UPDATING.md](./UPDATING.md).
2. Update `version` and `releaseNotes` in the file under `startos/versions/`.
3. Review `README.md` and `instructions.md` for anything changed.

## CI/CD

Three workflows under `.github/workflows/` wrap reusable workflows in
[`start9labs/shared-workflows`](https://github.com/Start9Labs/shared-workflows):

- **`build.yml`** — on PR, builds the `.s9pk` and uploads it for sideload testing.
- **`release.yml`** — on `v*` tag, builds and publishes to the test registry.
- **`tagAndRelease.yml`** — on push to `main`, tags `v<version>` and runs `release.yml`, skipping if already in production.

Promotion to `beta` and `prod` is a separate, manual step.

## Architecture notes

The boot sequence (MySQL → client-data → db-import → realm-config → auth +
world) uses StartOS `addDaemon`/`addOneshot` with `requires` ordering in
`startos/main.ts`. The realm address is resolved in `startos/utils.ts`
(`resolveRealmHost`) and can be overridden via the **Set Realm Address** action.
Account creation computes the SRP6 salt/verifier in `startos/srp6.ts` (pure JS,
no native deps) and inserts directly into `acore_auth` via `startos/db.ts` —
there is no SOAP dependency.

## How to contribute

1. Fork the repository and create a branch from the flavor branch you're targeting (`main` or `playerbots`).
2. Make your changes — including the doc updates above.
3. Open a pull request back to that flavor branch.
