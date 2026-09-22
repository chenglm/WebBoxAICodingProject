import type { MealPeriod } from '../lib/mealSlot';
import type { SpiceLevel, TastePreference } from '../lib/constants';

/**
 * API DTO types mirroring docs/BACKEND_API.md (the authoritative contract).
 * All money fields are integer cents. Base path is `/api`.
 */

export type Role = 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface OptionItem {
  id: number;
  name: string;
  extraPriceCents: number;
}

export interface OptionGroup {
  id: number;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  items: OptionItem[];
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  category: string;
  protein: string | null;
  spiceLevel: SpiceLevel;
  priceCents: number;
  imageUrl: string | null;
  /** false = hidden from employees (admin "unlisted"). */
  visible: boolean;
  allergens: string[];
  optionGroups: OptionGroup[];
  /** Present on employee menu queries: remaining orderable stock for the day. */
  availableQuantity?: number;
}

/** `GET /menu` response. `page` is zero-based on the wire. */
export interface MenuResult {
  items: Dish[];
  total: number;
  page: number;
  size: number;
  menuDate: string;
}

export interface Address {
  id: number;
  label: string | null;
  address: string;
  isDefault: boolean;
}

/** `GET/PUT /me/preferences` payload. */
export interface Preferences {
  preferredCategories: string[];
  spicePreference: SpiceLevel | null;
  tastePreference: TastePreference | null;
  budgetCents: number | null;
  allergens: string[];
  recommendedEnabled: boolean;
}

/** `GET /orders/suggestion` response. */
export interface SlotSuggestion {
  deliveryDate: string;
  mealPeriod: MealPeriod;
}

export interface OrderItemOptionSnapshot {
  name: string;
  extraPriceCents: number;
}

export interface OrderItem {
  dishId: number;
  dishName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  options: OrderItemOptionSnapshot[];
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface Order {
  id: number;
  /** Stable display identifier, e.g. "WB-00000042". */
  orderNumber: string;
  deliveryDate: string;
  mealPeriod: MealPeriod;
  status: OrderStatus;
  totalCents: number;
  addressSnapshot: string;
  items: OrderItem[];
}

export interface OrderSubmitItem {
  dishId: number;
  quantity: number;
  optionItemIds: number[];
}

export interface OrderSubmitRequest {
  /** Optional: server picks the nearest orderable slot when omitted. */
  deliveryDate?: string;
  mealPeriod?: MealPeriod;
  /** Existing owned address id, or omit and send `deliveryAddress`. */
  addressId?: number;
  /** Free-text delivery address (<= 200 chars) when not using `addressId`. */
  deliveryAddress?: string;
  items: OrderSubmitItem[];
}

/** Admin `DishInput` for create/replace. */
export interface DishInput {
  name: string;
  description: string;
  category: string;
  protein: string | null;
  spiceLevel: SpiceLevel;
  priceCents: number;
  imageUrl: string | null;
  visible: boolean;
  allergens: string[];
  optionGroups: {
    name: string;
    required: boolean;
    minSelections: number;
    maxSelections: number;
    items: { name: string; extraPriceCents: number }[];
  }[];
}

/** `GET /admin/daily-menus?date=` response. */
export interface DailyMenuReadResult {
  menuDate: string;
  items: Dish[];
}

export interface DailyMenuWriteEntry {
  dishId: number;
  availableQuantity: number;
}
