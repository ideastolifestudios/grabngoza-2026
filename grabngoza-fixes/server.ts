import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Cloudinary ──────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — no disk writes, Vercel-safe
const upload = multer({ storage: multer.memoryStorage() });

// ── Shiplogic helpers ────────────────────────────────────────────────────────
const SHIPLOGIC_BASE = (process.env.SHIPLOGIC_BASE_URL || "https://api.shiplogic.com").replace(/\/$/, "");
const SHIPLOGIC_KEY  = process.env.SHIPLOGIC_API_KEY || "";

async function shiplogicPost(path: string, body: object) {
  const res = await fetch(`${SHIPLOGIC_BASE}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SHIPLOGIC_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiplogic ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function shiplogicGet(path: string) {
  const res = await fetch(`${SHIPLOGIC_BASE}${path}`, {
    headers: { "Authorization": `Bearer ${SHIPLOGIC_KEY}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiplogic GET ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── WhatsApp helper ──────────────────────────────────────────────────────────
async function sendWhatsApp(to: string, message: string) {
  const token   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.warn("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping");
    return { skipped: true };
  }
  const e164 = to.replace(/\D/g, "").replace(/^0/, "27");
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: e164,
      type: "text",
      text: { body: message },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── SMTP Transporter ─────────────────────────────────────────────────────────
function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Server ───────────────────────────────────────────────────────────────────
async function startServer() {
  const app  = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Email ────────────────────────────────────────────────────────────────
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, text } = req.body;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[LOG] Email to ${to}: ${subject}`);
      return res.json({ success: true, logged: true });
    }
    try {
      const t = makeTransporter();
      await t.sendMail({
        from: `"Grab & Go ZA" <${process.env.SMTP_USER}>`,
        to, subject, text, html,
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  });

  // ── Image upload — single (Cloudinary) ───────────────────────────────────
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(b64, { folder: "grabngoza/products" });
      res.json({ imageUrl: result.secure_url, publicId: result.public_id });
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ error: "Upload failed", details: err.message });
    }
  });

  // ── Image upload — multiple (Cloudinary) ─────────────────────────────────
  app.post("/api/upload-multiple", upload.array("images", 10), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: "No files uploaded" });
    try {
      const uploads = await Promise.all(
        files.map((f) => {
          const b64 = `data:${f.mimetype};base64,${f.buffer.toString("base64")}`;
          return cloudinary.uploader.upload(b64, { folder: "grabngoza/products" });
        })
      );
      res.json({ imageUrls: uploads.map((u) => u.secure_url) });
    } catch (err: any) {
      console.error("Cloudinary multi-upload error:", err);
      res.status(500).json({ error: "Upload failed", details: err.message });
    }
  });

  // ── Shipping — get rates ──────────────────────────────────────────────────
  app.post("/api/shipping/rates", async (req, res) => {
    const { fromPostal, toPostal, weight, length, width, height } = req.body;
    if (!SHIPLOGIC_KEY) {
      return res.status(503).json({ error: "SHIPLOGIC_API_KEY not configured" });
    }
    try {
      const data = await shiplogicPost("/shipments/rates", {
        collection_address: {
          postal_code: fromPostal || process.env.BUSINESS_POSTAL_CODE,
        },
        delivery_address: { postal_code: toPostal },
        parcels: [
          {
            submitted_length_cm: length ?? 30,
            submitted_width_cm:  width  ?? 20,
            submitted_height_cm: height ?? 5,
            submitted_weight_kg: weight ?? 0.5,
          },
        ],
      });
      res.json(data);
    } catch (err: any) {
      console.error("Shipping rates error:", err);
      res.status(502).json({ error: "Failed to fetch shipping rates", details: err.message });
    }
  });

  // ── Shipping — create shipment ────────────────────────────────────────────
  app.post("/api/shipping/create", async (req, res) => {
    const { orderId, orderData, serviceCode } = req.body;
    if (!SHIPLOGIC_KEY) {
      return res.status(503).json({ error: "SHIPLOGIC_API_KEY not configured" });
    }
    try {
      const data = await shiplogicPost("/shipments", {
        service_level_code: serviceCode || "ECO",
        special_instructions: `Order #${orderId}`,
        collection_address: {
          company:     process.env.BUSINESS_NAME || "Grab & Go ZA",
          street_address: process.env.BUSINESS_ADDRESS,
          local_area:  process.env.BUSINESS_CITY,
          city:        process.env.BUSINESS_CITY,
          zone:        process.env.BUSINESS_PROVINCE,
          country:     "ZA",
          code:        process.env.BUSINESS_POSTAL_CODE,
        },
        delivery_address: {
          company:     `${orderData.firstName} ${orderData.lastName}`,
          street_address: orderData.address,
          local_area:  orderData.city,
          city:        orderData.city,
          zone:        orderData.province,
          country:     orderData.country || "ZA",
          code:        orderData.postalCode,
        },
        parcels: [
          {
            submitted_length_cm: 30,
            submitted_width_cm:  20,
            submitted_height_cm: 5,
            submitted_weight_kg: 0.5,
            description:         `Order #${orderId}`,
          },
        ],
        contact: {
          name:  `${orderData.firstName} ${orderData.lastName}`,
          email: orderData.email,
          cell:  orderData.phone,
        },
      });
      res.json(data);
    } catch (err: any) {
      console.error("Shipment create error:", err);
      res.status(502).json({ error: "Failed to create shipment", details: err.message });
    }
  });

  // ── Shipping — get label ──────────────────────────────────────────────────
  app.get("/api/orders/:id/label", async (req, res) => {
    const { id } = req.params;
    const { shipmentId } = req.query as { shipmentId?: string };
    if (!SHIPLOGIC_KEY) {
      return res.status(503).json({ error: "SHIPLOGIC_API_KEY not configured" });
    }
    if (!shipmentId) {
      return res.status(400).json({ error: "shipmentId query param required" });
    }
    try {
      const data: any = await shiplogicGet(`/shipments/${shipmentId}/label`);
      // Shiplogic returns { label_url } or base64 pdf
      res.json({ orderId: id, labelUrl: data.label_url || null, label: data.label || null });
    } catch (err: any) {
      console.error("Label fetch error:", err);
      res.status(502).json({ error: "Failed to fetch label", details: err.message });
    }
  });

  // ── Yoco payment ──────────────────────────────────────────────────────────
  app.post("/api/create-yoco-payment", async (req, res) => {
    const { amount, currency, metadata } = req.body;
    const { orderId } = metadata;
    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "YOCO_SECRET_KEY not configured" });
    }
    const host     = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl  = `${protocol}://${host}`;
    try {
      const response = await fetch("https://online.yoco.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount:     Math.round(amount * 100),
          currency:   currency || "ZAR",
          cancelUrl:  `${baseUrl}/?status=cancelled`,
          successUrl: `${baseUrl}/order-success?id=${orderId}`,
          failureUrl: `${baseUrl}/?status=failed`,
          metadata,
        }),
      });
      const data: any = await response.json();
      if (!response.ok) {
        console.error("Yoco API Error:", data);
        return res.status(response.status).json(data);
      }
      res.json({ redirectUrl: data.redirectUrl });
    } catch (err: any) {
      console.error("Yoco init failed:", err);
      res.status(500).json({ error: "Failed to initialize payment", details: err.message });
    }
  });

  // ── Order success — email + WhatsApp ──────────────────────────────────────
  app.post("/api/order-success", async (req, res) => {
    const orderData = req.body;
    const results: Record<string, any> = {};

    // Email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const t = makeTransporter();
        await t.sendMail({
          from:    `"Grab & Go ZA" <${process.env.SMTP_USER}>`,
          to:      orderData.email,
          subject: `Order confirmed — #${orderData.id}`,
          html: `
            <h2>Thanks for your order, ${orderData.firstName}!</h2>
            <p>Your order <strong>#${orderData.id}</strong> has been received and is being prepared.</p>
            <p>We'll notify you when it's on its way.</p>
            <p style="color:#888;font-size:12px;">Grab & Go ZA — ${process.env.BUSINESS_ADDRESS}, ${process.env.BUSINESS_CITY}</p>
          `,
        });
        results.email = "sent";
      } else {
        results.email = "skipped (SMTP not configured)";
      }
    } catch (err: any) {
      results.email = `failed: ${err.message}`;
    }

    // WhatsApp
    try {
      if (orderData.phone) {
        const msg = `Hi ${orderData.firstName}! 👋 Your Grab & Go ZA order #${orderData.id} of R${orderData.total} has been confirmed. We'll be in touch shortly!`;
        await sendWhatsApp(orderData.phone, msg);
        results.whatsapp = "sent";
      } else {
        results.whatsapp = "skipped (no phone)";
      }
    } catch (err: any) {
      results.whatsapp = `failed: ${err.message}`;
    }

    res.json({ success: true, notifications: results });
  });

  // ── Order lookup (client-side passthrough info) ───────────────────────────
  app.get("/api/orders/lookup", (_req, res) => {
    res.status(410).json({ error: "Order lookup is handled client-side via Firebase. See orderService.lookupOrder()." });
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      cloudinary:  !!process.env.CLOUDINARY_API_KEY,
      shiplogic:   !!SHIPLOGIC_KEY,
      whatsapp:    !!process.env.WHATSAPP_ACCESS_TOKEN,
      smtp:        !!process.env.SMTP_HOST,
      yoco:        !!process.env.YOCO_SECRET_KEY,
    });
  });

  // ── 404 for unmatched API routes ──────────────────────────────────────────
  app.all("/api/{*path}", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // ── Vite / static ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/{*all}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ── Error handler ─────────────────────────────────────────────────────────
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
      error:   err.name || "Internal Server Error",
      message: err.message,
      stack:   process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();
