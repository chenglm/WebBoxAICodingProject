import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyCartAction,
  emptyCart,
  totalCents,
  totalPortions,
  type CartAction,
  type CartState,
} from './cartReducer';

interface CartContextValue {
  state: CartState;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Returns portions rejected by the 5-portion cap. */
  dispatch: (action: CartAction) => number;
  portions: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'webox.cart.v1';

function loadInitialCart(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.lines)) return emptyCart;
    return parsed;
  } catch {
    return emptyCart;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadInitialCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — cart simply becomes session-only.
    }
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      dispatch: (action) => {
        // Compute synchronously from the current state so the caller can
        // immediately learn how many portions were rejected by the cap.
        const result = applyCartAction(state, action);
        setState(result.state);
        return result.rejectedPortions;
      },
      portions: totalPortions(state),
      total: totalCents(state),
    }),
    [state, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
