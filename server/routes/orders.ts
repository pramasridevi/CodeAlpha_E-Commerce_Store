import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Address, OrderProduct } from '../../src/types';

const router = Router();

// GET /api/orders -> List of orders for current user
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const orders = db.getOrdersByUserId(authReq.user!.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your orders.' });
  }
});

// GET /api/orders/:id -> Detailed order tracker
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const oId = req.params.id;

  try {
    const orders = db.getOrders();
    const order = orders.find(o => o.id === oId);

    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    // Authorization safeguard: must be either the placing user or an administrator
    if (order.userId !== authReq.user!.id && authReq.user!.role !== 'admin') {
      res.status(403).json({ message: 'Access forbidden. Not authorized to see this order.' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order details.' });
  }
});

// POST /api/orders -> Place a new order
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { products, shippingAddress, totalAmount, discountAmount, couponCode, paymentMethod } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    res.status(400).json({ message: 'Product items list are required to place an order.' });
    return;
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
    res.status(400).json({ message: 'Valid shipping address is required.' });
    return;
  }

  try {
    // 1. Stock Management validation & depletion
    const verifiedProducts: OrderProduct[] = [];
    
    for (const item of products) {
      const dbProd = db.findProductById(item.productId);
      if (!dbProd) {
        res.status(404).json({ message: `Product "${item.title}" no longer exists in our catalog.` });
        return;
      }

      if (dbProd.stock < item.quantity) {
        res.status(400).json({ 
          message: `Insufficient stock for "${dbProd.title}". Only ${dbProd.stock} left in stock. please reduce quantity.` 
        });
        return;
      }

      verifiedProducts.push({
        productId: dbProd.id,
        title: dbProd.title,
        price: dbProd.price,
        quantity: item.quantity,
        image: dbProd.images[0]
      });
    }

    // Deplete stocks since validation is fully green
    for (const item of products) {
      const dbProd = db.findProductById(item.productId)!;
      db.updateProduct(item.productId, {
        stock: dbProd.stock - item.quantity
      });
    }

    // 2. Clear current user's shopping cart after placing order
    const cart = db.getCart(authReq.user!.id);
    cart.items = [];
    db.saveCart(authReq.user!.id, cart);

    // 3. Create the Order
    const newOrder = db.createOrder({
      userId: authReq.user!.id,
      products: verifiedProducts,
      totalAmount,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || undefined,
      shippingAddress: shippingAddress as Address,
      paymentMethod: paymentMethod || 'Credit/Debit Card'
    });

    res.status(201).json({
      message: 'Order placed successfully.',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing your order.' });
  }
});

export default router;
