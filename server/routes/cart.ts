import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { CartItem } from '../../src/types';

const router = Router();

// GET /api/cart -> Get user cart
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const cart = db.getCart(authReq.user!.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving shopping cart.' });
  }
});

// POST /api/cart/sync -> Overwrite core cart items state (bulk sync from local storage on login)
router.post('/sync', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    res.status(400).json({ message: 'Cart items list is required.' });
    return;
  }

  try {
    const cart = db.getCart(authReq.user!.id);
    cart.items = items;
    const saved = db.saveCart(authReq.user!.id, cart);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error syncing shopping cart.' });
  }
});

// POST /api/cart/add -> Add or update item quantity
router.post('/add', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    res.status(400).json({ message: 'Valid productId and positive quantity are required.' });
    return;
  }

  try {
    const product = db.findProductById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ message: `Insufficient stock. Only ${product.stock} units left.` });
      return;
    }

    const cart = db.getCart(authReq.user!.id);
    const existingIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
      const targetQty = cart.items[existingIndex].quantity + quantity;
      if (targetQty > product.stock) {
        res.status(400).json({ message: `Cannot add more. Limit exceeded. Total available stock: ${product.stock}` });
        return;
      }
      cart.items[existingIndex].quantity = targetQty;
    } else {
      cart.items.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity,
        stock: product.stock,
        category: product.category,
        brand: product.brand
      });
    }

    const saved = db.saveCart(authReq.user!.id, cart);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error adding item to cart.' });
  }
});

// PUT /api/cart/update -> Specific item quantity override
router.put('/update', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number' || quantity < 0) {
    res.status(400).json({ message: 'Valid productId and non-negative quantity are required.' });
    return;
  }

  try {
    const cart = db.getCart(authReq.user!.id);
    const existingIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingIndex === -1) {
      res.status(404).json({ message: 'Item not found in cart.' });
      return;
    }

    if (quantity === 0) {
      // Remove item
      cart.items = cart.items.filter(item => item.productId !== productId);
    } else {
      const product = db.findProductById(productId);
      if (!product) {
        res.status(404).json({ message: 'Product not found.' });
        return;
      }
      if (product.stock < quantity) {
        res.status(400).json({ message: `Insufficient stock. Max available: ${product.stock}` });
        return;
      }
      cart.items[existingIndex].quantity = quantity;
    }

    const saved = db.saveCart(authReq.user!.id, cart);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart item.' });
  }
});

// DELETE /api/cart/remove -> Remove single item completely
router.delete('/remove', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ message: 'ProductId is required.' });
    return;
  }

  try {
    const cart = db.getCart(authReq.user!.id);
    cart.items = cart.items.filter(item => item.productId !== productId);
    const saved = db.saveCart(authReq.user!.id, cart);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart.' });
  }
});

// POST /api/cart/coupon -> Apply/Validate promo code
router.post('/coupon', authenticateToken, (req: Request, res: Response) => {
  const { code, subtotal } = req.body;

  if (!code) {
    res.status(400).json({ message: 'Coupon code is required.' });
    return;
  }

  try {
    const coupon = db.findCouponByCode(code);
    if (!coupon) {
      res.status(400).json({ message: 'Invalid or expired coupon code.' });
      return;
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      res.status(400).json({ message: `Minimum purchase of $${coupon.minPurchase} is required for this coupon.` });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      description: coupon.description
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon code.' });
  }
});

export default router;
