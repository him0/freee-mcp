import { z } from 'zod';
/**
 * Minimal OpenAPI schema types
 * These types represent the minimized schema structure used for reduced memory consumption
 */
export declare const MinimalParameterSchema: z.ZodObject<{
    name: z.ZodString;
    in: z.ZodEnum<["path", "query"]>;
    required: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: string;
    in: "path" | "query";
    description?: string | undefined;
    required?: boolean | undefined;
}, {
    name: string;
    type: string;
    in: "path" | "query";
    description?: string | undefined;
    required?: boolean | undefined;
}>;
export interface MinimalParameter {
    name: string;
    in: 'path' | 'query';
    required?: boolean;
    description?: string;
    type: string;
}
export declare const MinimalOperationSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        in: z.ZodEnum<["path", "query"]>;
        required: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        in: "path" | "query";
        description?: string | undefined;
        required?: boolean | undefined;
    }, {
        name: string;
        type: string;
        in: "path" | "query";
        description?: string | undefined;
        required?: boolean | undefined;
    }>, "many">>;
    hasJsonBody: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    summary?: string | undefined;
    parameters?: {
        name: string;
        type: string;
        in: "path" | "query";
        description?: string | undefined;
        required?: boolean | undefined;
    }[] | undefined;
    hasJsonBody?: boolean | undefined;
}, {
    description?: string | undefined;
    summary?: string | undefined;
    parameters?: {
        name: string;
        type: string;
        in: "path" | "query";
        description?: string | undefined;
        required?: boolean | undefined;
    }[] | undefined;
    hasJsonBody?: boolean | undefined;
}>;
export interface MinimalOperation {
    summary?: string;
    description?: string;
    parameters?: MinimalParameter[];
    hasJsonBody?: boolean;
}
export declare const MinimalPathItemSchema: z.ZodObject<{
    get: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<["path", "query"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }>, "many">>;
        hasJsonBody: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }>>;
    post: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<["path", "query"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }>, "many">>;
        hasJsonBody: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }>>;
    put: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<["path", "query"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }>, "many">>;
        hasJsonBody: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }>>;
    delete: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<["path", "query"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }>, "many">>;
        hasJsonBody: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }>>;
    patch: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<["path", "query"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }, {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }>, "many">>;
        hasJsonBody: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }, {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    get?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    post?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    put?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    delete?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    patch?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
}, {
    get?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    post?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    put?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    delete?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
    patch?: {
        description?: string | undefined;
        summary?: string | undefined;
        parameters?: {
            name: string;
            type: string;
            in: "path" | "query";
            description?: string | undefined;
            required?: boolean | undefined;
        }[] | undefined;
        hasJsonBody?: boolean | undefined;
    } | undefined;
}>;
export interface MinimalPathItem {
    get?: MinimalOperation;
    post?: MinimalOperation;
    put?: MinimalOperation;
    delete?: MinimalOperation;
    patch?: MinimalOperation;
}
export declare const MinimalSchemaSchema: z.ZodObject<{
    paths: z.ZodRecord<z.ZodString, z.ZodObject<{
        get: z.ZodOptional<z.ZodObject<{
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                in: z.ZodEnum<["path", "query"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }>, "many">>;
            hasJsonBody: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }>>;
        post: z.ZodOptional<z.ZodObject<{
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                in: z.ZodEnum<["path", "query"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }>, "many">>;
            hasJsonBody: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }>>;
        put: z.ZodOptional<z.ZodObject<{
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                in: z.ZodEnum<["path", "query"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }>, "many">>;
            hasJsonBody: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }>>;
        delete: z.ZodOptional<z.ZodObject<{
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                in: z.ZodEnum<["path", "query"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }>, "many">>;
            hasJsonBody: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }>>;
        patch: z.ZodOptional<z.ZodObject<{
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                in: z.ZodEnum<["path", "query"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }, {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }>, "many">>;
            hasJsonBody: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }, {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        get?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        post?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        put?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        delete?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        patch?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
    }, {
        get?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        post?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        put?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        delete?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        patch?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    paths: Record<string, {
        get?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        post?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        put?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        delete?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        patch?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
    }>;
}, {
    paths: Record<string, {
        get?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        post?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        put?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        delete?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
        patch?: {
            description?: string | undefined;
            summary?: string | undefined;
            parameters?: {
                name: string;
                type: string;
                in: "path" | "query";
                description?: string | undefined;
                required?: boolean | undefined;
            }[] | undefined;
            hasJsonBody?: boolean | undefined;
        } | undefined;
    }>;
}>;
export interface MinimalSchema {
    paths: Record<string, MinimalPathItem>;
}
