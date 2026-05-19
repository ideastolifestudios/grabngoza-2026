/**
 * src/utils/storeApi.ts — Frontend API client for /api/store-api
 *
 * Typed helper functions for all store-api endpoints.
 * Import and use in any React component.
 *
 * Usage:
 *   import { storeApi } from '../utils/storeApi';
 *   const { shipping } = await storeApi.shipping.calculate('Sandton', 'Gauteng', 850);
 *   const { order, zoho, crm } = await storeApi.orders.create({ ... });
 */

const BASE = '/api/store-api';

async function request<T = any>(
  resource: string,
  action: string,
  opts: {
    method?: 'GET' | 'POST';
    body?: any;
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = 'GET', body, params = {} } = opts;

  const query = new URLSearchParams({ resource, action, ...params });
  const url = `${BASE}?${query.toString()}`;

  const res = await fetch(url, {
    method,
    ...(body ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : {}),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    const err = new Error(data.error || `API error ${res.status}`);
    (err as any).status = res.status;
    (err as any).validationErrors = data.validationErrors;
    (err as any).data = data;
    throw err;
  }

  return data;
}

// ─── Shipping ───────────────────────────────────────────────────

export const shipping = {
  /** Calculate shipping cost for a specific location */
  async calculate(city: string, province: string, orderTotal: number, postalCode?: string) {
    return request<{
      success: boolean;
      shipping: {
        cost: number;
        estimated_days: string;
        zone: string;
        free_shipping: boolean;
        method: string;
      };
    }>('shipping', 'calculate', {
      method: 'POST',
      body: { city, province, postal_code: postalCode, order_total: orderTotal },
    });
  },

  /** Get all zone rates for a given total (for displaying rate table) */
  async getAllRates(orderTotal: number) {
    return request<{
      success: boolean;
      rates: Array<{
        cost: number;
        estimated_days: string;
        zone: string;
        free_shipping: boolean;
        method: string;
      }>;
      free_shipping_threshold: number;
    }>('shipping', 'rates', { params: { total: String(orderTotal) } });
  },
};

// ─── Orders ─────────────────────────────────────────────────────

export const orders = {
  /** Create a pending order (before payment) */
  async create(orderData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      selectedVariants?: Record<string, string>;
    }>;
    shippingCost: number;
    total: number;
    deliveryMethod?: string;
    deliveryAddress?: Record<string, string>;
  }) {
    return request<{
      success: boolean;
      order: any;
    }>('orders', 'create', { method: 'POST', body: orderData });
  },

  /** Confirm order after payment success → triggers Zoho CRM + Inventory sync */
  async confirm(orderId: string, paymentRef?: string) {
    return request<{
      success: boolean;
      order: any;
      zoho: any;
      crm: any;
    }>('orders', 'confirm', {
      method: 'POST',
      body: { orderId, paymentRef },
    });
  },

  /** Simulate payment for testing (dev only) */
  async simulatePayment(orderId: string, status: 'success' | 'failed') {
    return request<{
      success: boolean;
      order: any;
      zoho?: any;
      crm?: any;
      payment: { status: string; simulated: boolean };
    }>('orders', 'simulate-payment', {
      method: 'POST',
      body: { orderId, paymentStatus: status },
    });
  },

  /** List orders */
  async list(opts?: { status?: string; limit?: number }) {
    const params: Record<string, string> = {};
    if (opts?.status) params.status = opts.status;
    if (opts?.limit) params.limit = String(opts.limit);
    return request<{ success: boolean; orders: any[]; count: number }>('orders', 'list', { params });
  },

  /** Get order by ID */
  async get(id: string) {
    return request<{ success: boolean; order: any }>('orders', 'get', { params: { id } });
  },

  /** Get order stats */
  async stats() {
    return request<{ success: boolean; stats: any }>('orders', 'stats');
  },
};

// ─── Customers ──────────────────────────────────────────────────

export const customers = {
  async list(limit = 50) {
    return request('customers', 'list', { params: { limit: String(limit) } });
  },
  async get(id: string) {
    return request('customers', 'get', { params: { id } });
  },
  async findByEmail(email: string) {
    return request('customers', 'find', { params: { email } });
  },
  async create(data: { email: string; firstName: string; lastName: string; phone?: string }) {
    return request('customers', 'create', { method: 'POST', body: data });
  },
};

// ─── Products ───────────────────────────────────────────────────

export const products = {
  async list(opts?: { category?: string; limit?: number }) {
    const params: Record<string, string> = {};
    if (opts?.category) params.category = opts.category;
    if (opts?.limit) params.limit = String(opts.limit);
    return request('products', 'list', { params });
  },
  async get(id: string) {
    return request('products', 'get', { params: { id } });
  },
};

// ─── Bundled export ─────────────────────────────────────────────

export const storeApi = { shipping, orders, customers, products };
export default storeApi;
