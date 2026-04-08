import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // API Routes
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, text } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP configuration is missing. Email simulation mode.");
      console.log(`[SIMULATION] Sending email to ${to}: ${subject}`);
      return res.json({ success: true, simulated: true });
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

  // Mock routes for features that were previously using fetch
  app.get("/api/orders/lookup", (req, res) => {
    // This is now handled on the client side via orderService.lookupOrder
    // We return a 404 or a message to redirect to client-side
    res.status(404).json({ error: "Please use client-side lookup" });
  });

  app.post("/api/test/whatsapp", (req, res) => {
    console.log("[SIMULATION] WhatsApp Test:", req.body);
    res.json({ success: true, demo: true });
  });

  app.get("/api/orders/:id/label", (req, res) => {
    // Return a dummy PDF or error
    res.status(501).json({ error: "Label generation not implemented in this demo" });
  });

  app.post("/api/upload", (req, res) => {
    // Simple mock upload
    res.json({ imageUrl: "https://picsum.photos/seed/upload/800/800" });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
