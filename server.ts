import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount shipping router to handle /api/shipping routes
  app.use('/api/shipping', shippingRouter);
  console.log('Mounted shipping router at /api/shipping');

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

  // Mock routes for features that were previously using fetch
  app.get("/api/orders/lookup", (req, res) => {
    // This is now handled on the client side via orderService.lookupOrder
    // We return a 404 or a message to redirect to client-side
    res.status(404).json({ error: "Please use client-side lookup" });
  });

  app.get("/api/orders/:id/label", (req, res) => {
    res.status(501).json({ error: "Label generation not implemented" });
  });

  app.get("/api/test-upload", (req, res) => {
    res.json({ message: "Upload API is reachable" });
  });

  app.post("/api/upload", (req, res, next) => {
    console.log("POST /api/upload request received");
    next();
  }, upload.single("image"), (req, res) => {
    console.log("File uploaded:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  app.post("/api/upload-multiple", (req, res, next) => {
    console.log("POST /api/upload-multiple request received");
    next();
  }, upload.array("images", 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    console.log("Files uploaded:", files?.length);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const imageUrls = files.map(file => `/uploads/${file.filename}`);
    res.json({ imageUrls });
  });

  // Payment APIs
  app.post("/api/create-yoco-payment", async (req, res) => {
    const { amount, currency, metadata } = req.body;
    const { orderId } = metadata;

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "YOCO_SECRET_KEY not configured" });
    }

    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocol}://${host}`;
    
    const successUrl = `${baseUrl}/order-success?id=${orderId}`;
    const cancelUrl = `${baseUrl}/?status=cancelled`;
    const failureUrl = `${baseUrl}/?status=failed`;

    try {
      const response = await fetch("https://online.yoco.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Cents
          currency: currency || "ZAR",
          cancelUrl,
          successUrl,
          failureUrl,
          metadata
        })
      });

      const data: any = await response.json();
      if (!response.ok) {
        console.error("Yoco API Error:", data);
        return res.status(response.status).json(data);
      }

      res.json({ redirectUrl: data.redirectUrl });
    } catch (error: any) {
      console.error("Yoco Payment Initialization Failed:", error);
      res.status(500).json({ error: "Failed to initialize payment", details: error.message });
    }
  });

  app.post("/api/order-success", async (req, res) => {
    const orderData = req.body;
    
    console.log(`[ORDER SUCCESS] Order finalized: ${orderData.id}`);
    
    // In a real app, this would trigger WhatsApp via an API (e.g., Twilio, Meta)
    // and email via the send-email route or direct transport
    
    // Mocking success
    res.json({ 
      success: true, 
      message: "Confirmations triggered",
      notifications: ["email", "whatsapp"]
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API 404 handler - catch all unmatched /api routes
  app.all("/api/{*path}", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
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
    app.get('{*all}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({ 
      error: err.name || "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
