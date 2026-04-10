import { describe, expect, it } from 'vitest';

import { parseTimestampRanges, timestampToSeconds, totalDuration } from '@/lib/timestamps';

describe('timestamps utils', () => {
  it('converts mm:ss and hh:mm:ss to seconds', () => {
    expect(timestampToSeconds('01:30')).toBe(90);
    expect(timestampToSeconds('01:02:03')).toBe(3723);
  });

  it('parses and sorts timestamp ranges', () => {
    const segments = parseTimestampRanges('02:00-02:10\n00:10-00:20');
    expect(segments).toEqual([
      { startSeconds: 10, endSeconds: 20 },
      { startSeconds: 120, endSeconds: 130 },
    ]);
  });

  it('blocks overlapping ranges', () => {
    expect(() => parseTimestampRanges('00:10-00:20\n00:19-00:21')).toThrowError(/sobrepostos/i);
  });

  it('calculates total duration', () => {
    const total = totalDuration([
      { startSeconds: 0, endSeconds: 10 },
      { startSeconds: 20, endSeconds: 30 },
    ]);
    expect(total).toBe(20);
  });
});
