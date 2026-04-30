const UNSET_LABEL = '(未設定)';

/**
 * Returns the company name for display, normalizing missing or whitespace-only
 * values to the unified UNSET_LABEL. Does not fall back to other fields —
 * `name` and `display_name` are distinct in the freee API.
 */
export function formatCompanyName(name: string | null | undefined): string {
  const value = name?.trim();
  return value ? value : UNSET_LABEL;
}
