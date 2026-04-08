import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import multer from "multer";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "grab-and-go-secret-key-2024";
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const RETURNS_FILE = path.join(DATA_DIR, "returns.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize products if not exists
if (!fs.existsSync(PRODUCTS_FILE)) {
  const defaultProducts = [
    {
      id: '1',
      name: 'CUSTOMBYREBA Essential Tee',
      price: 450,
      originalPrice: 599,
      image: 'https://picsum.photos/seed/tee1/800/1000',
      images: ['https://picsum.photos/seed/tee1-alt/800/1000', 'https://picsum.photos/seed/tee1-alt2/800/1000'],
      category: 'Apparel',
      brand: 'CUSTOMBYREBA',
      soldBy: 'CUSTOMBYREBA',
      isDrop: true,
      description: 'Premium heavyweight cotton tee. Studio-born quality.',
      weight: 0.3,
      variants: [
        { id: 'v1', name: 'Size', options: ['S', 'M', 'L', 'XL'] }
      ]
    },
    {
      id: '2',
      name: 'Grab & Go "Fast" Hoodie',
      price: 850,
      originalPrice: 1100,
      image: 'https://picsum.photos/seed/hoodie1/800/1000',
      images: ['https://picsum.photos/seed/hoodie1-alt/800/1000'],
      category: 'Apparel',
      brand: 'Grab & Go',
      soldBy: 'Grab & Go',
      isDrop: true,
      description: 'Limited edition collaboration hoodie.',
      weight: 0.8,
      variants: [
        { id: 'v2', name: 'Size', options: ['M', 'L', 'XL'] },
        { id: 'v3', name: 'Color', options: ['Black', 'Grey'] }
      ]
    },
    {
      id: '3',
      name: 'Lifestyle Bundle Pack',
      price: 1200,
      image: 'https://picsum.photos/seed/bundle1/800/1000',
      category: 'Bundles',
      isBundle: true,
      description: 'Tee + Cap + Tote. The ultimate starter pack.',
      weight: 1.2
    },
    {
      id: '4',
      name: 'Studio Tote Bag',
      price: 250,
      image: 'https://picsum.photos/seed/tote1/800/1000',
      category: 'Accessories',
      description: 'Durable canvas tote for your daily grab.',
      weight: 0.2
    }
  ];
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2));
}

// Helper to read/write data
const readData = (file: string) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    return [];
  }
};

