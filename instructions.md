# AzerothCore

A World of Warcraft **3.3.5a (Wrath of the Lich King)** server emulator. This
package runs the auth server, world server, and database, and auto-downloads the
client map data. You connect with your own clean 3.3.5a game client.

## First start

The **first boot downloads ~1.1GB** of client map data and initializes three
databases. This can take several minutes — the World Server health check will
show "loading" until it finishes. Subsequent starts are fast.

## Connecting your client

You need a clean **WoW 3.3.5a (build 12340)** client (not included — it is
copyrighted). Then:

1. Run the **Connection Info** action to see your realm address.
2. Edit `Data/enUS/realmlist.wtf` in your client folder:
   ```
   set realmlist YOUR-SERVER-ADDRESS
   ```
   (use the address from the Connection Info action — your StartOS server's LAN
   address)
3. Run the **Create Account** action to make a login (username + password, and
   optionally a GM level).
4. Launch the client and log in.

## Important notes

- **LAN / local network only.** WoW 3.3.5 uses a raw TCP protocol that cannot
  run over Tor. Connect from a device on the same network, or set up clearnet
  port forwarding for ports 3724 (auth) and 8085 (world) yourself.
- **Use a clean client.** Modified clients (custom DBC files) can show "Filler
  text" on NPCs and broken quests due to client/server data mismatch.
- The server runs vanilla AzerothCore — no playerbots in this edition, so the
  world is unpopulated unless you invite friends on your network.

## Backups

Backups capture the full database and downloaded client data on the package
volume. Restore re-creates the realm exactly as it was.

## Troubleshooting

- **Can't connect after editing realmlist**: confirm the address matches the
  Connection Info action exactly, and that your client is version 3.3.5a.
- **World Server stuck "loading"**: first-boot client-data download in progress;
  give it a few minutes.
- **Account creation fails**: ensure the World Server health check is green
  (SOAP requires the world server to be fully running).
