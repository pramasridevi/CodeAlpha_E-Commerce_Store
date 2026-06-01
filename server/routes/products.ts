import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { requireAdmin, authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Product, Review } from '../../src/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-key-1337-market';

// Optional user decoder middleware for GET single product (tracks recently viewed without blocking guests)
function optionalAuthenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = decoded;
    } catch (e) {
      // ignore expired/invalid token for guest convenience
    }
  }
  next();
}

// GET /api/products -> Listing with paging, searching, filtering, and sorting
router.get('/', (req: Request, res: Response) => {
  try {
    let products = [...db.getProducts()];

    // Search query
    const search = req.query.search as string;
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    // Category filter
    const category = req.query.category as string;
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Brand filter
    const brand = req.query.brand as string;
    if (brand && brand !== 'All') {
      products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Price range filter
    const minPrice = Number(req.query.minPrice);
    if (!isNaN(minPrice)) {
      products = products.filter(p => p.price >= minPrice);
    }
    const maxPrice = Number(req.query.maxPrice);
    if (!isNaN(maxPrice)) {
      products = products.filter(p => p.price <= maxPrice);
    }

    // Sorting
    const sort = req.query.sort as string; // 'price_asc' | 'price_desc' | 'newest' | 'bestseller'
    if (sort) {
      if (sort === 'price_asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'bestseller') {
        products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
      }
    }

    // Extra list categories and brands for advanced search sidebar
    const categories = Array.from(new Set(db.getProducts().map(p => p.category)));
    const brands = Array.from(new Set(db.getProducts().map(p => p.brand)));

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      totalCount: products.length,
      categories,
      brands,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products.' });
  }
});

// GET /api/products/featured -> get carousel / curated sections
router.get('/featured', (req: Request, res: Response) => {
  const products = db.getProducts();
  const featured = products.filter(p => p.isFeatured || p.isBestSeller).slice(0, 5);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 8);
  const newest = [...products].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  
  res.json({
    featured,
    bestSellers,
    newest
  });
});

// GET /api/products/:id -> Single product details
router.get('/:id', optionalAuthenticate, (req: Request, res: Response) => {
  const pId = req.params.id;
  const product = db.findProductById(pId);
  
  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  // If user is logged in, track recently viewed
  const authReq = req as any;
  if (authReq.user) {
    db.trackRecentlyViewed(authReq.user.id, pId);
  }

  // Get related products (same category, excluding current product)
  const related = db.getProducts()
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({
    product,
    related
  });
});

// POST /api/products -> Admin Add Product
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const { title, description, price, category, brand, stock, images, specifications, isBestSeller, isFeatured } = req.body;

  if (!title || !price || !category || !brand) {
    res.status(400).json({ message: 'Title, price, category, and brand are required.' });
    return;
  }

  try {
    const newProduct = db.createProduct({
      title,
      description,
      price,
      category,
      brand,
      stock: stock || 0,
      images,
      specifications: specifications || {},
      isBestSeller: !!isBestSeller,
      isFeatured: !!isFeatured
    });
    res.status(201).json({ product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error adding new product.' });
  }
});

// PUT /api/products/:id -> Admin Edit Product
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const pId = req.params.id;
  const { title, description, price, category, brand, stock, images, specifications, isBestSeller, isFeatured } = req.body;

  try {
    const product = db.findProductById(pId);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const updated = db.updateProduct(pId, {
      title,
      description,
      price: price !== undefined ? Number(price) : undefined,
      category,
      brand,
      stock: stock !== undefined ? Number(stock) : undefined,
      images,
      specifications,
      isBestSeller,
      isFeatured
    });

    res.json({ product: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product info.' });
  }
});

// DELETE /api/products/:id -> Admin Delete Product
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const pId = req.params.id;

  try {
    const deleted = db.deleteProduct(pId);
    if (!deleted) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    res.json({ success: true, message: 'Product successfully deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product.' });
  }
});

// POST /api/products/:id/review -> Customer submit ratings/reviews
router.post('/:id/review', authenticateToken, (req: Request, res: Response) => {
  const pId = req.params.id;
  const authReq = req as AuthenticatedRequest;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    return;
  }

  try {
    const product = db.findProductById(pId);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    // Verify if user already reviewed
    const alreadyReviewed = product.reviews?.some(r => r.userId === authReq.user?.id);
    if (alreadyReviewed) {
      res.status(400).json({ message: 'You have already reviewed this product.' });
      return;
    }

    const newReview: Review = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      userId: authReq.user!.id,
      userName: authReq.user!.name,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const updated = db.addReviewToProduct(pId, newReview);
    res.status(201).json({ product: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting product review.' });
  }
});

export default router;
