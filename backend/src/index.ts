import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './utils/prisma';

// Import routes
import authRoutes from './routes/auth';
import dealerRoutes from './routes/dealers';
import subscriptionRoutes from './routes/subscriptions';
import tradeShowRoutes from './routes/tradeShows';
import todoRoutes from './routes/todos';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/uploads';
import webhookRoutes from './routes/webhooks';

dotenv.config();

console.log('Starting application...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('Prisma Client initialized successfully');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Increase body parser limits for large file uploads and bulk operations
// Note: multipart/form-data (file uploads) bypasses these limits and uses multer instead
app.use(express.json({ limit: '100mb' })); // Increased from default 100kb
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Increased from default 100kb

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Headers:`, req.headers);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (with /api prefix for direct access)
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/trade-shows', tradeShowRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

// Routes (without /api prefix - DigitalOcean may strip it)
app.use('/auth', authRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/dealers', dealerRoutes);
app.use('/trade-shows', tradeShowRoutes);
app.use('/todos', todoRoutes);
app.use('/reports', reportRoutes);
app.use('/uploads', uploadRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle "request entity too large" errors specifically
  if (err.status === 413 || err.statusCode === 413 || 
      (err.message && err.message.toLowerCase().includes('request entity too large'))) {
    return res.status(413).json({
      error: 'File too large. Maximum file size is 100MB. Please try a smaller file or split your CSV into multiple files.'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Health check available at http://0.0.0.0:${PORT}/health`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Graceful shutdown is handled in utils/prisma.ts
// The Prisma client will properly disconnect all connections on shutdown
// No need for duplicate handlers here - prisma.ts handles SIGINT, SIGTERM, etc.

export default app;

