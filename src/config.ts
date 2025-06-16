const CALLBACK_PORT = parseInt(process.env.FREEE_CALLBACK_PORT || '8080', 10);

export const config = {
  freee: {
    clientId: process.env.FREEE_CLIENT_ID || '',
    clientSecret: process.env.FREEE_CLIENT_SECRET || '',
    companyId: process.env.FREEE_COMPANY_ID || '0',
    apiUrl: process.env.FREEE_API_URL || 'https://api.freee.co.jp',
  },
  oauth: {
    callbackPort: CALLBACK_PORT,
    redirectUri: `http://127.0.0.1:${CALLBACK_PORT}/callback`,
    authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
    tokenEndpoint: 'https://accounts.secure.freee.co.jp/public_api/token',
    scope: 'read write',
  },
  server: {
    name: 'freee',
    version: '1.0.0',
  },
  auth: {
    timeoutMs: 5 * 60 * 1000, // 5分
  },
} as const;