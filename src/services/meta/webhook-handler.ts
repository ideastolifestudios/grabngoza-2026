import crypto from 'crypto';

export class MetaWebhookHandler {
  private appSecret = process.env.META_APP_SECRET || '';

  verifySignature(rawBody: string, signatureHeader: string): boolean {
    if (!signatureHeader) return false;

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex')}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  handleOrderWebhook(data: any) {
    const order = {
      metaOrderId: data.id,
      customerId: data.buyer_id,
      orderStatus: data.state, // pending, confirmed, shipped, delivered
      totalPrice: data.total_price,
      items: data.line_items,
      shippingAddress: data.shipping_address,
      createdAt: new Date(data.created_timestamp),
    };

    return { success: true, order, processed: true };
  }
}
