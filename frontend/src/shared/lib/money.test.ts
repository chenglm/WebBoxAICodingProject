import { describe, expect, it } from 'vitest';
import { centsToYuan, formatCents, sumCents, yuanToCents } from './money';

describe('formatCents', () => {
  it('formats whole yuan', () => {
    expect(formatCents(2200)).toBe('¥22.00');
  });

  it('formats cents with padding', () => {
    expect(formatCents(5)).toBe('¥0.05');
    expect(formatCents(2250)).toBe('¥22.50');
  });

  it('formats zero', () => {
    expect(formatCents(0)).toBe('¥0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCents(-150)).toBe('-¥1.50');
  });

  it('truncates fractional cents defensively', () => {
    expect(formatCents(2250.9)).toBe('¥22.50');
  });
});

describe('yuanToCents', () => {
  it('converts yuan to integer cents', () => {
    expect(yuanToCents(19.99)).toBe(1999);
    expect(yuanToCents(35)).toBe(3500);
  });

  it('rounds half up', () => {
    expect(yuanToCents(0.105)).toBe(11);
  });
});

describe('centsToYuan', () => {
  it('converts back for inputs', () => {
    expect(centsToYuan(2250)).toBe(22.5);
  });
});

describe('sumCents', () => {
  it('sums integer cents without float drift', () => {
    expect(sumCents([1999, 1, 50])).toBe(2050);
  });
});
