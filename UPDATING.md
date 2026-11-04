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
2. Keep the `#playerbots:` flavor prefix on the package version, and the
   `.satisfies('<vanilla version>')` argument in sync with the vanilla flavor's
   current version.

## Bumping the database and client-data images

`MYSQL` and `AC_CLIENT_DATA` in `startos/manifest/index.ts` are pinned as
`<tag>@sha256:<digest>`, independently of the vanilla flavor's pins. Pick the
published tag to ship, then resolve its digest:

```sh
docker buildx imagetools inspect acore/ac-wotlk-client-data:<tag> --format '{{json .Manifest}}' | jq -r .digest
docker buildx imagetools inspect mysql:8.4 --format '{{json .Manifest}}' | jq -r .digest
```
