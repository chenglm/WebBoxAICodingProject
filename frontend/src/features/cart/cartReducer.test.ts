import { describe, expect, it } from 'vitest';
import {
  applyCartAction,
  emptyCart,
  lineKey,
  lineSubtotalCents,
  lineUnitPriceCents,
  totalCents,
  totalPortions,
  type CartLine,
} from './cartReducer';

const baseLine = {
  dishId: 1,
  dishName: 'Kung Pao Chicken',
  imageUrl: null,
  basePriceCents: 2250,
};

const largeOption = { groupId: 10, itemId: 101, name: 'Large', extraPriceCents: 300 };

function lineWith(options: CartLine['options'], quantity: number): CartLine {
  return {
    ...baseLine,
    options,
    quantity,
    key: lineKey(baseLine.dishId, options.map((o) => o.itemId)),
  };
}

describe('lineKey', () => {
  it('is order-independent for option ids', () => {
    expect(lineKey(1, [3, 1, 2])).toBe(lineKey(1, [1, 2, 3]));
  });

  it('differs across dishes and configurations', () => {
    expect(lineKey(1, [1])).not.toBe(lineKey(2, [1]));
    expect(lineKey(1, [1])).not.toBe(lineKey(1, [2]));
  });
});

describe('ADD merging', () => {
  it('merges same dish with same configuration', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 1 });
    const second = applyCartAction(first.state, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 2 });
    expect(second.state.lines).toHaveLength(1);
    expect(second.state.lines[0].quantity).toBe(3);
  });

  it('keeps different configurations as separate lines', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 1 });
    const second = applyCartAction(first.state, {
      type: 'ADD',
      line: { ...baseLine, options: [largeOption] },
      quantity: 1,
    });
    expect(second.state.lines).toHaveLength(2);
  });
});

describe('pricing', () => {
  it('includes option extras in unit price and subtotal', () => {
    const line = lineWith([largeOption], 2);
    expect(lineUnitPriceCents(line)).toBe(2550);
    expect(lineSubtotalCents(line)).toBe(5100);
  });
});

describe('5-portion cap', () => {
  it('clamps additions beyond five total portions', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 4 });
    const second = applyCartAction(first.state, {
      type: 'ADD',
      line: { ...baseLine, dishId: 2, dishName: 'Mapo Tofu', options: [] },
      quantity: 3,
    });
    expect(totalPortions(second.state)).toBe(5);
    expect(second.rejectedPortions).toBe(2);
  });

  it('rejects additions when the cap is already reached', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 5 });
    const second = applyCartAction(first.state, {
      type: 'ADD',
      line: { ...baseLine, dishId: 2, dishName: 'Mapo Tofu', options: [] },
      quantity: 1,
    });
    expect(second.state.lines).toHaveLength(1);
    expect(second.rejectedPortions).toBe(1);
  });

  it('clamps SET_QUANTITY so other lines stay protected', () => {
    let result = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 3 });
    result = applyCartAction(result.state, {
      type: 'ADD',
      line: { ...baseLine, dishId: 2, dishName: 'Mapo Tofu', options: [] },
      quantity: 1,
    });
    const key = lineKey(1, []);
    const updated = applyCartAction(result.state, { type: 'SET_QUANTITY', key, quantity: 10 });
    expect(totalPortions(updated.state)).toBe(5);
  });
});

describe('SET_QUANTITY / REMOVE / CLEAR', () => {
  it('removes a line when quantity is set to zero', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 2 });
    const removed = applyCartAction(first.state, { type: 'SET_QUANTITY', key: lineKey(1, []), quantity: 0 });
    expect(removed.state.lines).toHaveLength(0);
  });

  it('removes by key and clears the cart', () => {
    const first = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 2 });
    const removed = applyCartAction(first.state, { type: 'REMOVE', key: lineKey(1, []) });
    expect(removed.state.lines).toHaveLength(0);

    const again = applyCartAction(first.state, { type: 'CLEAR' });
    expect(again.state).toEqual(emptyCart);
  });
});

describe('totals', () => {
  it('computes total cents across lines', () => {
    let result = applyCartAction(emptyCart, { type: 'ADD', line: { ...baseLine, options: [] }, quantity: 1 });
    result = applyCartAction(result.state, {
      type: 'ADD',
      line: { ...baseLine, dishId: 2, dishName: 'Mapo Tofu', basePriceCents: 1800, options: [largeOption] },
      quantity: 2,
    });
    // 2250*1 + (1800+300)*2 = 6450
    expect(totalCents(result.state)).toBe(6450);
    expect(totalPortions(result.state)).toBe(3);
  });
});
