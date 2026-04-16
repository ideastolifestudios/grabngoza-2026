import { validateEnvironment } from './src/config/validateEnv';

// Call immediately
validateEnvironment();
import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes - All /api/* requests go to Vercel serverless functions
app.use('/api', (req, res) => {
  // In development, route to local handler
  // In production (Vercel), these are handled by serverless functions
  res.status(200).json({ 
    message: 'API endpoint',
    path: req.path,
    note: 'Routes are handled by serverless functions in /api directory'
  });
});

// Serve React build
const buildPath = path.join(__dirname, '../dist');
app.use(express.static(buildPath));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - MUST be last
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;