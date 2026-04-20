/**
 * api/customers.ts — Customers API Controller (Vercel Serverless)
 *
 * Actions:
 *   GET  ?action=list              — List customers
 *   GET  ?action=get&id=xxx        — Get customer by ID
 *   GET  ?action=find&email=xxx    — Find customer by email
 *   POST ?action=create            — Create customer
 *   POST ?action=update&id=xxx     — Update customer
 *   POST ?action=delete&id=xxx     — Delete customer
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors.ts';
import { success, error } from './lib/response.ts';
import * as customerService from './services/customer.service.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;

  try {
    switch (action) {

      case 'list': {
        const limit = Number(req.query.limit) || 50;
        const customers = await customerService.listCustomers(limit);
        return success(res, { customers, count: customers.length });
      }

      case 'get': {
        if (!id) return error(res, 400, 'Missing id parameter');
        const customer = await customerService.getCustomer(id);
        if (!customer) return error(res, 404, 'Customer not found');
        return success(res, { customer });
      }

      case 'find': {
        const email = req.query.email as string;
        if (!email) return error(res, 400, 'Missing email parameter');
        const customer = await customerService.getCustomerByEmail(email);
        if (!customer) return error(res, 404, 'Customer not found');
        return success(res, { customer });
      }

      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        const body = req.body || {};
        if (!body.email || !body.firstName || !body.lastName) {
          return error(res, 400, 'Missing required fields: email, firstName, lastName');
        }
        const customer = await customerService.createCustomer(body);
        return success(res, { customer }, 201);
      }

      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const updated = await customerService.updateCustomer(id, req.body || {});
        if (!updated) return error(res, 404, 'Customer not found');
        return success(res, { customer: updated });
      }

      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const deleted = await customerService.deleteCustomer(id);
        if (!deleted) return error(res, 404, 'Customer not found');
        return success(res, { message: 'Customer deleted' });
      }

      default:
        return error(res, 400, `Unknown action: ${action}. Use ?action=list|get|find|create|update|delete`);
    }
  } catch (err: any) {
    console.error(`[customers/${action}]`, err);
    return error(res, 500, 'Internal server error', err.message);
  }
}
