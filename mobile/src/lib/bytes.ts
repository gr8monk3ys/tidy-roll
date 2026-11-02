/**
 * Byte formatting and size totals for the "space reclaimed" counters.
 * Pure (no native imports) so it can be unit tested under Node.
 */

/** Same output as the extension's `formatBytes` (extension/app/core.js). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[unit]}`;
}

export type SizeTotal = {
  /** Sum of every size that could be measured. */
  bytes: number;
  /** How many items had no measurable size (lookup failed or returned nothing). */
  unknown: number;
};

/**
 * Sums the sizes of `ids` using `resolveSize`. A lookup that throws or yields
 * a non-positive / non-finite value counts as unknown instead of failing the
 * whole total, so one unreadable asset never hides the rest.
 */
export async function sumKnownSizes(
  ids: readonly string[],
  resolveSize: (id: string) => Promise<number | null | undefined>
): Promise<SizeTotal> {
  const sizes = await Promise.all(
    ids.map(async (id) => {
      try {
        const size = await resolveSize(id);
        return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : null;
      } catch {
        return null;
      }
    })
  );
  let bytes = 0;
  let unknown = 0;
  for (const size of sizes) {
    if (size === null) unknown++;
    else bytes += size;
  }
  return { bytes, unknown };
}
