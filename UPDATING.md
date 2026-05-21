# Updating the upstream version

This branch (`main`) is the **vanilla** flavor. It references AzerothCore's
official prebuilt images (`acore/ac-wotlk-*`), pinned to immutable digests in
`startos/manifest/index.ts`. "Upstream" here is the AzerothCore project, surfaced
through those published images.

> The **Playerbots** flavor lives on the [`playerbots` branch](https://github.com/Start9-Community/azerothcore-startos/tree/playerbots)
> and tracks the [mod-playerbots fork](https://github.com/mod-playerbots/azerothcore-wotlk)
> separately — see that branch's `UPDATING.md`.

## Determining the upstream version

AzerothCore publishes rolling images under the [`acore` Docker Hub org](https://hub.docker.com/u/acore).
The pinned tag is in the image digest comment in `startos/manifest/index.ts`
(`16.0.0-dev` at the last pin). Pick the published `acore/ac-wotlk-*` tag you want
to ship.

## Applying the bump

1. Resolve each image's digest for the chosen tag:

   ```sh
   docker buildx imagetools inspect acore/ac-wotlk-authserver:<tag>
   ```

   Repeat for `ac-wotlk-worldserver`, `ac-wotlk-db-import`, and
   `ac-wotlk-client-data`; bump `mysql:8.4` similarly if desired.

2. Update the pinned `<tag>@sha256:<digest>` constants in
   `startos/manifest/index.ts` (`MYSQL`, `AC_AUTHSERVER`, `AC_WORLDSERVER`,
   `AC_DB_IMPORT`, `AC_CLIENT_DATA`).

3. Bump `version` and `releaseNotes` in the file under `startos/versions/`,
   renaming it to the new version string (e.g. `16.0.0:0` → `16.1.0:0`). A _new_
   version file is only needed when the bump requires a migration, or when you
   want the old release notes preserved in git history — see
   [Versions](https://docs.start9.com/packaging/versions.html).

4. Rebuild (`make`), sideload, and confirm the server starts and a client can
   connect.
