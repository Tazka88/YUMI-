import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { setupDb } from '../src/db/setup.js';
import apiRoutes from '../src/api/routes.js';
import path from 'path';
import fs from 'fs';

const app = express();

app.set('trust proxy', 1);

// Initialize DB (Note: SQLite on Vercel is ephemeral, data will reset on cold starts)
try {
  setupDb();
} catch (error) {
  console.error('Failed to setup DB:', error);
}

// Create uploads directory if it doesn't exist (ephemeral on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL;
const uploadsDir = isVercel 
  ? path.join('/tmp', 'uploads') 
  : path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir, { maxAge: '1y' }));

// API Routes
app.use('/api', apiRoutes);

// Global error handler for debugging
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export the Express API for Vercel Serverless Functions
export default app;
