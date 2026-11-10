import { describe, expect, it } from 'vitest';
import { pagingCursor, progressAfterRemoval, startingProgress, type StoredProgress } from './progress';

const stored = (over: Partial<StoredProgress> = {}): StoredProgress => ({ cursor: 50, after: 'a50', updatedAt: 1, ...over });

describe('startingProgress', () => {
  it('starts from the top with no saved progress', () => {
    expect(startingProgress(undefined, false)).toEqual({ cursor: 0, after: undefined });
  });

  it('resumes unfinished progress', () => {
    expect(startingProgress(stored(), false)).toEqual({ cursor: 50, after: 'a50' });
  });

  it('starts over on an explicit restart', () => {
    expect(startingProgress(stored(), true)).toEqual({ cursor: 0, after: undefined });
  });

  it('starts over when the scope was already completed', () => {
    expect(startingProgress(stored({ completed: true }), false)).toEqual({ cursor: 0, after: undefined });
  });
});

describe('pagingCursor', () => {
  it('is the last asset id on iOS and the offset on Android', () => {
    expect(pagingCursor('ios', 12, 'asset-12')).toBe('asset-12');
    expect(pagingCursor('android', 12, '99812')).toBe('12');
  });
});

describe('progressAfterRemoval', () => {
  it('is unchanged when nothing was removed', () => {
    const s = stored();
    expect(progressAfterRemoval(s, [], 'x', 'ios', 9)).toBe(s);
  });

  it('lowers the reviewed count by the number removed so later items are not skipped', () => {
    expect(progressAfterRemoval(stored(), ['a3', 'a7'], undefined, 'ios', 9)).toEqual({
      cursor: 48,
      after: 'a50',
      updatedAt: 9,
    });
  });

  it('moves an iOS cursor off a removed asset to the fallback', () => {
    expect(progressAfterRemoval(stored(), ['a49', 'a50'], 'a48', 'ios', 9).after).toBe('a48');
    expect(progressAfterRemoval(stored(), ['a50'], undefined, 'ios', 9).after).toBeUndefined();
  });

  it('keeps the Android cursor equal to the offset of the next unreviewed item', () => {
    const next = progressAfterRemoval(stored({ after: '50' }), ['a1', 'a2', 'a3'], undefined, 'android', 9);
    expect(next.cursor).toBe(47);
    expect(next.after).toBe('47');
    expect(progressAfterRemoval(stored({ cursor: 2, after: '2' }), ['a1', 'a2'], undefined, 'android', 9).after).toBeUndefined();
  });

  it('never goes below zero and leaves non-paged scopes without a cursor', () => {
    const next = progressAfterRemoval(stored({ cursor: 1, after: undefined }), ['a', 'b'], 'x', 'ios', 9);
    expect(next.cursor).toBe(0);
    expect(next.after).toBeUndefined();
  });

  it('preserves the completed flag', () => {
    expect(progressAfterRemoval(stored({ completed: true }), ['a50'], 'a49', 'ios', 9).completed).toBe(true);
  });
});
