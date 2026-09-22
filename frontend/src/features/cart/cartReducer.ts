import { MAX_TOTAL_PORTIONS } from '../../shared/lib/constants';
import { sumCents } from '../../shared/lib/money';

/**
 * Client-side cart model. The cart lives in the browser until checkout; the
 * backend recomputes prices and validates everything at submit time, so these
 * numbers are display-only.
 */

export interface CartLineOption {
  groupId: number;
  itemId: number;
  name: string;
  extraPriceCents: number;
}

export interface CartLine {
  /** dishId + sorted option item ids — identical configurations merge. */
  key: string;
  dishId: number;
  dishName: string;
  imageUrl: string | null;
  basePriceCents: number;
  options: CartLineOption[];
  quantity: number;
}

export type CartState = { lines: CartLine[] };

export const emptyCart: CartState = { lines: [] };

export function lineKey(dishId: number, optionItemIds: number[]): string {
  const sorted = [...optionItemIds].sort((a, b) => a - b);
  return `${dishId}#${sorted.join(',')}`;
}

export function lineUnitPriceCents(line: CartLine): number {
  return line.basePriceCents + sumCents(line.options.map((o) => o.extraPriceCents));
}

export function lineSubtotalCents(line: CartLine): number {
  return lineUnitPriceCents(line) * line.quantity;
}

export function totalPortions(state: CartState): number {
  return state.lines.reduce((acc, line) => acc + line.quantity, 0);
}

export function totalCents(state: CartState): number {
  return sumCents(state.lines.map(lineSubtotalCents));
}

export type CartAction =
  | { type: 'ADD'; line: Omit<CartLine, 'key' | 'quantity'>; quantity: number }
  | { type: 'SET_QUANTITY'; key: string; quantity: number }
  | { type: 'REMOVE'; key: string }
  | { type: 'CLEAR' };

export interface CartResult {
  state: CartState;
  /** Portions that could not be added because of the 5-portion cap. */
  rejectedPortions: number;
}

function clampToCap(lines: CartLine[], index: number, desiredQuantity: number): CartResult {
  const others = lines.reduce((acc, l, i) => (i === index ? acc : acc + l.quantity), 0);
  const allowed = Math.max(0, Math.min(desiredQuantity, MAX_TOTAL_PORTIONS - others));
  const rejected = desiredQuantity - allowed;
  if (allowed <= 0) {
    return { state: { lines: lines.filter((_, i) => i !== index) }, rejectedPortions: rejected };
  }
  const next = lines.map((l, i) => (i === index ? { ...l, quantity: allowed } : l));
  return { state: { lines: next }, rejectedPortions: rejected };
}

export function applyCartAction(state: CartState, action: CartAction): CartResult {
  switch (action.type) {
    case 'ADD': {
      const key = lineKey(
        action.line.dishId,
        action.line.options.map((o) => o.itemId),
      );
      const existingIndex = state.lines.findIndex((l) => l.key === key);
      if (existingIndex >= 0) {
        // Same dish + same configuration: merge quantities.
        const desired = state.lines[existingIndex].quantity + action.quantity;
        return clampToCap(state.lines, existingIndex, desired);
      }
      const lines = [...state.lines, { ...action.line, key, quantity: 0 }];
      return clampToCap(lines, lines.length - 1, action.quantity);
    }
    case 'SET_QUANTITY': {
      const index = state.lines.findIndex((l) => l.key === action.key);
      if (index < 0) return { state, rejectedPortions: 0 };
      if (action.quantity <= 0) {
        return {
          state: { lines: state.lines.filter((_, i) => i !== index) },
          rejectedPortions: 0,
        };
      }
      return clampToCap(state.lines, index, action.quantity);
    }
    case 'REMOVE':
      return {
        state: { lines: state.lines.filter((l) => l.key !== action.key) },
        rejectedPortions: 0,
      };
    case 'CLEAR':
      return { state: emptyCart, rejectedPortions: 0 };
  }
}
