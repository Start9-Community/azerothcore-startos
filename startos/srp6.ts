import { createHash, randomBytes } from 'node:crypto'

// AzerothCore SRP6 registration crypto, pure-JS (BigInt) — no native deps.
//   N = 256-bit safe prime, g = 7, hash = SHA1
//   h1 = SHA1(UPPER(user) : UPPER(pass))
//   h2 = SHA1(salt || h1)                       (salt = 32 random bytes)
//   x  = h2 as a little-endian integer
//   v  = g^x mod N, returned as a 32-byte little-endian buffer
const N = BigInt(
  '0x894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7',
)
const g = 7n

function sha1(...parts: Buffer[]): Buffer {
  const h = createHash('sha1')
  for (const p of parts) h.update(p)
  return h.digest()
}

function leBufToBig(buf: Buffer): bigint {
  let x = 0n
  for (let i = buf.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(buf[i])
  return x
}

function bigToLeBuf(x: bigint, len: number): Buffer {
  const out = Buffer.alloc(len)
  for (let i = 0; i < len; i++) {
    out[i] = Number(x & 0xffn)
    x >>= 8n
  }
  return out
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  base %= mod
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod
    exp >>= 1n
    base = (base * base) % mod
  }
  return result
}

export function makeSalt(): Buffer {
  return randomBytes(32)
}

export function computeVerifier(
  salt: Buffer,
  username: string,
  password: string,
): Buffer {
  const u = username.toUpperCase()
  const p = password.toUpperCase()
  const h1 = sha1(Buffer.from(`${u}:${p}`, 'utf8'))
  const h2 = sha1(salt, h1)
  const x = leBufToBig(h2)
  const v = modPow(g, x, N)
  return bigToLeBuf(v, 32)
}