const writeData = (file: string, data: any) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Initialize admin user if not exists
const adminEmail = process.env.ADMIN_EMAIL || "admin@grabandgo.co.za";
const users = readData(USERS_FILE);
if (!users.some((u: any) => u.email === adminEmail)) {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync("admin123", salt);
  users.push({
    id: 'admin-1',
    email: adminEmail,
    password: hashedPassword,
    firstName: 'Studio',
    lastName: 'Admin',
    role: 'admin'
  });
  writeData(USERS_FILE, users);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for sending order confirmation emails
async function sendOrderConfirmationEmail(email: string, order: any) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  
  console.log(`[SMTP CHECK] Host: ${smtpHost ? 'SET' : 'MISSING'}, User: ${smtpUser ? 'SET' : 'MISSING'}, Pass: ${smtpPass ? 'SET' : 'MISSING'}, Port: ${smtpPort || '587'}`);

  const isConfigured = smtpHost && smtpUser && smtpPass && 
                       smtpUser !== "mock_user" && 
                       smtpUser.trim() !== "";

  if (!isConfigured) {
    console.warn(`[SMTP CONFIG] Missing or incomplete SMTP settings. Emails will be logged to console instead of sent.`);
    console.log(`[DEMO EMAIL] To: ${email}`);
    console.log(`[DEMO EMAIL] Order ID: #${order.id}`);
    return { 
      success: true, 
      message: "Demo Mode: SMTP is not configured. Real emails were not sent, but the content was logged to the server console.",
      demo: true 
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log("[SMTP] Connection verified successfully");
  } catch (verifyError: any) {
    console.error("[SMTP VERIFY ERROR]", verifyError.message);
    throw new Error(`SMTP Connection failed: ${verifyError.message}`);
  }

  // Financial calculations (VAT 15%)
  const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const shipping = order.deliveryMethod === 'ship' ? 100 : 0;
  const grandTotalInclTax = subtotal + shipping;
  const grandTotalExclTax = Number((grandTotalInclTax / 1.15).toFixed(2));
  const tax = Number((grandTotalInclTax - grandTotalExclTax).toFixed(2));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; }
        .wrapper { background-color: #f9f9f9; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; }
        .header { padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0; }
        .logo { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #000; margin-bottom: 5px; }
        .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 4px; color: #888; }
        .content { padding: 40px; }
        .status-banner { background: #000; color: #fff; padding: 25px; text-align: center; margin-bottom: 30px; }
        .status-banner h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
        .greeting { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
        .message { font-size: 14px; color: #444; margin-bottom: 25px; }
        .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 15px; margin-top: 35px; color: #000; }
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 10px; }
        .label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #999; margin-bottom: 4px; }
        .value { font-size: 13px; margin-bottom: 15px; color: #000; }
        .item-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .item-row { border-bottom: 1px solid #f0f0f0; }
        .item-img { width: 60px; height: 70px; object-fit: cover; background-color: #f5f5f5; }
        .item-details { padding: 15px 10px; }
        .item-name { font-weight: bold; font-size: 13px; text-transform: uppercase; margin: 0; }
        .item-sku { font-size: 10px; color: #999; text-transform: uppercase; margin-top: 4px; }
        .item-qty { text-align: center; font-size: 13px; color: #666; }
        .item-price { text-align: right; font-weight: bold; font-size: 13px; }
        .totals-area { margin-top: 30px; border-top: 2px solid #f0f0f0; padding-top: 20px; }
        .totals-table { width: 220px; margin-left: auto; }
        .totals-table td { padding: 4px 0; font-size: 13px; }
        .total-row { font-weight: 900; font-size: 16px; color: #000; border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
        .cta-area { margin-top: 40px; text-align: center; }
        .btn { display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 15px 30px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
        .footer { padding: 40px; background-color: #fcfcfc; border-top: 1px solid #f0f0f0; text-align: center; }
        .footer-text { font-size: 10px; color: #aaa; margin-top: 20px; line-height: 1.8; }
        .social { margin-top: 20px; }
        .social a { color: #000; font-size: 10px; font-weight: 900; text-decoration: none; margin: 0 10px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${process.env.APP_URL}/logo.png" alt="Grab & Go" style="height: 50px; width: auto;">
            </div>
            <div class="tagline">Born in Studio • South Africa</div>
          </div>

          <div class="status-banner">
            <h1>Order Confirmed</h1>
          </div>

          <div class="content">
            <div class="greeting">Hello ${order.firstName},</div>
            <div class="message">
              Your order has been received and is now being processed by our studio team. 
              We'll notify you as soon as your items are ready for delivery or pickup.
            </div>

            <div class="section-title">Order Details</div>
            <div class="info-grid">
              <div class="info-col">
                <div class="label">Order Number</div>
                <div class="value">#${order.id}</div>
              </div>
              <div class="info-col">
                <div class="label">Order Date</div>
                <div class="value">${new Date(order.date).toLocaleDateString('en-ZA', { dateStyle: 'long' })}</div>
              </div>
            </div>

            <div class="section-title">Shipping & Logistics</div>
            <div class="info-grid">
              <div class="info-col">
                <div class="label">Delivery Address</div>
                <div class="value">
                  ${order.firstName} ${order.lastName}<br>
                  ${order.address}<br>
                  ${order.city}, ${order.province} ${order.postalCode}<br>
                  T: ${order.phone}
                </div>
              </div>
              <div class="info-col">
                <div class="label">Method</div>
                <div class="value">
                  ${order.deliveryMethod === 'ship' ? 'Courier Delivery' : 
                    order.deliveryMethod === 'pickup' ? 'Studio Pickup' : 'Delivery'}
                </div>
                ${order.deliveryMethod === 'pickup' ? `
                  <div class="label">Pickup Location</div>
                  <div class="value">Grab & Go Studio, Woodstock</div>
                ` : ''}
                ${order.trackingNumber ? `
                  <div class="label">Tracking Number</div>
                  <div class="value">${order.trackingNumber}</div>
                  <div class="label">Tracking Link</div>
                  <div class="value"><a href="${order.trackingUrl}" style="color: #000; font-weight: bold;">Track Shipment</a></div>
                ` : ''}
                <div class="label">Payment</div>
                <div class="value">Secure Card (${order.paymentGateway === 'ikhokha' ? 'iKhokha' : 'Yoco'})</div>
              </div>
            </div>

            <div class="section-title">Items</div>
            <table class="item-table">
              ${order.items.map((item: any) => `
                <tr class="item-row">
                  <td style="padding: 15px 0; width: 60px;">
                    <img src="${item.image}" alt="${item.name}" class="item-img" />
                  </td>
                  <td class="item-details">
                    <p class="item-name">${item.name}</p>
                    <p class="item-sku">SKU: ${item.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-price">R${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </table>

            <div class="totals-area">
              <table class="totals-table">
                <tr>
                  <td style="color: #888;">Subtotal</td>
                  <td style="text-align: right;">R${subtotal}</td>
                </tr>
                <tr>
                  <td style="color: #888;">Logistics</td>
                  <td style="text-align: right;">R${shipping}</td>
                </tr>
                <tr>
                  <td style="color: #888;">VAT (15%)</td>
                  <td style="text-align: right;">R${tax}</td>
                </tr>
                <tr class="total-row">
                  <td>Total</td>
                  <td style="text-align: right;">R${grandTotalInclTax}</td>
                </tr>
              </table>
            </div>

            <div class="cta-area">
              <a href="${process.env.APP_URL || '#'}" class="btn">Track My Order</a>
            </div>
          </div>

          <div class="footer">
            <div class="social">
              <a href="#">Instagram</a>
              <a href="#">Twitter</a>
              <a href="#">Facebook</a>
            </div>
            <div class="footer-text">
              &copy; ${new Date().getFullYear()} Grab & Go Studio. All rights reserved.<br>
              You received this email because you placed an order at grabandgo.co.za.<br>
              Studio Born • High-Speed Lifestyle Essentials • South Africa
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`[EMAIL] Attempting to send confirmation to client: ${email}`);
  await transporter.sendMail({
    from: `"Grab & Go" <${smtpUser}>`,
    to: email,
    subject: `Order Confirmation: #${order.id}`,
    html: htmlContent,
  });
  console.log(`[EMAIL] SUCCESS: Confirmation sent to client (${email})`);

  // Send notification to business
  const businessEmail = process.env.BUSINESS_EMAIL || smtpUser || "info@grabandgo.co.za";
  const businessHtml = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #000;">
      <h1 style="text-transform: uppercase;">New Order Received!</h1>
      <p><strong>Order ID:</strong> #${order.id}</p>
      <p><strong>Customer:</strong> ${order.firstName} ${order.lastName} (${email})</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Total:</strong> R${order.total}</p>
      <p><strong>Delivery:</strong> ${order.deliveryMethod === 'ship' ? 'Shipping' : 'Pickup'}</p>
      <hr />
      <h3>Items:</h3>
      <ul>
        ${order.items.map((item: any) => `<li>${item.quantity}x ${item.name} - R${item.price * item.quantity}</li>`).join('')}
      </ul>
      <hr />
      <h3>Shipping Address:</h3>
      <p>${order.address}, ${order.city}, ${order.province}, ${order.postalCode}</p>
    </div>
  `;

  try {
    console.log(`[EMAIL] Attempting to notify business: ${businessEmail}`);
    await transporter.sendMail({
      from: `"Grab & Go Orders" <${smtpUser}>`,
      to: businessEmail,
      subject: `NEW ORDER: #${order.id} - ${order.firstName} ${order.lastName}`,
      html: businessHtml,
    });
    console.log(`[EMAIL] SUCCESS: Notification sent to business (${businessEmail})`);
  } catch (bizErr: any) {
    console.error(`[EMAIL ERROR] Failed to notify business: ${bizErr.message}`);
  }

  // Send WhatsApp alert to business
  try {
    const bizPhone = process.env.BUSINESS_PHONE || "27000000000";
    const whatsappMsg = `NEW ORDER: #${order.id} - ${order.firstName} ${order.lastName} (R${order.total})`;
    await sendWhatsAppAlert(bizPhone, whatsappMsg);
  } catch (waErr: any) {
    console.error(`[WHATSAPP ERROR] Failed to send business alert: ${waErr.message}`);
  }

  // Send WhatsApp alert to customer
  if (order.phone) {
    try {
      const customerMsg = order.trackingNumber 
        ? `Hi ${order.firstName}, thank you for your order #${order.id} at Grab & Go! Your shipment is being prepared. Tracking Number: ${order.trackingNumber}. Track here: ${order.trackingUrl}`
        : `Hi ${order.firstName}, thank you for your order #${order.id} at Grab & Go! We'll notify you when it ships.`;
      
      await sendWhatsAppAlert(order.phone, customerMsg);
    } catch (waErr: any) {
      console.error(`[WHATSAPP ERROR] Failed to send customer alert: ${waErr.message}`);
    }
  }

  return { success: true, message: "Confirmation emails sent successfully!" };
}

// Helper function for sending WhatsApp alerts
async function sendWhatsAppAlert(phone: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const isConfigured = accessToken && phoneNumberId && 
                       accessToken !== "mock_token" && 
                       !accessToken.includes("TODO");

  if (!isConfigured) {
    console.log(`[DEMO WHATSAPP] To: ${phone}`);
    console.log(`[DEMO WHATSAPP] Message: ${message}`);
    return { success: true, demo: true };
  }

  try {
    // Clean phone number: remove any non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // If it starts with 0, assume it's South Africa and replace with 27
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '27' + cleanPhone.substring(1);
    }
    
    // Ensure it doesn't have a leading + (Meta API doesn't want it)
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }

    console.log(`[WHATSAPP] Attempting to send Meta Cloud API alert to ${cleanPhone}`);
    
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(data.error?.message || `Meta API error ${response.status}`);
    }

    console.log(`[WHATSAPP] Message sent successfully via Meta: ${data.messages?.[0]?.id}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error(`[WHATSAPP ERROR] ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Helper function for ShipLogic Shipment Creation
async function createShipLogicShipment(order: any) {
  const apiKey = process.env.SHIPLOGIC_API_KEY;
  const baseUrl = process.env.SHIPLOGIC_BASE_URL || "https://api.shiplogic.com/v2";
  const isTestMode = process.env.SHIPLOGIC_TEST_MODE === "true";

  if (!apiKey || apiKey === "mock_key" || isTestMode) {
    console.log(`[${isTestMode ? 'TEST' : 'DEMO'} SHIPLOGIC] Creating shipment for order #${order.id}`);
    const trackingNumber = `TCG${Math.floor(Math.random() * 1000000000)}`;
    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://www.thecourierguy.co.za/tracking?tracking_number=${trackingNumber}`,
      labelUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Dummy PDF
      demo: true
    };
  }

  try {
    // Calculate total weight
    const totalWeight = order.items.reduce((acc: number, item: any) => acc + ((item.weight || 0.5) * item.quantity), 0);

    const shipmentData = {
      collection_address: {
        company: "Grab & Go Studio",
        street_address: process.env.BUSINESS_ADDRESS || "123 Studio Lane",
        suburb: "Studio Park",
        city: process.env.BUSINESS_CITY || "Johannesburg",
        province: process.env.BUSINESS_PROVINCE || "Gauteng",
        postal_code: process.env.BUSINESS_POSTAL_CODE || "2000",
        country_code: "ZA",
        contact_name: "Studio Admin",
        contact_phone: process.env.BUSINESS_PHONE || "0110000000"
      },
      delivery_address: {
        company: `${order.firstName} ${order.lastName}`,
        street_address: order.address,
        suburb: order.city, // Assuming city as suburb if not provided
        city: order.city,
        province: order.province,
        postal_code: order.postalCode,
        country_code: "ZA",
        contact_name: `${order.firstName} ${order.lastName}`,
        contact_phone: order.phone
      },
      parcels: [
        {
          weight: totalWeight,
          length: 30,
          width: 20,
          height: 10,
          description: `Order #${order.id} Items`
        }
      ],
      service_code: "TCG_OVERNIGHT", // The Courier Guy Overnight
      special_instructions: "Handle with care. Studio essentials."
    };

    const response = await fetch(`${baseUrl}/shipments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(shipmentData)
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.message || `ShipLogic error ${response.status}`);
    }

    const data = await response.json() as any;
    return {
      success: true,
      trackingNumber: data.tracking_number,
      trackingUrl: data.tracking_url,
      labelUrl: data.label_url
    };
  } catch (err: any) {
    console.error(`[SHIPLOGIC ERROR] ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Helper function for sending shipping confirmation emails
async function sendShippingConfirmationEmail(email: string, order: any) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  
  const isConfigured = smtpHost && smtpUser && smtpPass && 
                       smtpUser !== "mock_user" && 
                       smtpUser.trim() !== "";

  if (!isConfigured) {
    console.log(`[DEMO EMAIL] Shipping Confirmation To: ${email}`);
    console.log(`[DEMO EMAIL] Tracking: ${order.trackingNumber || 'N/A'}, URL: ${order.trackingUrl || 'N/A'}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e5e5; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 900; text-transform: uppercase; }
        .status-banner { background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 30px; }
        .btn { display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 15px 30px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Grab & Go</div>
        </div>
        <div class="status-banner">
          <h1 style="margin:0; font-size: 18px; text-transform: uppercase;">Your Order is on its way!</h1>
        </div>
        <p>Hello ${order.firstName},</p>
        <p>Great news! Your order <strong>#${order.id}</strong> has been shipped and is currently in transit.</p>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #999;">Tracking Number</p>
          <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: bold;">${order.trackingNumber || 'N/A'}</p>
          
          ${order.trackingUrl ? `<a href="${order.trackingUrl}" class="btn">Track My Order</a>` : ''}
        </div>

        <p>If you have any questions, feel free to contact our studio team.</p>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} Grab & Go Studio. Born in Studio • South Africa
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Grab & Go" <${smtpUser}>`,
    to: email,
    subject: `Shipping Confirmation: Order #${order.id}`,
    html: htmlContent,
  });
}

/**
 * Core function to handle new order creation and fulfillment triggers.
 * This runs when a payment is confirmed.
 */
async function handleNewOrder(order: any) {
  console.log(`[ORDER PROCESSOR] Starting fulfillment for order #${order.id}`);
  
  // 1. Create shipment via ShipLogic if it's a delivery order
  let shippingInfo = { trackingNumber: '', trackingUrl: '', labelUrl: '' };
  if (order.deliveryMethod === 'ship') {
    try {
      const shipment = await createShipLogicShipment(order);
      if (shipment.success) {
        shippingInfo = {
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
          labelUrl: shipment.labelUrl
        };
        console.log(`[ORDER PROCESSOR] Shipment created: ${shippingInfo.trackingNumber}`);
      }
    } catch (err) {
      console.error("[ORDER PROCESSOR] ShipLogic integration failed:", err);
    }
  }

  // 2. Prepare final order object with tracking info
  const finalOrder = { 
    ...order, 
    status: 'pending', 
    date: new Date().toISOString(),
    ...shippingInfo
  };

  // 3. Save to database (orders.json)
  const orders = readData(ORDERS_FILE);
  orders.push(finalOrder);
  writeData(ORDERS_FILE, orders);
  console.log(`[ORDER PROCESSOR] Order #${order.id} saved to database`);

  // 4. Trigger notifications (Email & WhatsApp)
  try {
    await sendOrderConfirmationEmail(order.email, finalOrder);
    console.log(`[ORDER PROCESSOR] Notifications sent for order #${order.id}`);
  } catch (err) {
    console.error(`[ORDER PROCESSOR] Notification failure for order #${order.id}:`, err);
  }

  return finalOrder;
}

async function startServer() {
  console.log("[SERVER] Starting server...");
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Admin access required" });
    }
  };

  // --- HelpDesk API ---
  app.post("/api/helpdesk", async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log(`[HELPDESK] New inquiry from ${name} (${email}): ${subject}`);
    console.log(`[HELPDESK] Message: ${message}`);

    // Mock sending email to support
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    const isConfigured = smtpHost && smtpUser && smtpPass && 
                         smtpUser !== "mock_user" && 
                         smtpUser.trim() !== "";

    if (isConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
          from: `"HelpDesk" <${smtpUser}>`,
          to: process.env.BUSINESS_EMAIL || smtpUser,
          subject: `HelpDesk Inquiry: ${subject}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
              <h2 style="text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">New HelpDesk Inquiry</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="font-size: 10px; color: #999; margin-top: 30px;">Received via Grab & Go HelpDesk</p>
            </div>
          `,
        });
        console.log("[HELPDESK] Notification email sent to support");
      } catch (err: any) {
        console.error("[HELPDESK EMAIL ERROR]", err.message);
      }
    } else {
      console.log("[HELPDESK] SMTP not configured, skipping support email notification");
    }

    res.json({ success: true, message: "Your inquiry has been received. Our team will get back to you soon." });
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log(`[NEWSLETTER] New subscription: ${email}`);

    // Mock sending welcome email
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    const isConfigured = smtpHost && smtpUser && smtpPass && 
                         smtpUser !== "mock_user" && 
                         smtpUser.trim() !== "";

    if (isConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
          from: `"Grab & Go" <${smtpUser}>`,
          to: email,
          subject: `Welcome to the Grab & Go Fam!`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; text-align: center;">
              <h2 style="text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">Welcome to the Fam!</h2>
              <p>Thanks for joining the Grab & Go newsletter. You're now on the list for exclusive drops and studio updates.</p>
              <div style="background: #000; color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px; display: inline-block;">
                <p style="margin: 0; font-weight: bold; letter-spacing: 2px;">CODE: FAM10</p>
              </div>
              <p style="font-size: 12px; margin-top: 10px;">Use this code for 10% off your next order.</p>
              <p style="font-size: 10px; color: #999; margin-top: 30px;">© 2026 Grab & Go Studio</p>
            </div>
          `,
        });
        console.log("[NEWSLETTER] Welcome email sent to", email);
      } catch (err: any) {
        console.error("[NEWSLETTER EMAIL ERROR]", err.message);
      }
    }

    res.json({ success: true, message: "Welcome to the family!" });
  });

  // Dedicated endpoint for processing orders (can be used as a hook or manual trigger)
  app.post("/api/orders/process", authenticate, isAdmin, async (req, res) => {
    const { order } = req.body;
    if (!order) return res.status(400).json({ error: "Order data required" });
    
    try {
      const processedOrder = await handleNewOrder(order);
      res.json({ success: true, order: processedOrder });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process order", details: err.message });
    }
  });

  // Test WhatsApp endpoint
  app.post("/api/test/whatsapp", authenticate, isAdmin, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: "Phone and message required" });

    try {
      const result = await sendWhatsAppAlert(phone, message);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "WhatsApp test failed", details: err.message });
    }
  });

  // --- iKhokha iK Pay Integration ---
  const IKHOKHA_APP_KEY = process.env.IKHOKHA_APP_KEY;
  const IKHOKHA_APP_SECRET = process.env.IKHOKHA_APP_SECRET;
  const IKHOKHA_BASE_URL = process.env.IKHOKHA_BASE_URL || "https://api.ikhokha.com/public-api/v1";

  app.post("/api/checkout/ikhokha", async (req, res) => {
    const { amount, externalId, returnUrl, cancelUrl, customerName, customerEmail, order } = req.body;

    if (!amount || !externalId) {
      return res.status(400).json({ error: "Amount and externalId are required" });
    }

    try {
      const key = IKHOKHA_APP_KEY?.trim();
      const secret = IKHOKHA_APP_SECRET?.trim();

      if (!key || !secret || key === "mock_key") {
        console.log(`[DEMO MODE] iKhokha payment initialized for ${amount}`);
        if (order) {
          await handleNewOrder(order);
        }
        return res.json({ 
          success: true, 
          checkoutUrl: "#demo-payment-success",
          demo: true,
          message: "Demo Mode: Configure iKhokha credentials in Secrets for real payments."
        });
      }

      const paymentUrl = `${IKHOKHA_BASE_URL}/checkout`;
      
      // 1. Prepare the payload
      const payload = {
        amount: Math.round(amount * 100), // iKhokha expects cents
        externalId: externalId,
        returnUrl: returnUrl || `${process.env.APP_URL}/order-success?id=${externalId}`,
        cancelUrl: cancelUrl || `${process.env.APP_URL}/checkout`,
        callbackUrl: `${process.env.APP_URL}/api/webhooks/ikhokha`,
        description: `Order #${externalId.slice(0, 8)}`,
        customer: {
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || 'User',
          email: customerEmail,
          phone: order?.phone || ''
        }
      };

      // 2. Minify the payload for signature consistency
      const minifiedPayload = JSON.stringify(payload);
      
      // 3. Generate the HMAC SHA256 signature
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(minifiedPayload)
        .digest("hex");

      // 4. Testing Logic: Print for verification
      console.log(`[IKHOKHA] Initializing payment at ${paymentUrl}`);

      const response = await fetch(paymentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`, // Some gateways expect Bearer or use this for the Key
          "IK-APPID": key,
          "IK-SIGN": generatedSignature,
        },
        body: minifiedPayload,
      });

      if (!response.ok) {
        const errText = await response.text();
        let errData;
        try {
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { message: errText };
        }
        throw new Error(`iKhokha Payment Failed: ${response.status} ${errData.message || response.statusText}`);
      }

      const data = await response.json() as any;
      console.log("[IKHOKHA] Payment response:", JSON.stringify(data));

      // Handle order creation
      if (order) {
        await handleNewOrder(order);
      }

      const checkoutUrl = data.checkoutUrl || data.hostedUrl || data.url;
      res.json({ success: true, checkoutUrl, checkoutId: data.checkoutId || data.id });
    } catch (err: any) {
      console.error("[IKHOKHA ERROR]", err.message);
      res.status(500).json({ error: "Failed to create iKhokha checkout", details: err.message });
    }
  });

  // Webhook for iKhokha (optional but recommended)
  app.post("/api/webhooks/ikhokha", async (req, res) => {
    const signature = req.headers["x-ik-signature"];
    const payload = JSON.stringify(req.body);

    // In a real app, verify the signature using IKHOKHA_APP_SECRET
    // For now, we'll process the payment status
    const { externalId, status } = req.body;

    if (status === "captured") {
      console.log(`[IKHOKHA WEBHOOK] Payment captured for order ${externalId}`);
      // Find the order and update its status
      // Note: In this simple app, we might create the order only after payment
    }

    res.sendStatus(200);
  });

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const users = readData(USERS_FILE);
    if (users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: userWithoutPassword, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const users = readData(USERS_FILE);
    const user = users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: userWithoutPassword, token });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json({ user: req.user });
  });

  // --- Order Tracking Routes ---
  app.get("/api/orders", authenticate, (req: any, res) => {
    const orders = readData(ORDERS_FILE);
    const userOrders = orders.filter((o: any) => o.userId === req.user.id || o.email === req.user.email);
    res.json(userOrders);
  });

  app.get("/api/orders/all", authenticate, isAdmin, (req, res) => {
    const orders = readData(ORDERS_FILE);
    res.json(orders);
  });

  app.patch("/api/orders/:id", authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber, trackingUrl } = req.body;
    const orders = readData(ORDERS_FILE);
    const orderIndex = orders.findIndex((o: any) => o.id === id);

    if (orderIndex === -1) return res.status(404).json({ error: "Order not found" });

    const isNewTracking = (trackingNumber !== undefined && trackingNumber !== orders[orderIndex].trackingNumber) || 
                         (trackingUrl !== undefined && trackingUrl !== orders[orderIndex].trackingUrl);

    if (status) {
      const oldStatus = orders[orderIndex].status;
      orders[orderIndex].status = status;

      // Send WhatsApp notification on status change
      if (oldStatus !== status && (status === 'ready' || status === 'completed')) {
        const order = orders[orderIndex];
        if (order.phone) {
          let message = "";
          if (status === 'ready') {
            message = `Hi ${order.firstName}, your Grab & Go order #${order.id.slice(0, 8).toUpperCase()} is READY!`;
          } else if (status === 'completed') {
            message = `Hi ${order.firstName}, your Grab & Go order #${order.id.slice(0, 8).toUpperCase()} has been COMPLETED. Thank you for shopping with us!`;
          }
          
          if (message) {
            sendWhatsAppAlert(order.phone, message).catch(err => {
              console.error("Failed to send WhatsApp status update:", err);
            });
          }
        }
      }
    }
    if (trackingNumber !== undefined) orders[orderIndex].trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) orders[orderIndex].trackingUrl = trackingUrl;

    writeData(ORDERS_FILE, orders);

    if (isNewTracking && (orders[orderIndex].trackingNumber || orders[orderIndex].trackingUrl)) {
      try {
        await sendShippingConfirmationEmail(orders[orderIndex].email, orders[orderIndex]);
      } catch (err) {
        console.error("Failed to send shipping confirmation email:", err);
      }
    }

    res.json(orders[orderIndex]);
  });

  // Proxy endpoint for shipping labels
  app.get("/api/orders/:id/label", authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    const orders = readData(ORDERS_FILE);
    const order = orders.find((o: any) => o.id === id);

    if (!order || !order.labelUrl) {
      return res.status(404).json({ error: "Shipping label not found for this order" });
    }

    try {
      const labelResponse = await fetch(order.labelUrl);
      if (!labelResponse.ok) throw new Error("Failed to fetch label from ShipLogic");

      const contentType = labelResponse.headers.get("content-type") || "application/pdf";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=shipping-label-${id}.pdf`);
      
      // Node-fetch response body is a stream
      (labelResponse.body as any).pipe(res);
    } catch (err: any) {
      console.error("[LABEL DOWNLOAD ERROR]", err.message);
      res.status(500).json({ error: "Failed to download shipping label" });
    }
  });

  // --- Product Management Routes ---
  app.get("/api/products", (req, res) => {
    const products = readData(PRODUCTS_FILE);
    res.json(products);
  });

  app.post("/api/products", authenticate, isAdmin, (req, res) => {
    const products = readData(PRODUCTS_FILE);
    const newProduct = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    };
    products.push(newProduct);
    writeData(PRODUCTS_FILE, products);
    res.json(newProduct);
  });

  app.put("/api/products/:id", authenticate, isAdmin, (req, res) => {
    const { id } = req.params;
    const products = readData(PRODUCTS_FILE);
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Product not found" });

    products[index] = { ...products[index], ...req.body, id }; // Ensure ID stays same
    writeData(PRODUCTS_FILE, products);
    res.json(products[index]);
  });

  app.delete("/api/products/:id", authenticate, isAdmin, (req, res) => {
    const { id } = req.params;
    let products = readData(PRODUCTS_FILE);
    products = products.filter((p: any) => p.id !== id);
    writeData(PRODUCTS_FILE, products);
    res.json({ success: true });
  });

  app.post("/api/upload", authenticate, isAdmin, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route for sending product details
  app.post("/api/send-product-details", async (req, res) => {
    const { email, product } = req.body;

    if (!email || !product) {
      return res.status(400).json({ error: "Email and product details are required" });
    }

    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      
      const isConfigured = smtpHost && smtpUser && smtpPass && 
                           smtpUser !== "mock_user" && 
                           smtpUser.trim() !== "";

      if (!isConfigured) {
        console.log(`[DEMO MODE] Email would be sent to ${email} for product ${product.name}`);
        return res.json({ 
          success: true, 
          message: "Demo Mode: Email logged to server console. To send real emails, configure SMTP_HOST, SMTP_USER, and SMTP_PASS in your Secrets panel.",
          demo: true 
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${process.env.APP_URL}/logo.png" alt="Grab & Go" style="height: 50px; width: auto; margin-bottom: 15px;">
            <h1 style="text-transform: uppercase; letter-spacing: 2px; margin: 0;">Grab & Go</h1>
            <p style="font-size: 12px; color: #666; text-transform: uppercase;">Premium Lifestyle Essentials</p>
          </div>
          <img src="${product.image}" alt="${product.name}" style="width: 100%; height: auto; margin-bottom: 20px;" />
          <h2 style="text-transform: uppercase; margin-bottom: 10px;">${product.name}</h2>
          <p style="color: #333; line-height: 1.6;">${product.description}</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 24px; font-weight: bold; margin: 0;">R${product.price}</p>
            <p style="font-size: 12px; color: #999; text-transform: uppercase;">Category: ${product.category}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.APP_URL || '#'}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; display: inline-block;">View on Site</a>
          </div>
          <p style="font-size: 10px; color: #ccc; margin-top: 40px; text-align: center;">
            Born in CUSTOMBYREBA Studios • South Africa
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Grab & Go" <${smtpUser}>`,
        to: email,
        subject: `Product Details: ${product.name}`,
        html: htmlContent,
      });

      res.json({ success: true, message: "Email sent successfully!" });
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message || "Unknown error" 
      });
    }
  });
  app.post("/api/create-yoco-payment", async (req, res) => {
    console.log("[API] POST /api/create-yoco-payment hit", req.body);
    const { amount, currency, metadata, order } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }

    try {
      const yocoSecretKey = process.env.YOCO_SECRET_KEY;
      console.log(`[YOCO] Key present: ${!!yocoSecretKey}, Length: ${yocoSecretKey?.length || 0}`);
      
      if (yocoSecretKey && !yocoSecretKey.trim().startsWith("sk_")) {
        console.warn("[YOCO] Secret key does not start with 'sk_'. Please check your configuration in the Secrets panel.");
      }

      // If no key, return a demo response
      if (!yocoSecretKey || yocoSecretKey === "mock_key") {
        console.log(`[DEMO MODE] Yoco payment initialized for ${amount} ${currency}`);
        
        // In demo mode, we process the order immediately
        if (order) {
          await handleNewOrder(order);
        }

        return res.json({ 
          success: true, 
          redirectUrl: "#demo-payment-success",
          demo: true,
          message: "Demo Mode: Configure YOCO_SECRET_KEY in Secrets for real payments."
        });
      }

      const isTestKey = yocoSecretKey?.trim().startsWith("sk_test_");
      console.log(`[YOCO] Using ${isTestKey ? 'TEST' : 'LIVE'} key`);

      const cancelUrl = `${process.env.APP_URL || 'http://localhost:3000'}/checkout`;
      const successUrl = `${process.env.APP_URL || 'http://localhost:3000'}/order-success?id=${metadata?.orderId || 'yoco'}`;
      console.log(`[YOCO] Redirect URLs: cancel=${cancelUrl}, success=${successUrl}`);

      const requestBody = {
        amount: Math.round(Number(amount) * 100), // Yoco expects cents
        currency: currency,
        cancelUrl,
        successUrl,
        metadata: metadata || {}
      };
      console.log(`[YOCO] Request body:`, JSON.stringify(requestBody));

      const endpoints = [
        "https://payments.yoco.com/api/checkouts",
        "https://online.yoco.com/v1/checkouts"
      ];

      let lastError = null;
      let data = null;
      let success = false;

      for (const yocoUrl of endpoints) {
        try {
          console.log(`[YOCO] Attempting endpoint: ${yocoUrl}`);
          const response = await fetch(yocoUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${yocoSecretKey.trim()}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          console.log(`[YOCO] ${yocoUrl} returned status: ${response.status}`);
          
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await response.json() as any;
            console.log(`[YOCO] ${yocoUrl} response body:`, JSON.stringify(data));
            
            if (response.ok) {
              success = true;
              break;
            } else {
              lastError = new Error(data.message || `Yoco API error ${response.status}`);
            }
          } else {
            const text = await response.text();
            console.warn(`[YOCO] ${yocoUrl} returned non-JSON:`, text.slice(0, 100));
            lastError = new Error(`Endpoint ${yocoUrl} returned non-JSON response (${response.status})`);
          }
        } catch (err: any) {
          console.error(`[YOCO] Error calling ${yocoUrl}:`, err.message);
          lastError = err;
        }
      }

      if (!success) {
        throw lastError || new Error("All Yoco endpoints failed");
      }

      // Handle both redirectUrl (v1) and redirect_url (some versions)
      const redirectUrl = data.redirectUrl || data.redirect_url;
      if (!redirectUrl) {
        console.error("[YOCO ERROR] No redirect URL in response:", data);
        throw new Error("Yoco API did not return a redirect URL.");
      }

      // Send confirmation email as the final step of the order process on the server
      if (order) {
        await handleNewOrder(order);
      }

      res.json({ success: true, redirectUrl });
    } catch (error: any) {
      console.error("Yoco error:", error);
      res.status(500).json({ 
        error: "Payment initialization failed", 
        details: error.message || "Unknown error" 
      });
    }
  });

  // API Route for sending order confirmation
  app.post("/api/send-order-confirmation", async (req, res) => {
    const { email, order } = req.body;

    if (!email || !order) {
      return res.status(400).json({ error: "Email and order details are required" });
    }

    try {
      const result = await sendOrderConfirmationEmail(email, order);
      res.json(result);
    } catch (error: any) {
      console.error("Order confirmation email error:", error);
      res.status(500).json({ 
        error: "Failed to send confirmation email", 
        details: error.message || "Unknown error" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA fallback for production
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

// Return Request API
  app.get('/api/orders/lookup', async (req, res) => {
    const { orderId, email } = req.query;

    if (!orderId || !email) {
      return res.status(400).json({ success: false, error: 'Order ID and Email are required' });
    }

    try {
      const orders = readData(ORDERS_FILE);
      const order = orders.find((o: any) => o.id === orderId && o.email.toLowerCase() === (email as string).toLowerCase());

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Only allow returns for completed orders
      if (order.status !== 'completed') {
        return res.status(400).json({ success: false, error: 'Only completed orders can be returned' });
      }

      res.json({ success: true, order });
    } catch (error) {
      console.error('Order lookup error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.post('/api/returns/request', async (req, res) => {
    const { orderId, email, items, notes } = req.body;

    if (!orderId || !email || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
      const returns = readData(RETURNS_FILE);
      
      // Check if a return already exists for this order
      const existingReturn = returns.find((r: any) => r.orderId === orderId && r.status === 'pending');
      if (existingReturn) {
        return res.status(400).json({ success: false, error: 'A return request is already pending for this order' });
      }

      const newReturn = {
        id: `RET-${Date.now()}`,
        orderId,
        email,
        items,
        notes,
        status: 'pending',
        date: new Date().toISOString()
      };

      returns.push(newReturn);
      writeData(RETURNS_FILE, returns);

      // Notify support
      if (process.env.SMTP_HOST && process.env.BUSINESS_EMAIL) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          });

          await transporter.sendMail({
            from: `"Grab & Go Returns" <${process.env.SMTP_USER}>`,
            to: process.env.BUSINESS_EMAIL,
            subject: `New Return Request: ${newReturn.id}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">New Return Request</h1>
                <p><strong>Return ID:</strong> ${newReturn.id}</p>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Customer Email:</strong> ${email}</p>
                <p><strong>Date:</strong> ${newReturn.date}</p>
                <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px;">Items to Return:</h2>
                <ul>
                  ${items.map((item: any) => `
                    <li>${item.name} (Qty: ${item.quantity}) - Reason: ${item.reason}</li>
                  `).join('')}
                </ul>
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated notification from the Grab & Go Studio platform.</p>
              </div>
            `
          });
        } catch (mailError) {
          console.error('Failed to send return notification email:', mailError);
        }
      }

      res.json({ success: true, returnId: newReturn.id });
    } catch (error) {
      console.error('Return request error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
