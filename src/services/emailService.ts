import { Product, Order } from '../types';

export const emailService = {
  sendEmail: async (to: string, subject: string, html: string, text: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text }),
      });
      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  sendWelcomeEmail: async (email: string, name: string) => {
    const subject = "Welcome to Grab & Go ZA!";
    const text = `Hi ${name},\n\nWelcome to the Grab & Go Fam! We're excited to have you with us.\n\nBest regards,\nThe Grab & Go Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">Welcome to Grab & Go ZA!</h1>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome to the Grab & Go Fam! We're excited to have you with us.</p>
        <p>You can now track your orders and manage your profile in our studio.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-t: 1px solid #eee; font-size: 12px; color: #888;">
          Best regards,<br>The Grab & Go Team
        </div>
      </div>
    `;
    return emailService.sendEmail(email, subject, html, text);
  },

  sendPasswordResetEmail: async (email: string) => {
    const subject = "Reset Your Password - Grab & Go ZA";
    const text = `You requested a password reset. Please use the link in the app to reset your password.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">Reset Your Password</h1>
        <p>You requested a password reset for your Grab & Go ZA account.</p>
        <p>Please click the button below to set a new password:</p>
        <a href="#" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px;">Reset Password</a>
        <p style="font-size: 10px; color: #888; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    return emailService.sendEmail(email, subject, html, text);
  },

  sendProductDetails: async (email: string, product: Product) => {
    const subject = `Product Details: ${product.name}`;
    const text = `Check out this product: ${product.name} - ${product.price}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">${product.name}</h1>
        <p style="color: #888; text-transform: uppercase; font-size: 12px;">${product.category}</p>
        <img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 300px; height: auto; margin: 20px 0;">
        <p style="font-weight: bold; font-size: 20px;">R ${product.price}</p>
        <p>${product.description || ''}</p>
        <a href="#" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px;">View Product</a>
      </div>
    `;
    return emailService.sendEmail(email, subject, html, text);
  },

  sendOrderConfirmation: async (order: Order) => {
    const subject = `Order Confirmation #${order.id}`;
    const text = `Thank you for your order! Order ID: ${order.id}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">Order Confirmation</h1>
        <p>Thank you for your order, <strong>${order.firstName} ${order.lastName}</strong>!</p>
        <p>Order ID: <strong>#${order.id}</strong></p>
        <div style="margin: 20px 0; padding: 20px; background: #f9f9f9;">
          <h3 style="margin-top: 0; text-transform: uppercase; font-size: 14px;">Order Summary</h3>
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
              <span>${item.name} x ${item.quantity}</span>
              <span>R ${item.price * item.quantity}</span>
            </div>
          `).join('')}
          <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; font-weight: bold; display: flex; justify-content: space-between;">
            <span>Total</span>
            <span>R ${order.total}</span>
          </div>
        </div>
        <p>We'll notify you when your order ships.</p>
      </div>
    `;
    return emailService.sendEmail(order.email, subject, html, text);
  },

  sendHelpDeskNotification: async (data: any) => {
    const subject = `New Help Desk Inquiry: ${data.subject}`;
    const text = `New inquiry from ${data.name} (${data.email}):\n\n${data.message}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">New Help Desk Inquiry</h1>
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #000;">
          ${data.message}
        </div>
      </div>
    `;
    // Send to business email
    return emailService.sendEmail(process.env.VITE_BUSINESS_EMAIL || 'support@grabandgo.co.za', subject, html, text);
  },

  sendNewsletterConfirmation: async (email: string) => {
    const subject = "You're on the list! - Grab & Go ZA";
    const text = "Thanks for joining the Grab & Go Fam! You'll be the first to know about new drops.";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">Welcome to the Fam!</h1>
        <p>Thanks for joining the Grab & Go newsletter list.</p>
        <p>You'll be the first to know about new drops, exclusive gear, and studio updates.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-t: 1px solid #eee; font-size: 12px; color: #888;">
          Stay fresh,<br>The Grab & Go Team
        </div>
      </div>
    `;
    return emailService.sendEmail(email, subject, html, text);
  },

  sendReturnRequestNotification: async (data: any) => {
    const subject = `New Return Request: Order #${data.orderId}`;
    const text = `New return request for Order #${data.orderId} from ${data.email}.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">New Return Request</h1>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p><strong>Customer Email:</strong> ${data.email}</p>
        <div style="margin: 20px 0; padding: 20px; background: #f9f9f9;">
          <h3 style="margin-top: 0; text-transform: uppercase; font-size: 14px;">Items to Return</h3>
          ${data.items.map((item: any) => `
            <div style="margin-bottom: 10px; font-size: 12px;">
              <strong>${item.name}</strong> x ${item.quantity}<br>
              <span style="color: #888;">Reason: ${item.reason}</span>
            </div>
          `).join('')}
          ${data.notes ? `<p style="margin-top: 20px; font-size: 12px;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
      </div>
    `;
    // Send to business email
    return emailService.sendEmail(process.env.VITE_BUSINESS_EMAIL || 'support@grabandgo.co.za', subject, html, text);
  }
};
