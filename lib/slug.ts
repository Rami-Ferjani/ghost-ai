export function slugFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Keep the Latin pipeline unchanged; fall back to the trimmed original
  // lowercased for non-Latin names (e.g. 東京), then to 'project' as the
  // final fallback so the slug is always non-empty.
  return slug || name.trim().toLowerCase() || 'project';
}
