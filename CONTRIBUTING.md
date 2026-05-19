# Contributing

This repo packages [AzerothCore](https://github.com/azerothcore/azerothcore-wotlk)
(a WoW 3.3.5a server emulator) for StartOS, referencing the official
`acore/ac-wotlk-*` Docker images.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (images, volumes, interfaces). For developers and AI assistants.
- **`instructions.md`** — user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS.
- **`CONTRIBUTING.md`** — this file.

**Any code change that warrants it must update `README.md` and `instructions.md`
in the same change** — a new or renamed action, an added/removed volume / port /
interface / dependency, a changed default, a new limitation, any altered
user-visible behavior. See the packaging guide:
[Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and
[Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Building

You need the StartOS CLI (`start-cli`). Either download a prebuilt binary from
the [start-os releases](https://github.com/Start9Labs/start-os/releases)
(`start-cli_<arch>-linux`) or build the SDK from source. You also need
`squashfs-tools-ng` (provides `tar2sqfs`) and a `start-cli init-key`.

```bash
npm ci          # install dependencies
make x86_64     # build the x86_64 .s9pk (or `make` for all arches)
```

Sideload the resulting `.s9pk` via the StartOS web UI (System → Sideload) or:

```bash
start-cli --host https://<server>.local package install azerothcore_x86_64.s9pk
```

## Updating the upstream version

1. Pick a published `acore/ac-wotlk-*` tag (see <https://hub.docker.com/u/acore>)
   and update `ACORE_TAG` in `startos/manifest/index.ts`. All five images share
   the same tag.
2. Bump `version` and `releaseNotes` in the file under `startos/versions/`.
3. Rebuild (`make`), sideload, and confirm it starts and a client can connect.
4. Review `README.md` and `instructions.md` for anything the bump changed.

## Architecture notes

The boot sequence (MySQL → client-data → db-import → realm-config → auth +
world) uses StartOS `addDaemon`/`addOneshot` with `requires` ordering in
`startos/main.ts`. The realm address is resolved in `startos/utils.ts`
(`resolveRealmHost`) and can be overridden via the **Set Realm Address** action.
Account creation computes the SRP6 salt/verifier in `startos/srp6.ts` (pure JS,
no native deps) and inserts directly into `acore_auth` via `startos/db.ts`.

## How to contribute

1. Fork and branch from `master`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `master`.
