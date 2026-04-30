import { describe, expect, it } from 'vitest';
import { formatCompanyName } from './format-company.js';

describe('formatCompanyName', () => {
  it('returns the trimmed name when present', () => {
    expect(formatCompanyName('Acme Co.')).toBe('Acme Co.');
    expect(formatCompanyName('  Acme Co.  ')).toBe('Acme Co.');
  });

  it('returns the unified label for missing values', () => {
    expect(formatCompanyName(undefined)).toBe('(未設定)');
    expect(formatCompanyName(null)).toBe('(未設定)');
  });

  it('returns the unified label for empty or whitespace-only values', () => {
    expect(formatCompanyName('')).toBe('(未設定)');
    expect(formatCompanyName('   ')).toBe('(未設定)');
  });
});
