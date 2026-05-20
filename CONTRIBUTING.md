# Contributing

This repo packages [AzerothCore](https://github.com/azerothcore/azerothcore-wotlk)
(a WoW 3.3.5a server emulator) for StartOS. It builds **two packages from one
codebase**, selected at build time by the `VARIANT` env var:

- **vanilla** (`azerothcore`) — references the official `acore/ac-wotlk-*`
  images (pinned to digests); x86_64.
- **playerbots** (`azerothcore-playerbots`) — compiles the
  [mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork from
  source (pinned commits) via `Dockerfile.playerbots` into one consolidated
  image; x86_64.

The active variant is baked into the bundle by `scripts/gen-variant.js` (writes
the gitignored `startos/variant.gen.ts` and `instructions.md`). Runtime branches
on `isPlayerbots` from `startos/variant.ts`.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (images, volumes, interfaces). For developers and AI assistants.
- **`instructions.<variant>.md`** — user-facing instructions, one per variant
  (`instructions.vanilla.md`, `instructions.playerbots.md`). The build copies the
  right one to `instructions.md` (generated, gitignored), which is packed into the
  `.s9pk` and shown on the **Instructions** tab. Edit the templates, not
  `instructions.md`.
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
npm ci              # install dependencies

make                # vanilla (azerothcore_x86_64.s9pk)

# Playerbots (azerothcore-playerbots): compiles the fork at pinned commits (slow
# first time; Docker layer-caches the compile, so later repacks are quick)
make playerbots
```

Sideload the resulting `.s9pk` via the StartOS web UI (System → Sideload) or:

```bash
start-cli --host https://<server>.local package install azerothcore_x86_64.s9pk
```

## Releasing

CI is key-free (it only type-checks and bundles — see `.github/workflows/check.yml`);
signed `.s9pk` builds are done locally. To cut a release with both packages:

```bash
make            # azerothcore_x86_64.s9pk
make playerbots # azerothcore_playerbots_x86_64.s9pk
gh release create vX.Y.Z azerothcore_*.s9pk --title "vX.Y.Z" --notes "..."
```

## Updating the upstream version

1. Pick a published `acore/ac-wotlk-*` tag (see <https://hub.docker.com/u/acore>),
   resolve each image's digest with `docker buildx imagetools inspect <ref>`, and
   update the pinned digest constants in `startos/manifest/index.ts`.
2. For playerbots, update `ACORE_COMMIT` / `PLAYERBOTS_COMMIT` in
   `Dockerfile.playerbots` to the commits you want (e.g. the `Playerbot` branch
   HEAD: `git ls-remote <repo> Playerbot`).
3. Bump `version` and `releaseNotes` in the file under `startos/versions/`.
4. Rebuild (`make` / `make playerbots`), sideload, and confirm it starts and a
   client can connect.
5. Review `README.md` and the `instructions.*.md` templates for anything changed.

## Architecture notes

The boot sequence (MySQL → client-data → db-import → realm-config → auth +
world) uses StartOS `addDaemon`/`addOneshot` with `requires` ordering in
`startos/main.ts`. The realm address is resolved in `startos/utils.ts`
(`resolveRealmHost`) and can be overridden via the **Set Realm Address** action.
Account creation computes the SRP6 salt/verifier in `startos/srp6.ts` (pure JS,
no native deps) and inserts directly into `acore_auth` via `startos/db.ts`.

## How to contribute

1. Fork and branch from `main`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `main`.
