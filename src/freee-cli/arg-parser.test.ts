import { describe, it, expect } from 'vitest';
import { parseArgs } from './arg-parser.js';

describe('parseArgs', () => {
  it('parses subcommand only', () => {
    const result = parseArgs(['get']);
    expect(result.subcommand).toBe('get');
    expect(result.positional).toEqual([]);
    expect(result.flags.query).toEqual([]);
  });

  it('parses subcommand with positional path', () => {
    const result = parseArgs(['get', '/api/1/deals']);
    expect(result.subcommand).toBe('get');
    expect(result.positional).toEqual(['/api/1/deals']);
  });

  it('parses -s service flag', () => {
    const result = parseArgs(['get', '/api/1/deals', '-s', 'accounting']);
    expect(result.flags.service).toBe('accounting');
  });

  it('parses --service long flag', () => {
    const result = parseArgs(['post', '/api/1/deals', '--service', 'hr']);
    expect(result.flags.service).toBe('hr');
  });

  it('parses -d data flag', () => {
    const json = '{"issue_date":"2024-01-01"}';
    const result = parseArgs(['post', '/api/1/deals', '-d', json]);
    expect(result.flags.data).toBe(json);
  });

  it('parses multiple -q query flags', () => {
    const result = parseArgs(['get', '/api/1/deals', '-q', 'limit=10', '-q', 'partner_id=123']);
    expect(result.flags.query).toEqual(['limit=10', 'partner_id=123']);
  });

  it('parses -o output flag', () => {
    const result = parseArgs(['get', '/api/1/reports', '-o', 'report.pdf']);
    expect(result.flags.output).toBe('report.pdf');
  });

  it('parses --pretty flag', () => {
    const result = parseArgs(['get', '/api/1/deals', '--pretty']);
    expect(result.flags.pretty).toBe(true);
  });

  it('parses --no-pretty flag', () => {
    const result = parseArgs(['get', '/api/1/deals', '--no-pretty']);
    expect(result.flags.pretty).toBe(false);
  });

  it('parses -h help flag', () => {
    const result = parseArgs(['-h']);
    expect(result.flags.help).toBe(true);
    expect(result.subcommand).toBeNull();
  });

  it('parses --help flag', () => {
    const result = parseArgs(['--help']);
    expect(result.flags.help).toBe(true);
  });

  it('parses set-current-company flags', () => {
    const result = parseArgs(['set-current-company', '--company-id', '12345', '--name', 'My Corp']);
    expect(result.subcommand).toBe('set-current-company');
    expect(result.flags.companyId).toBe('12345');
    expect(result.flags.name).toBe('My Corp');
  });

  it('parses file-upload with positional and flags', () => {
    const result = parseArgs(['file-upload', '/path/to/file.pdf', '--description', 'test memo', '--partner-name', 'Vendor']);
    expect(result.subcommand).toBe('file-upload');
    expect(result.positional).toEqual(['/path/to/file.pdf']);
    expect(result.flags.description).toBe('test memo');
    expect(result.flags.partnerName).toBe('Vendor');
  });

  it('parses complex api command', () => {
    const result = parseArgs([
      'post', '/api/1/deals',
      '-s', 'accounting',
      '-d', '{"issue_date":"2024-01-01"}',
      '-q', 'company_id=123',
      '--pretty',
    ]);
    expect(result.subcommand).toBe('post');
    expect(result.positional).toEqual(['/api/1/deals']);
    expect(result.flags.service).toBe('accounting');
    expect(result.flags.data).toBe('{"issue_date":"2024-01-01"}');
    expect(result.flags.query).toEqual(['company_id=123']);
    expect(result.flags.pretty).toBe(true);
  });

  it('returns null subcommand for empty args', () => {
    const result = parseArgs([]);
    expect(result.subcommand).toBeNull();
  });

  it('handles flags before subcommand', () => {
    const result = parseArgs(['-h', 'get']);
    expect(result.flags.help).toBe(true);
    expect(result.subcommand).toBe('get');
  });

  it('ignores unknown flags', () => {
    const result = parseArgs(['get', '/api/1/deals', '--unknown', 'value']);
    expect(result.subcommand).toBe('get');
    expect(result.positional).toEqual(['/api/1/deals', 'value']);
  });
});
