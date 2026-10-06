export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  Database: 1,
  'Database is ready': 2,
  'Database is starting': 3,
  'Auth Server': 4,
  'Auth server is ready': 5,
  'Auth server is starting': 6,
  'World Server': 7,
  'World server is ready': 8,
  'World server is loading': 9,

  // interfaces.ts
  'WoW login server. Point realmlist.wtf at this address.': 20,
  'WoW game world server': 21,

  // action groups
  Setup: 40,

  // createAccount.ts
  'Account Name': 50,
  'Not case-sensitive; it is saved in capitals.': 51,
  Password: 52,
  'Not case-sensitive: the 3.3.5a login checks passwords in capitals.': 53,
  'GM Level': 54,
  'Which in-game commands the account can use. Each command has a minimum level, so a higher level keeps everything a lower one has.\n- Player (0): an ordinary player account\n- Moderator (1): adds the level 1 commands\n- Game Master (2): adds the level 2 commands\n- Administrator (3): adds the level 3 commands, the highest level this action grants': 55,
  'Player (0)': 56,
  'Moderator (1)': 57,
  'Game Master (2)': 58,
  'Administrator (3)': 59,
  'Create Account': 60,
  'Create a new WoW login account on this realm': 61,
  'Account Created': 62,
  'The account is ready. Log in with the WoW client.': 63,

  // getServerInfo.ts
  'Connection Info': 70,
  'How to connect your WoW 3.3.5a client to this realm': 71,
  'Edit Data/enUS/realmlist.wtf in your 3.3.5a client and set the realmlist to the address below, then log in.': 72,
  'Auth Port': 73,
  'Client Version': 74,

  // setRealmAddress.ts
  'Set Realm Address': 80,
  'Choose which address clients use to connect to the world server': 81,
  'Changing this restarts the server.': 82,
  'Realm Address': 85,
  "The address (LAN IP or hostname) game clients connect to. For home LAN play use your local 192.168.x.x address. The Auth Server interface lists this server's addresses.": 86,
  'Realm Address Updated': 87,
  'The server is restarting. Set your client realmlist.wtf to this same address.': 88,
} as const

export type LangDict = Record<keyof typeof dict, string>

export default dict
