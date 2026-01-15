import { TokenData } from './tokens.js';
export declare function generatePKCE(): {
    codeVerifier: string;
    codeChallenge: string;
};
export declare function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string;
export declare function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<TokenData>;
