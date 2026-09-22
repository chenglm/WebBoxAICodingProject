import { apiRequest } from '../../shared/api/http';
import type { Address, Order, OrderSubmitRequest } from '../../shared/api/types';

export function fetchAddresses(): Promise<Address[]> {
  return apiRequest<Address[]>('/me/addresses');
}

export function createAddress(input: { label?: string; address: string; isDefault?: boolean }): Promise<Address> {
  return apiRequest<Address>('/me/addresses', { method: 'POST', body: input });
}

export function submitOrder(request: OrderSubmitRequest, idempotencyKey: string): Promise<Order> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: request,
    idempotencyKey,
  });
}

export function fetchOrders(): Promise<Order[]> {
  return apiRequest<Order[]>('/orders');
}

export function fetchOrder(orderId: number): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}`);
}

export function cancelOrder(orderId: number): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
}
