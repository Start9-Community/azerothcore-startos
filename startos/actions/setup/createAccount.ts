import { sdk } from '../../sdk'
import { i18n } from '../../i18n'
import { dbConnect } from '../../db'
import { computeVerifier, makeSalt } from '../../srp6'
import { dbName } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Account Name'),
    description: i18n('The login name for the new WoW account'),
    required: true,
    default: null,
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n('Account password'),
    required: true,
    default: null,
    masked: true,
  }),
  gmLevel: Value.select({
    name: i18n('GM Level'),
    description: i18n('Game Master privilege level for this account'),
    default: '0',
    values: {
      '0': i18n('Player (0)'),
      '1': i18n('Moderator (1)'),
      '2': i18n('Game Master (2)'),
      '3': i18n('Administrator (3)'),
    },
  }),
})

// Creates the account directly in acore_auth via SRP6 (salt + verifier), the
// same crypto AzerothCore uses. Works for the first account (no SOAP / no
// existing-GM requirement).
export const createAccount = sdk.Action.withInput(
  'create-account',
  async ({ effects }) => ({
    name: i18n('Create Account'),
    description: i18n('Create a new WoW login account on this realm'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Setup'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => ({}),
  async ({ effects, input }) => {
    const username = input.username.trim().toUpperCase()
    const password = input.password
    const salt = makeSalt()
    const verifier = computeVerifier(salt, username, password)

    const conn = await dbConnect(effects, dbName.auth)
    try {
      const [existing] = (await conn.execute(
        'SELECT id FROM account WHERE username = ?',
        [username],
      )) as any
      if (existing.length > 0) {
        throw new Error(`Account "${username}" already exists.`)
      }

      const [res] = (await conn.execute(
        'INSERT INTO account (username, salt, verifier) VALUES (?, ?, ?)',
        [username, salt, verifier],
      )) as any
      const accountId = res.insertId

      const gm = parseInt(input.gmLevel, 10)
      if (gm > 0) {
        // RealmID -1 = applies to all realms.
        await conn.execute(
          'INSERT INTO account_access (id, gmlevel, RealmID, comment) ' +
            'VALUES (?, ?, -1, ?)',
          [accountId, gm, 'created via StartOS'],
        )
      }
    } finally {
      await conn.end()
    }

    return {
      version: '1' as const,
      title: i18n('Account Created'),
      message: i18n('The account is ready. Log in with the WoW client.'),
      result: null,
    }
  },
)
