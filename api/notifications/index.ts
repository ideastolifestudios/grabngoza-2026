// api/notifications/index.ts
import { IncomingMessage, ServerResponse } from 'http';

function jsonResponse(res: ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage) {
  return new Promise<any>((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const url = req.url || '';
    const action = (req.query?.action || new URL(req.url, 'http://localhost').searchParams.get('action') || '').toString();

    if (method === 'POST' && url.includes('/api/notifications')) {
      const body = req.body ?? (await readBody(req));
      // Basic example: if action=email, pretend to send and return success
      if (action === 'email') {
        // TODO: integrate real email provider here
        return jsonResponse(res, 200, { success: true, message: 'Email queued (mock)', bodyReceived: body });
      }
      return jsonResponse(res, 200, { success: true, message: 'Notification received (mock)', action, bodyReceived: body });
    }

    // Allow GET for quick health check
    if (method === 'GET' && url.includes('/api/notifications')) {
      return jsonResponse(res, 200, { success: true, message: 'notifications endpoint OK' });
    }

    res.setHeader('Allow', 'GET, POST');
    return jsonResponse(res, 405, { success: false, message: 'Method Not Allowed or unknown notifications route' });
  } catch (err: any) {
    console.error('[notifications handler] error', err);
    return jsonResponse(res, 500, { success: false, message: String(err?.message ?? err) });
  }
}
