import { z } from 'zod';
export declare const TokenDataSchema: z.ZodObject<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    expires_at: z.ZodNumber;
    token_type: z.ZodString;
    scope: z.ZodString;
}, "strip", z.ZodTypeAny, {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    scope: string;
}, {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    scope: string;
}>;
export interface TokenData {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    scope: string;
}
export declare function saveTokens(tokens: TokenData): Promise<void>;
export declare function loadTokens(): Promise<TokenData | null>;
export declare function isTokenValid(tokens: TokenData): boolean;
export declare function refreshAccessToken(refreshToken: string): Promise<TokenData>;
export declare function clearTokens(): Promise<void>;
export declare function getValidAccessToken(): Promise<string | null>;
