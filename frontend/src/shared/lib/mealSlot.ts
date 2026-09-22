/**
 * Meal period and cutoff rules.
 *
 * Business rules (Asia/Shanghai):
 * - Lunch cutoff 10:00, dinner cutoff 15:00.
 * - The suggested slot is the nearest orderable one: today's lunch before
 *   10:00, then today's dinner before 15:00, otherwise tomorrow's lunch.
 *
 * The backend remains the final authority on slot resolution; these helpers
 * drive client-side display and option disabling only.
 */

export type MealPeriod = 'LUNCH' | 'DINNER';

export interface MealSlot {
  /** YYYY-MM-DD in Asia/Shanghai */
  date: string;
  mealPeriod: MealPeriod;
}

export const BUSINESS_TIME_ZONE = 'Asia/Shanghai';
export const LUNCH_CUTOFF_HOUR = 10;
export const DINNER_CUTOFF_HOUR = 15;

interface ShanghaiParts {
  date: string;
  hour: number;
}

function shanghaiParts(now: Date): ShanghaiParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number.parseInt(get('hour'), 10),
  };
}

/** Add whole days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map((v) => Number.parseInt(v, 10));
  const utc = Date.UTC(y, m - 1, d + days);
  const out = new Date(utc);
  const mm = String(out.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(out.getUTCDate()).padStart(2, '0');
  return `${out.getUTCFullYear()}-${mm}-${dd}`;
}

/** Today as YYYY-MM-DD in Asia/Shanghai. */
export function todayInBusinessZone(now: Date = new Date()): string {
  return shanghaiParts(now).date;
}

/** Nearest orderable slot given the current time. */
export function resolveSuggestedSlot(now: Date = new Date()): MealSlot {
  const { date, hour } = shanghaiParts(now);
  if (hour < LUNCH_CUTOFF_HOUR) {
    return { date, mealPeriod: 'LUNCH' };
  }
  if (hour < DINNER_CUTOFF_HOUR) {
    return { date, mealPeriod: 'DINNER' };
  }
  return { date: addDays(date, 1), mealPeriod: 'LUNCH' };
}

/** Whether a slot is still open for ordering at the given time. */
export function isSlotOpen(date: string, mealPeriod: MealPeriod, now: Date = new Date()): boolean {
  const { date: today, hour } = shanghaiParts(now);
  if (date < today) return false;
  if (date > today) return true;
  if (mealPeriod === 'LUNCH') return hour < LUNCH_CUTOFF_HOUR;
  return hour < DINNER_CUTOFF_HOUR;
}
