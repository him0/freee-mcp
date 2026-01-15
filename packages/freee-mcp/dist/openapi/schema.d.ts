import { z } from 'zod';
import { MinimalParameter } from './minimal-types.js';
export declare function convertParameterToZodSchema(parameter: MinimalParameter): z.ZodType;
export declare function convertPathToToolName(path: string): string;
export declare function sanitizePropertyName(name: string): string;
