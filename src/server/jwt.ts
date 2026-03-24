import { errors as joseErrors, jwtVerify, SignJWT } from 'jose';

export interface JwtPayload {
  sub: string;
  scope: string;
  client_id: string;
  iss: string;
  iat: number;
  exp: number;
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
): Promise<string> {
  const key = deriveKey(secret);
  return new SignJWT({ scope: payload.scope, client_id: payload.clientId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(key);
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  issuer: string,
): Promise<JwtPayload> {
  const key = deriveKey(secret);
  const { payload } = await jwtVerify(token, key, { issuer });

  const sub = payload.sub;
  const scope = payload.scope as string | undefined;
  const clientId = payload.client_id as string | undefined;

  if (!sub || !scope || !clientId) {
    throw new Error('JWT missing required claims: sub, scope, client_id');
  }

  return {
    sub,
    scope,
    client_id: clientId,
    iss: issuer,
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}

export { joseErrors };
