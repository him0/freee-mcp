import { describe, it, expect } from 'vitest';
import {
  parseJsonResponse,
  createTextResponse,
  formatErrorMessage,
} from './error.js';

describe('parseJsonResponse', () => {
  it('should return success with parsed data for valid JSON', async () => {
    const mockResponse = {
      json: () => Promise.resolve({ error: 'test_error', message: 'Test message' }),
    } as Response;

    const result = await parseJsonResponse(mockResponse);

    expect(result).toEqual({
      success: true,
      data: { error: 'test_error', message: 'Test message' },
    });
  });

  it('should return failure with error message when JSON parsing fails', async () => {
    const mockResponse = {
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as Response;

    const result = await parseJsonResponse(mockResponse);

    expect(result).toEqual({
      success: false,
      error: 'Invalid JSON',
    });
  });

  it('should handle non-Error throws during JSON parsing', async () => {
    const mockResponse = {
      json: () => Promise.reject('String error'),
    } as Response;

    const result = await parseJsonResponse(mockResponse);

    expect(result).toEqual({
      success: false,
      error: 'String error',
    });
  });
});

describe('createTextResponse', () => {
  it('should create MCP text response with given text', () => {
    const result = createTextResponse('Hello, world!');

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Hello, world!',
        },
      ],
    });
  });

  it('should handle empty string', () => {
    const result = createTextResponse('');

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: '',
        },
      ],
    });
  });
});

describe('formatErrorMessage', () => {
  it('should return error message for Error instances', () => {
    const error = new Error('Test error message');
    const result = formatErrorMessage(error);

    expect(result).toBe('Test error message');
  });

  it('should convert non-Error values to string', () => {
    expect(formatErrorMessage('string error')).toBe('string error');
    expect(formatErrorMessage(123)).toBe('123');
    expect(formatErrorMessage(null)).toBe('null');
    expect(formatErrorMessage(undefined)).toBe('undefined');
  });
});
