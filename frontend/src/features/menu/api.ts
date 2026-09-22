import { apiRequest } from '../../shared/api/http';
import type { Dish, MenuResult, SlotSuggestion } from '../../shared/api/types';

export interface MenuQueryParams {
  keyword: string;
  categories: string[];
  /** Zero-based page index expected by the backend. */
  page: number;
  size: number;
  date?: string;
}

export function fetchMenu(params: MenuQueryParams): Promise<MenuResult> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.keyword) search.set('q', params.keyword);
  for (const category of params.categories) {
    search.append('categories', category);
  }
  search.set('page', String(params.page));
  search.set('size', String(params.size));
  return apiRequest<MenuResult>(`/menu?${search.toString()}`);
}

export function fetchDishDetail(dishId: number, date?: string): Promise<Dish> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest<Dish>(`/menu/${dishId}${query}`);
}

/**
 * No categories dictionary endpoint exists yet; derive distinct categories
 * from a broad menu fetch. Track as a backend contract gap.
 */
export async function fetchMenuCategories(): Promise<string[]> {
  const result = await fetchMenu({ keyword: '', categories: [], page: 0, size: 100 });
  return [...new Set(result.items.map((d) => d.category).filter(Boolean))].sort();
}

/** Server-resolved nearest orderable slot (authoritative over client time). */
export function fetchSlotSuggestion(): Promise<SlotSuggestion> {
  return apiRequest<SlotSuggestion>('/orders/suggestion');
}
