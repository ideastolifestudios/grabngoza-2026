// app/utils/zoho.ts

export async function syncOrderToZoho(orderId: string, orderData: Record<string, unknown>): Promise<void> {
  // If you don't have Zoho fully migrated to the new repo yet, 
  // you can safely leave this as a stub that resolves immediately.
  // It will NOT break your webhook.

  console.info(`[ZOHO SYNC] Triggered sync for order ${orderId}`);
  
  // TODO: Drop in your actual Zoho API fetch logic here when ready.
  // Example:
  // await fetch('https://books.zoho.com/api/v3/salesorders', { ... })
}