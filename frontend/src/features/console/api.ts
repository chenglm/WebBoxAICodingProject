import { apiRequest, toQueryString } from '../../shared/api/http';
import type {
  DailyMenuReadResult,
  DailyMenuWriteEntry,
  Dish,
  DishInput,
} from '../../shared/api/types';

export interface AdminDishQueryParams {
  keyword: string;
  category: string | null;
}

/**
 * The contract documents no pagination for admin dish listing; normalize both
 * a plain array and a paged envelope defensively.
 */
export async function fetchAdminDishes(params: AdminDishQueryParams): Promise<Dish[]> {
  const query = toQueryString({
    q: params.keyword || undefined,
    category: params.category ?? undefined,
  });
  const payload = await apiRequest<Dish[] | { items: Dish[] }>(`/admin/dishes${query}`);
  return Array.isArray(payload) ? payload : payload.items;
}

export function createDish(body: DishInput): Promise<Dish> {
  return apiRequest<Dish>('/admin/dishes', { method: 'POST', body });
}

export function updateDish(dishId: number, body: DishInput): Promise<Dish> {
  return apiRequest<Dish>(`/admin/dishes/${dishId}`, { method: 'PUT', body });
}

export function setDishVisible(dishId: number, visible: boolean): Promise<Dish> {
  return apiRequest<Dish>(`/admin/dishes/${dishId}/visibility?visible=${visible}`, {
    method: 'PATCH',
  });
}

export function uploadDishImage(dishId: number, file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<{ imageUrl: string }>(`/admin/dishes/${dishId}/image`, {
    method: 'POST',
    formData,
  });
}

/** Read the configured daily menu (includes hidden dishes). */
export function fetchDailyMenu(date: string): Promise<DailyMenuReadResult> {
  return apiRequest<DailyMenuReadResult>(`/admin/daily-menus${toQueryString({ date })}`);
}

/**
 * Upsert daily-menu stock for a date. Merge semantics: omitted dishes are
 * kept; there is no delete — set availableQuantity to 0 to stop selling.
 */
export function saveDailyMenu(menuDate: string, dishes: DailyMenuWriteEntry[]): Promise<void> {
  return apiRequest<void>('/admin/daily-menus', {
    method: 'POST',
    body: { menuDate, dishes },
  });
}
