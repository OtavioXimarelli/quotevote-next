/**
 * Edge-safe JWT session inspection for Next.js middleware.
 *
 * When JWT_SECRET is configured, HS256 signatures are verified via Web Crypto
 * (authoritative). When it is not, only structural + expiry checks run — admin
 * claims are never trusted without signature verification.
 */

export type JwtSession =
  | { status: 'valid'; admin: boolean; verified: boolean }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'missing' }

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const padded = normalized + pad
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'))
  }
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function decodePayloadJson(payloadB64: string): Record<string, unknown> | null {
  try {
    const bytes = decodeBase64Url(payloadB64)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function isExpiredPayload(payload: Record<string, unknown>): boolean {
  const exp = payload.exp
  if (typeof exp !== 'number') return true
  return exp * 1000 <= Date.now()
}

async function verifyHs256(token: string, secret: string): Promise<Record<string, unknown> | 'expired' | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts

  let header: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerB64))) as Record<string, unknown>
  } catch {
    return null
  }
  if (header.alg !== 'HS256') return null

  const payload = decodePayloadJson(payloadB64)
  if (!payload) return null

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = decodeBase64Url(signatureB64)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
    data,
  )
  if (!valid) return null
  if (isExpiredPayload(payload)) return 'expired'
  return payload
}

/**
 * Resolve whether a cookie token represents a usable session.
 */
export async function resolveJwtSession(token: string | undefined | null): Promise<JwtSession> {
  if (!token) return { status: 'missing' }

  const secret = process.env.JWT_SECRET
  if (secret) {
    try {
      const result = await verifyHs256(token, secret)
      if (result === 'expired') return { status: 'expired' }
      if (!result) return { status: 'invalid' }
      return {
        status: 'valid',
        admin: result.admin === true,
        verified: true,
      }
    } catch {
      return { status: 'invalid' }
    }
  }

  const parts = token.split('.')
  if (parts.length !== 3) return { status: 'invalid' }
  const payload = decodePayloadJson(parts[1])
  if (!payload) return { status: 'invalid' }
  if (isExpiredPayload(payload)) return { status: 'expired' }

  // Without JWT_SECRET we cannot trust claims — treat as a non-admin session
  // for middleware UX only. Server APIs remain the authorization boundary.
  return { status: 'valid', admin: false, verified: false }
}

export function clearAuthCookie(response: {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void }
}): void {
  response.cookies.set('qv-token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  })
}
