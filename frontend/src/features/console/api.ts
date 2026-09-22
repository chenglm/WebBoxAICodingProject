import { apiRequest, toQueryString } from '../../shared/api/http';
import type { DailyMenuWriteEntry, Dish, DishInput, MenuResult } from '../../shared/api/types';

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

/**
 * Read the scheduled menu for a date via the employee menu endpoint (admins
 * are authenticated too). Note: only visible dishes are returned; a dedicated
 * `GET /admin/daily-menus?date=` covering hidden dishes is a backend gap.
 */
export async function fetchDailyMenu(date: string): Promise<MenuResult> {
  const search = new URLSearchParams({ date, page: '0', size: '200' });
  return apiRequest<MenuResult>(`/menu?${search.toString()}`);
}

/** Upsert daily-menu stock for a date. */
export function saveDailyMenu(menuDate: string, dishes: DailyMenuWriteEntry[]): Promise<void> {
  return apiRequest<void>('/admin/daily-menus', {
    method: 'POST',
    body: { menuDate, dishes },
  });
}
