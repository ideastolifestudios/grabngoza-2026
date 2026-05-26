/**
 * src/utils/zoho.ts
 * Zoho order sync utility for grabngoza-2026
 * 
 * This module handles synchronization of confirmed orders to Zoho
 * (Inventory and CRM). Failures are logged but don't crash the order flow.
 */

export async function syncOrderToZoho(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<void> {
  // If you don't have Zoho fully migrated to the new repo yet,
  // you can safely leave this as a stub that resolves immediately.
  // It will NOT break your webhook.

  console.info(`[ZOHO SYNC] Triggered sync for order ${orderId}`);

  // TODO: Drop in your actual Zoho API fetch logic here when ready.
  // Example:
  // const response = await fetch('https://books.zoho.com/api/v3/salesorders', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     organization_id: process.env.ZOHO_ORGANIZATION_ID,
  //     line_items: (orderData.items as any[]).map((item: any) => ({
  //       item_id: item.productId,
  //       quantity: item.quantity,
  //       unit: item.name,
  //     })),
  //   }),
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Zoho API error: ${response.statusText}`);
  // }
}
