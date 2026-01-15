import { z } from 'zod';
export declare const CompanyConfigSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    addedAt: z.ZodNumber;
    lastUsed: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    addedAt: number;
    name?: string | undefined;
    description?: string | undefined;
    lastUsed?: number | undefined;
}, {
    id: string;
    addedAt: number;
    name?: string | undefined;
    description?: string | undefined;
    lastUsed?: number | undefined;
}>;
export interface CompanyConfig {
    id: string;
    name?: string;
    description?: string;
    addedAt: number;
    lastUsed?: number;
}
export declare const FullConfigSchema: z.ZodObject<{
    clientId: z.ZodOptional<z.ZodString>;
    clientSecret: z.ZodOptional<z.ZodString>;
    callbackPort: z.ZodOptional<z.ZodNumber>;
    defaultCompanyId: z.ZodString;
    currentCompanyId: z.ZodString;
    companies: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        addedAt: z.ZodNumber;
        lastUsed: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        addedAt: number;
        name?: string | undefined;
        description?: string | undefined;
        lastUsed?: number | undefined;
    }, {
        id: string;
        addedAt: number;
        name?: string | undefined;
        description?: string | undefined;
        lastUsed?: number | undefined;
    }>>;
    downloadDir: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    defaultCompanyId: string;
    currentCompanyId: string;
    companies: Record<string, {
        id: string;
        addedAt: number;
        name?: string | undefined;
        description?: string | undefined;
        lastUsed?: number | undefined;
    }>;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    callbackPort?: number | undefined;
    downloadDir?: string | undefined;
}, {
    defaultCompanyId: string;
    currentCompanyId: string;
    companies: Record<string, {
        id: string;
        addedAt: number;
        name?: string | undefined;
        description?: string | undefined;
        lastUsed?: number | undefined;
    }>;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    callbackPort?: number | undefined;
    downloadDir?: string | undefined;
}>;
export interface FullConfig {
    clientId?: string;
    clientSecret?: string;
    callbackPort?: number;
    defaultCompanyId: string;
    currentCompanyId: string;
    companies: Record<string, CompanyConfig>;
    downloadDir?: string;
}
/**
 * Load full config from file
 */
export declare function loadFullConfig(): Promise<FullConfig>;
/**
 * Save full config to file
 */
export declare function saveFullConfig(config: FullConfig): Promise<void>;
/**
 * Get current company ID
 */
export declare function getCurrentCompanyId(): Promise<string>;
/**
 * Set current company
 */
export declare function setCurrentCompany(companyId: string, name?: string, description?: string): Promise<void>;
/**
 * Get company info by ID
 */
export declare function getCompanyInfo(companyId: string): Promise<CompanyConfig | null>;
/**
 * Get download directory for binary files
 * Returns configured directory or system temp directory as default
 */
export declare function getDownloadDir(): Promise<string>;
