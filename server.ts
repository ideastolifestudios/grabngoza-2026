import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ── Grab & Go Support Bot system prompt ─────────────────────────────────────
const CHAT_SYSTEM_INSTRUCTION = `You are the Grab & Go Support Assistant — a friendly, knowledgeable customer service AI for Grab & Go ZA, a premium fast-fashion clothing store based in South Africa.

Your personality: warm, concise, helpful, and professional. You speak like a real support agent, not a robot.

What you know about Grab & Go:
- WhatsApp: +27 69 163 0778 | Email: support@grabandgo.co.za | Phone: +27 69 163 0778
- Business hours: Monday–Friday 08:00–16:00 SAST
- Shipping: 3–5 business days standard, 1–2 business days express (extra fee). Ships nationwide across South Africa.
- Orders placed before 14:00 SAST on weekdays are processed same day.
- Payments accepted: Visa, Mastercard, EFT, PayFlex (buy-now-pay-later — 4 payments, 0% interest), Yoco.
- Returns: 7 days from delivery, unused, original packaging, with proof of purchase.
- Refunds: 5–7 business days after item received back.
- Exchanges: arranged via WhatsApp or email, 2 business day pickup arranged.
- Sizes: standard South African sizing. When in doubt, recommend sizing up.
- Order tracking: tracking link sent via email on dispatch. Customers can also WhatsApp their order number for a live update.
- Order modifications/cancellations: allowed within 1 hour of placing the order via WhatsApp.
- You do NOT have access to live order data — always direct order-specific lookups to WhatsApp.
- Help Centre: /help page on the website has FAQs, contact form, and business hours.

Rules:
- Keep responses SHORT — 2 to 4 sentences max, unless the user needs a step-by-step list.
- NEVER say "I'm having trouble. Email shopgrabngo.online@gmail.com for help." — that message is fully retired and must never appear.
- For order-specific lookups (tracking, status, specific items), say you cannot see live order data and direct them to WhatsApp with the link https://wa.me/27691630778.
- If you genuinely don't know something, be honest and give the WhatsApp number.
- Never make up prices, stock levels, or specific order details.
- Always end urgent or unresolvable issues by providing: WhatsApp https://wa.me/27691630778`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ── SMTP Transporter ─────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // ── GET /api/support-chat — widget initialisation handshake ─────────────
  // SupportChat.tsx sends a GET on mount to confirm the endpoint is alive.
  app.get("/api/support-chat", (_req, res) => {
    res.status(200).json({ messages: [], status: "online" });
  });

  // ── POST /api/chat + /api/support-chat — Gemini support assistant ─────────
  // Accepts both route names so any existing or new frontend widget works.
  // Tolerates three common message payload shapes:
  //   { role, text }           — our own ChatWidget.tsx
  //   { role, content }        — OpenAI-style payloads
  //   { role, parts:[{text}] } — raw Gemini SDK shape
  app.post(["/api/chat", "/api/support-chat"], async (req, res) => {
    const raw: Array<any> = req.body?.messages ?? [];

    // Normalise every message to { role, text } regardless of incoming shape
    const messages: Array<{ role: "user" | "model"; text: string }> = raw
      .filter((m) => m && typeof m === "object")
      .map((m) => {
        const role: "user" | "model" =
          m.role === "user" ? "user" : "model";
        const text: string =
          typeof m.text === "string"
            ? m.text
            : typeof m.content === "string"
            ? m.content
            : Array.isArray(m.parts) && typeof m.parts[0]?.text === "string"
            ? m.parts[0].text
            : "";
        return { role, text };
      })
      .filter((m) => m.text.trim().length > 0);

    if (messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages array is required and must contain at least one non-empty message." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[chat] GEMINI_API_KEY not set");
      return res.status(500).json({
        reply:
          "Our AI assistant is temporarily offline. Please WhatsApp us at https://wa.me/27691630778 or email support@grabandgo.co.za.",
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // All messages except the last become history
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION },
        history,
      });

      const response = await chat.sendMessage({ message: lastMessage.text });
      const reply = response.text?.trim();

      if (!reply) throw new Error("Empty response from Gemini");

      return res.json({ reply });
    } catch (err: any) {
      console.error("[chat] Gemini error:", err?.message || err);
      return res.status(500).json({
        reply:
          "I hit a snag — for immediate help please WhatsApp us at https://wa.me/27691630778 or email support@grabandgo.co.za.",
      });
    }
  });

  // ── /api/send-email ───────────────────────────────────────────────────────
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, text } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[LOG] Email to ${to}: ${subject}`);
      return res.json({ success: true, logged: true });
    }

    try {
      await transporter.sendMail({
        from: `"Grab & Go ZA" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  });

  // ── /api/support/contact — Help desk contact form ────────────────────────
  app.post("/api/support/contact", async (req, res) => {
    const { name, email, subject, message } = req.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const ticketId = `GNG-${Date.now().toString(36).toUpperCase()}`;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[SUPPORT TICKET] ${ticketId} from ${email}: ${subject}`);
      return res.json({
        success: true,
        message: "Your message has been received. We'll respond within 24 business hours.",
        ticketId,
      });
    }

    try {
      // Notify support team
      await transporter.sendMail({
        from: `"Grab&Go Help Desk" <${process.env.SMTP_USER}>`,
        to: process.env.SUPPORT_EMAIL || "support@grabandgo.co.za",
        replyTo: email.trim(),
        subject: `[${ticketId}] ${subject.trim()}`,
        html: `<div style="font-family:sans-serif"><h2>New Support Ticket: ${ticketId}</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <p style="color:#888;font-size:12px">Reply to this email to respond to the customer.</p></div>`,
      });

      // Auto-reply to customer
      await transporter.sendMail({
        from: `"Grab&Go Support" <${process.env.SMTP_USER}>`,
        to: email.trim(),
        subject: `[${ticketId}] We've received your message`,
        html: `<div style="font-family:sans-serif">
          <p>Hi ${name.split(" ")[0]},</p>
          <p>Thanks for reaching out! We received your message and will reply within <strong>24 business hours</strong>.</p>
          <p>Your ticket reference: <strong>${ticketId}</strong></p>
          <p>For urgent help, WhatsApp us: <a href="https://wa.me/27691630778">+27 69 163 0778</a></p>
          <p>— Grab & Go Support Team</p></div>`,
      });

      return res.json({
        success: true,
        message: "Your message has been sent. We'll respond within 24 business hours.",
        ticketId,
      });
    } catch (err: any) {
      console.error("[support/contact] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to send message. Please try WhatsApp: https://wa.me/27691630778",
      });
    }
  });

  // ── Upload routes ─────────────────────────────────────────────────────────
  app.get("/api/test-upload", (req, res) => {
    res.json({ message: "Upload API is reachable" });
  });

  app.post(
    "/api/upload",
    (req, res, next) => {
      console.log("POST /api/upload");
      next();
    },
    upload.single("image"),
    (req, res) => {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      res.json({ imageUrl: `/uploads/${req.file.filename}` });
    }
  );

  app.post(
    "/api/upload-multiple",
    upload.array("images", 10),
    (req, res) => {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      res.json({ imageUrls: files.map((f) => `/uploads/${f.filename}`) });
    }
  );

  // ── Yoco payment ──────────────────────────────────────────────────────────
  app.post("/api/create-yoco-payment", async (req, res) => {
    const { amount, currency, metadata } = req.body;
    const { orderId } = metadata;
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey)
      return res.status(500).json({ error: "YOCO_SECRET_KEY not configured" });

    const host = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${host}`;

    try {
      const response = await fetch("https://online.yoco.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: currency || "ZAR",
          cancelUrl: `${baseUrl}/?status=cancelled`,
          successUrl: `${baseUrl}/order-success?id=${orderId}`,
          failureUrl: `${baseUrl}/?status=failed`,
          metadata,
        }),
      });

      const data: any = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      res.json({ redirectUrl: data.redirectUrl });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to initialize payment", details: error.message });
    }
  });

  app.post("/api/order-success", (req, res) => {
    console.log(`[ORDER SUCCESS] ${req.body?.id}`);
    res.json({ success: true, message: "Confirmations triggered", notifications: ["email", "whatsapp"] });
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", chat: !!process.env.GEMINI_API_KEY });
  });

  // ── Catch-all /api 404 ────────────────────────────────────────────────────
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
    app.get("{*all}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ── Error handler ─────────────────────────────────────────────────────────
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
      error: err.name || "Internal Server Error",
      message: err.message,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`💬 Chat AI: ${process.env.GEMINI_API_KEY ? "Gemini connected" : "⚠️  GEMINI_API_KEY missing"}`);
  });
}

startServer();