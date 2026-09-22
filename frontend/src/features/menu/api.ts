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

/** Visible-dish category dictionary (server endpoint, alphabetically sorted). */
export function fetchMenuCategories(): Promise<string[]> {
  return apiRequest<string[]>('/menu/categories');
}

/** Server-resolved nearest orderable slot (authoritative over client time). */
export function fetchSlotSuggestion(): Promise<SlotSuggestion> {
  return apiRequest<SlotSuggestion>('/orders/suggestion');
}
