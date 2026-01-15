/**
 * Response type for binary file downloads
 */
export interface BinaryFileResponse {
    type: 'binary';
    filePath: string;
    mimeType: string;
    size: number;
}
export declare function makeApiRequest(method: string, apiPath: string, params?: Record<string, unknown>, body?: Record<string, unknown>, baseUrl?: string): Promise<unknown | BinaryFileResponse>;
