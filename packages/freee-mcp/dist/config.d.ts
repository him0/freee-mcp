export interface Config {
    freee: {
        clientId: string;
        clientSecret: string;
        companyId: string;
        apiUrl: string;
    };
    oauth: {
        callbackPort: number;
        redirectUri: string;
        authorizationEndpoint: string;
        tokenEndpoint: string;
        scope: string;
    };
    server: {
        name: string;
        version: string;
    };
    auth: {
        timeoutMs: number;
    };
}
/**
 * Load and cache configuration
 * Priority: environment variables > config file > error
 */
export declare function loadConfig(): Promise<Config>;
/**
 * Get cached configuration synchronously
 * Throws if loadConfig() has not been called yet
 */
export declare function getConfig(): Config;
