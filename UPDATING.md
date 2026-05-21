# Updating the upstream version

This branch (`playerbots`) is the **Playerbots** flavor. It runs the
[mod-playerbots](https://github.com/mod-playerbots/azerothcore-wotlk) fork of
AzerothCore (a custom fork, not a runtime module). The auth/world/db-import roles
run from one consolidated `acore` image **compiled from source at pack time** via
`Dockerfile.playerbots`; `database` and `client-data` reuse the official upstream
images, pinned by digest in `startos/manifest/index.ts`.

> The **vanilla** flavor lives on the [`main` branch](https://github.com/Start9-Community/azerothcore-startos)
> and tracks the official AzerothCore images — see that branch's `UPDATING.md`.

## Bumping the fork version

1. Update `ACORE_COMMIT` / `PLAYERBOTS_COMMIT` in `Dockerfile.playerbots` to the
   commits you want (e.g. the `Playerbot` branch HEAD:
   `git ls-remote https://github.com/mod-playerbots/azerothcore-wotlk.git Playerbot`).
2. Bump `version` and `releaseNotes` in the file under `startos/versions/`. Keep
   the `#playerbots:` flavor prefix and the `.satisfies('<vanilla version>')`
   argument in sync with the vanilla flavor's current version.
3. Rebuild (`make`), sideload, and confirm the server starts, bots log in, and a
   client can connect.

> [!NOTE]
> The first `make` compiles the fork from source and is slow (tens of minutes).
> Docker layer-caches the build, so later repacks at the same commits are quick.
> Because of the source compile, signed release builds for this flavor are
> typically produced locally rather than relying on free CI runners.
