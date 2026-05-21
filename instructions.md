# AzerothCore — Playerbots

A World of Warcraft **3.3.5a (Wrath of the Lich King)** server emulator with
**mod-playerbots** built in. This package runs the auth server, world server, and
database, auto-downloads the client map data, and populates the world with AI
players (bots) so the realm feels alive even when you play solo. You connect with
your own clean 3.3.5a game client.

## First start

The **first boot downloads ~1.1GB** of client map data and initializes the
databases. This can take several minutes — the World Server health check shows
"loading" until it finishes. Once the world server is up, bots log in and spread
out across the world automatically. Subsequent starts are fast.

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

## Playerbots

Bots are **enabled by default**. Use the **Playerbots Settings** action to:

- **Turn bots off** — the server then behaves like a vanilla, unpopulated realm.
- **Tune the population** — set the minimum and maximum number of random bots.

Saving the action restarts the server. Disabling bots leaves their characters
dormant in the database (they simply stop logging in); re-enabling brings the
population back.

In game, talk to bots in chat or invite them to your group. They quest, run
dungeons, gear up, and join battlegrounds on their own.

### Memory

Each bot uses roughly **10-20 MB of RAM**. The default of **20-40 bots** costs
under a gigabyte. Raising the maximum makes the world busier but uses more
memory — tune it to your server's hardware. If the server runs low on memory,
lower the maximum bot count.

## Important notes

- **LAN / local network only.** WoW 3.3.5 uses a raw TCP protocol that cannot
  run over Tor. Connect from a device on the same network, or set up clearnet
  port forwarding for ports 3724 (auth) and 8085 (world) yourself.
- **Use a clean client.** Modified clients (custom DBC files) or some addons can
  show "Filler text" on NPCs and broken quests. If gossip text looks wrong,
  disable your addons.
- **Vanilla and Playerbots are two flavors of the same package.** They share one
  package id, so only one can be installed at a time — pick a flavor in the
  marketplace. You can switch flavors in place, keeping your world and
  characters; turning bots off here is equivalent to the vanilla flavor.
- **x86_64 only.** The playerbots core is built for 64-bit Intel/AMD; there is no
  ARM build of this flavor.

## Backups

Backups capture the full database (including the bot characters) and downloaded
client data on the package volume. Restore re-creates the realm exactly as it
was.

## Troubleshooting

- **Can't connect after editing realmlist**: confirm the address matches the
  Connection Info action exactly, and that your client is version 3.3.5a.
- **World Server stuck "loading"**: first-boot client-data download in progress;
  give it a few minutes.
- **No bots in the world**: open **Playerbots Settings** and confirm bots are
  enabled and the maximum count is above zero, then save to restart.
- **"Filler text" on NPCs**: a client addon is breaking the gossip UI — disable
  addons at the character-select screen.
- **Account creation fails**: ensure the World Server health check is green.
