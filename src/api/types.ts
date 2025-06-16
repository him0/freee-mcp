export type OpenAPIRequestBodyContentSchema = {
  required?: string[];
  type: 'object';
  properties: {
    [key: string]: {
      type?: string;
      format?: string;
      description?: string;
      example?: string | number | boolean | (string | number | boolean)[];
      enum?: string[] | number[];
      minimum?: number | string;
      maximum?: number | string;
    };
  };
};

export type OpenAPIRequestBody = {
  content: {
    'application/json'?: {
      schema: { $ref: string } | OpenAPIRequestBodyContentSchema;
    };
    'multipart/form-data'?: {
      schema: { $ref: string } | OpenAPIRequestBodyContentSchema;
    };
  };
};

export type OpenAPIParameter = {
  name: string;
  in: string;
  schema?: {
    type: string;
    format?: string;
  };
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
};

export type OpenAPIOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, unknown>;
};

export type OpenAPIPathItem = {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
};