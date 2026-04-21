/**
 * server.ts — Hardened version
 *
 * Changes from original:
 *  + Rate limiting on all /api routes + tighter limits on payment endpoints
 *  + Yoco webhook HMAC verification (rawBodyMiddleware + verifyYocoWebhook)
 *  + Server-side price verification (createYocoPaymentHandler)
 *  + Sentry error monitoring (initSentry + sentryErrorHandler)
 *  + Structured logging throughout
 *  + Dedicated webhook handler (yocoWebhookHandler)
 *
 * Lines marked "UNCHANGED" preserve all your existing logic verbatim.
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

// ── NEW IMPORTS ──────────────────────────────────────────────────────────────
import { rawBodyMiddleware, verifyYocoWebhook } from './middleware/verifyYocoWebhook.js';
import {
  paymentLimiter,
  orderLimiter,
  webhookLimiter,
  generalApiLimiter,
} from './middleware/rateLimit.js';
import { createYocoPaymentHandler } from './api/create-yoco-payment.js';
import { yocoWebhookHandler } from './api/yoco-webhook.js';
import { initSentry, sentryErrorHandler } from './src/services/monitoring.js';
import { log } from './src/services/logger.js';
// ─────────────────────────────────────────────────────────────────────────────

dotenv.config();

// Initialise Sentry FIRST — before any other async work
await initSentry();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// UNCHANGED — Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// UNCHANGED — Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ── WEBHOOK ROUTE — must come BEFORE express.json() ──────────────────────
  // Raw body capture + HMAC verification + dedicated handler
  app.post(
    '/api/yoco-webhook',
    rawBodyMiddleware,    // 1. captures raw bytes before any parsing
    verifyYocoWebhook,   // 2. verifies HMAC — rejects if invalid
    express.json(),      // 3. now safe to parse JSON
    webhookLimiter,      // 4. rate limit (after auth so spoofed requests are rejected cheaply)
    yocoWebhookHandler   // 5. process event
  );
  // ─────────────────────────────────────────────────────────────────────────

  // Standard body parsing for all other routes
  app.use(express.json());

  // ── RATE LIMITING — applied per-route ────────────────────────────────────
  app.use('/api/', generalApiLimiter);
  app.use('/api/create-yoco-payment', paymentLimiter);
  app.use('/api/orders', orderLimiter);
  // ─────────────────────────────────────────────────────────────────────────

  // UNCHANGED — SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // UNCHANGED — send-email
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html, text } = req.body;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      log('info', 'email.logged_only', { to, subject });
      return res.json({ success: true, logged: true });
    }
    try {
      await transporter.sendMail({
        from: `"Grab & Go ZA" <${process.env.SMTP_USER}>`,
        to, subject, text, html,
      });
      res.json({ success: true });
    } catch (error: any) {
      log('error', 'email.send_failed', { to, error: error.message });
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  });

  // UNCHANGED — misc order routes
  app.get('/api/orders/lookup', (_req, res) => {
    res.status(404).json({ error: 'Please use client-side lookup' });
  });
  app.get('/api/orders/:id/label', (_req, res) => {
    res.status(501).json({ error: 'Label generation not implemented' });
  });

  // UNCHANGED — upload routes
  app.get('/api/test-upload', (_req, res) => res.json({ message: 'Upload API is reachable' }));
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  });
  app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });
    res.json({ imageUrls: files.map(f => `/uploads/${f.filename}`) });
  });

  // ── PAYMENT — replaced with server-side price verification ───────────────
  app.post('/api/create-yoco-payment', createYocoPaymentHandler);
  // ─────────────────────────────────────────────────────────────────────────

  // UNCHANGED — order-success notification trigger
  app.post('/api/order-success', async (req, res) => {
    const orderData = req.body;
    log('info', 'order.success_notification', { orderId: orderData.id });
    res.json({ success: true, message: 'Confirmations triggered', notifications: ['email', 'whatsapp'] });
  });

  // UNCHANGED — health check
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // UNCHANGED — API 404
  app.all('/api/{*path}', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // UNCHANGED — Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('{*all}', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // ── ERROR HANDLERS — Sentry first, then generic fallback ─────────────────
  app.use(sentryErrorHandler());
  app.use((err: any, _req: any, res: any, _next: any) => {
    log('error', 'unhandled_express_error', { message: err.message, status: err.status });
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error',
    });
  });
  // ─────────────────────────────────────────────────────────────────────────

  app.listen(PORT, '0.0.0.0', () => {
    log('info', 'server.started', { port: PORT, env: process.env.NODE_ENV });
  });
}

startServer();
