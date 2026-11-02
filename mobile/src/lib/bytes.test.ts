import { describe, expect, it } from 'vitest';
import { formatBytes, sumKnownSizes } from './bytes';

describe('formatBytes', () => {
  it('returns 0 B for zero, negative and non-finite input', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });

  it('keeps whole bytes below 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('uses one decimal below 100 of a unit and rounds above', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(3.25 * 1024 * 1024)).toBe('3.3 MB');
    expect(formatBytes(150 * 1024 * 1024)).toBe('150 MB');
    expect(formatBytes(2 * 1024 ** 3)).toBe('2.0 GB');
  });
});

describe('sumKnownSizes', () => {
  it('sums every resolved size', async () => {
    const sizes: Record<string, number> = { a: 100, b: 250, c: 50 };
    await expect(sumKnownSizes(['a', 'b', 'c'], async (id) => sizes[id])).resolves.toEqual({
      bytes: 400,
      unknown: 0,
    });
  });

  it('counts failed or empty lookups as unknown without dropping the rest', async () => {
    const total = await sumKnownSizes(['ok', 'throws', 'missing', 'zero', 'nan'], async (id) => {
      if (id === 'ok') return 1000;
      if (id === 'throws') throw new Error('not readable');
      if (id === 'missing') return null;
      if (id === 'zero') return 0;
      return Number.NaN;
    });
    expect(total).toEqual({ bytes: 1000, unknown: 4 });
  });

  it('returns an empty total for no ids', async () => {
    await expect(sumKnownSizes([], async () => 1)).resolves.toEqual({ bytes: 0, unknown: 0 });
  });
});
