import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/wishlist -> Get user wishlist
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const wishlist = db.getWishlist(authReq.user!.id);
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving wishlist.' });
  }
});

// POST /api/wishlist/toggle -> Add or remove item
router.post('/toggle', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ message: 'ProductId is required.' });
    return;
  }

  try {
    const product = db.findProductById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const wishlist = db.getWishlist(authReq.user!.id);
    const existingIndex = wishlist.items.findIndex(item => item.productId === productId);
    let action: 'added' | 'removed' = 'added';

    if (existingIndex > -1) {
      // Remove item
      wishlist.items = wishlist.items.filter(item => item.productId !== productId);
      action = 'removed';
    } else {
      // Add item
      wishlist.items.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        category: product.category,
        brand: product.brand,
        ratingAverage: product.rating.average,
        stock: product.stock
      });
    }

    const saved = db.saveWishlist(authReq.user!.id, wishlist);
    res.json({ wishlist: saved, action });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling wishlist item.' });
  }
});

export default router;
