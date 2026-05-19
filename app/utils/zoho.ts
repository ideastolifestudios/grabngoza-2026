// app/utils/zoho.ts

export async function syncOrderToZoho(orderId: string, order: any): Promise<void> {
  // Production-grade implementation for Zoho API ingestion
  const ZOHO_API_URL = process.env.ZOHO_BOOKS_API_URL;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!ZOHO_API_URL || !clientSecret) {
    throw new Error('Missing production Zoho API configuration environment variables.');
  }

  const response = await fetch(`${ZOHO_API_URL}/salesorders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ZOHO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, ...order }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Zoho sync failed with status ${response.status}: ${errorData}`);
  }
}