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
  'The login name for the new WoW account': 51,
  Password: 52,
  'Account password': 53,
  'GM Level': 54,
  'Game Master privilege level for this account': 55,
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
  'The address (LAN IP or hostname) game clients connect to. For home LAN play use your local 192.168.x.x address. Check the Connection Info action to see all available addresses.': 86,
  'Realm Address Updated': 87,
  'The server is restarting. Set your client realmlist.wtf to this same address.': 88,
} as const

export type LangDict = Record<keyof typeof dict, string>

export default dict
