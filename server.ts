import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environmental variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

// Enable JSON parse support
app.use(express.json());

// API Routes Import
import authRouter from './server/routes/auth';
import productsRouter from './server/routes/products';
import cartRouter from './server/routes/cart';
import wishlistRouter from './server/routes/wishlist';
import ordersRouter from './server/routes/orders';
import adminRouter from './server/routes/admin';

// Bind API endpoint routers
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Service Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', date: new Date().toISOString() });
});

// Setup Asset Rendering and Fallback Server Static UI code
async function initializeServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initiating Vite development environment middleware...');
    
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
  } else {
    console.log('Serving production optimized compiled client bundle...');
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Commerce Web Application running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((error) => {
  console.error('Fatal initialization error:', error);
  process.exit(1);
});
