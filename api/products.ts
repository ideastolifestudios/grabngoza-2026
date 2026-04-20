/**
 * api/products.ts — Products API Controller (Vercel Serverless)
 *
 * Actions:
 *   GET  ?action=list                    — List products (optional: ?category=Men)
 *   GET  ?action=get&id=xxx              — Get single product
 *   POST ?action=create                  — Create product
 *   POST ?action=update&id=xxx           — Update product
 *   POST ?action=delete&id=xxx           — Soft-delete (set isActive=false)
 *   POST ?action=stock&id=xxx            — Update stock level
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors';
import { success, error } from './lib/response';
import * as productService from './services/product.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;

  try {
    switch (action) {

      case 'list': {
        const category = req.query.category as string | undefined;
        const limit = Number(req.query.limit) || 100;
        const products = await productService.listProducts(limit, category);
        return success(res, { products, count: products.length });
      }

      case 'get': {
        if (!id) return error(res, 400, 'Missing id parameter');
        const product = await productService.getProduct(id);
        if (!product) return error(res, 404, 'Product not found');
        return success(res, { product });
      }

      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        const body = req.body || {};
        if (!body.name || body.price === undefined) {
          return error(res, 400, 'Missing required fields: name, price');
        }
        const product = await productService.createProduct(body);
        return success(res, { product }, 201);
      }

      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const updated = await productService.updateProduct(id, req.body || {});
        if (!updated) return error(res, 404, 'Product not found');
        return success(res, { product: updated });
      }

      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const deleted = await productService.deleteProduct(id);
        if (!deleted) return error(res, 404, 'Product not found');
        return success(res, { message: 'Product deactivated' });
      }

      case 'stock': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const { stockKey, quantity } = req.body || {};
        if (!stockKey || quantity === undefined) {
          return error(res, 400, 'Missing required fields: stockKey, quantity');
        }
        const updated = await productService.updateStock(id, stockKey, quantity);
        if (!updated) return error(res, 404, 'Product not found');
        return success(res, { message: 'Stock updated' });
      }

      default:
        return error(res, 400, `Unknown action: ${action}. Use ?action=list|get|create|update|delete|stock`);
    }
  } catch (err: any) {
    console.error(`[products/${action}]`, err);
    return error(res, 500, 'Internal server error', err.message);
  }
}
