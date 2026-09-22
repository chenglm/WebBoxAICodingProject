import { describe, expect, it } from 'vitest';
import { addDays, isSlotOpen, resolveSuggestedSlot, todayInBusinessZone } from './mealSlot';

// All instants are UTC; Asia/Shanghai is UTC+8 (no DST).
// 2026-09-22 is a Tuesday.

describe('resolveSuggestedSlot', () => {
  it('suggests today lunch before 10:00 Shanghai', () => {
    // 09:00 Shanghai = 01:00 UTC
    const now = new Date('2026-09-22T01:00:00Z');
    expect(resolveSuggestedSlot(now)).toEqual({ date: '2026-09-22', mealPeriod: 'LUNCH' });
  });

  it('suggests today dinner at exactly 10:00 Shanghai (lunch closed)', () => {
    // 10:00 Shanghai = 02:00 UTC
    const now = new Date('2026-09-22T02:00:00Z');
    expect(resolveSuggestedSlot(now)).toEqual({ date: '2026-09-22', mealPeriod: 'DINNER' });
  });

  it('suggests tomorrow lunch at exactly 15:00 Shanghai (dinner closed)', () => {
    // 15:00 Shanghai = 07:00 UTC
    const now = new Date('2026-09-22T07:00:00Z');
    expect(resolveSuggestedSlot(now)).toEqual({ date: '2026-09-23', mealPeriod: 'LUNCH' });
  });

  it('crosses month boundary after dinner cutoff on the last day', () => {
    // 2026-09-30 16:00 Shanghai = 08:00 UTC
    const now = new Date('2026-09-30T08:00:00Z');
    expect(resolveSuggestedSlot(now)).toEqual({ date: '2026-10-01', mealPeriod: 'LUNCH' });
  });
});

describe('isSlotOpen', () => {
  const atNine = new Date('2026-09-22T01:00:00Z'); // 09:00 Shanghai

  it('rejects past dates', () => {
    expect(isSlotOpen('2026-09-21', 'DINNER', atNine)).toBe(false);
  });

  it('allows future dates', () => {
    expect(isSlotOpen('2026-09-25', 'LUNCH', atNine)).toBe(true);
  });

  it('applies lunch cutoff at 10:00', () => {
    expect(isSlotOpen('2026-09-22', 'LUNCH', atNine)).toBe(true);
    const atTen = new Date('2026-09-22T02:00:00Z');
    expect(isSlotOpen('2026-09-22', 'LUNCH', atTen)).toBe(false);
  });

  it('applies dinner cutoff at 15:00', () => {
    const atFourteen = new Date('2026-09-22T06:00:00Z'); // 14:00 Shanghai
    expect(isSlotOpen('2026-09-22', 'DINNER', atFourteen)).toBe(true);
    const atFifteen = new Date('2026-09-22T07:00:00Z');
    expect(isSlotOpen('2026-09-22', 'DINNER', atFifteen)).toBe(false);
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-09-22', 1)).toBe('2026-09-23');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('todayInBusinessZone', () => {
  it('returns the Shanghai calendar date', () => {
    // 2026-09-22 23:30 UTC is already 2026-09-23 07:30 in Shanghai
    expect(todayInBusinessZone(new Date('2026-09-22T23:30:00Z'))).toBe('2026-09-23');
  });
});
