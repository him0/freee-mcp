import { TokenData } from './tokens.js';
interface PendingAuthentication {
    codeVerifier: string;
    resolve: (tokens: TokenData) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
}
interface CliAuthHandler {
    resolve: (code: string) => void;
    reject: (error: Error) => void;
    codeVerifier: string;
}
/**
 * AuthenticationManager - manages pending authentication requests
 * Encapsulates authentication state that was previously global
 */
export declare class AuthenticationManager {
    private pendingAuthentications;
    private cliAuthHandlers;
    registerAuthentication(state: string, codeVerifier: string): void;
    getPendingAuthentication(state: string): PendingAuthentication | undefined;
    removePendingAuthentication(state: string): void;
    clearAllPending(): void;
    get pendingCount(): number;
    registerCliAuthHandler(state: string, handler: CliAuthHandler): void;
    getCliAuthHandler(state: string): CliAuthHandler | undefined;
    removeCliAuthHandler(state: string): void;
}
export declare function getActualRedirectUri(): string;
export declare function startCallbackServer(): Promise<void>;
export declare function registerAuthenticationRequest(state: string, codeVerifier: string): void;
export declare function stopCallbackServer(): void;
export declare function getDefaultAuthManager(): AuthenticationManager;
export {};
