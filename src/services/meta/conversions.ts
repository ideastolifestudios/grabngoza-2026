import { MetaConversionEvent } from '@/types/meta';

const GRAPH_API_VERSION = 'v20.0';

/**
 * Sends server-side conversion events to Meta Events Manager
 */
export async function sendMetaConversionEvent(
  events: MetaConversionEvent[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  const pixelId = process.env.META_CONVERSIONS_API_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error('[MetaConversionsService] Missing META_CONVERSIONS_API_PIXEL_ID or access token.');
    return { success: false, error: 'Meta Conversions API environment variables missing.' };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: events,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MetaConversionsService] Event submission failed:', data);
      return { success: false, error: data.error?.message || 'Failed to submit event.' };
    }

    console.log('[MetaConversionsService] Event tracked successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[MetaConversionsService] Error sending conversion event:', error);
    return { success: false, error: error.message || 'Unknown network error.' };
  }
}