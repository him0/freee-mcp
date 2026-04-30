import { errors as joseErrors, jwtVerify, SignJWT } from 'jose';

export interface JwtPayload {
  sub: string;
  scope: string;
  client_id: string;
  iss: string;
  iat: number;
  exp: number;
  aud?: string | string[];
}

const ACCESS_TOKEN_TTL = '1h';
const MIN_SECRET_LENGTH = 32;

function deriveKey(secret: string): Uint8Array {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT secret must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: { sub: string; scope: string; clientId: string },
  secret: string,
  issuer: string,
  audience: string,
): Promise<string> {
  const key = deriveKey(secret);
  return new SignJWT({ scope: payload.scope, client_id: payload.clientId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(key);
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  issuer: string,
  audience: string | undefined,
): Promise<JwtPayload> {
  const key = deriveKey(secret);
  // When `audience` is undefined we are in grace-period mode for RFC 8707:
  // accept legacy tokens that lack `aud` and any current `aud` value.
  const verifyOptions = audience !== undefined ? { issuer, audience } : { issuer };
  const { payload } = await jwtVerify(token, key, verifyOptions);

  const sub = payload.sub;
  const scope = payload.scope as string | undefined;
  const clientId = payload.client_id as string | undefined;

  if (!sub || !scope || !clientId) {
    throw new Error('JWT missing required claims: sub, scope, client_id');
  }

  // RFC 7519: aud may be a string or array of strings; pass both shapes through.
  const aud =
    typeof payload.aud === 'string' || Array.isArray(payload.aud) ? payload.aud : undefined;

  return {
    sub,
    scope,
    client_id: clientId,
    iss: issuer,
    iat: payload.iat as number,
    exp: payload.exp as number,
    aud,
  };
}

export { joseErrors };
