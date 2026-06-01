import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { OrderStatus } from '../../src/types';

const router = Router();

// GET /api/admin/stats -> Analytical marketplace measurements
router.get('/stats', requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = db.getSalesStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics data.' });
  }
});

// GET /api/admin/users -> List all registered user entities
router.get('/users', requireAdmin, (req: Request, res: Response) => {
  try {
    const users = db.getUsers().map(({ password, ...safe }) => safe);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user list.' });
  }
});

// PUT /api/admin/users/:id -> Change role or credentials of a user
router.put('/users/:id', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { role, name, email } = req.body;

  try {
    const targetUser = db.findRawUserById(userId);
    if (!targetUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Safety: prevent self-demoting from admin
    const authReq = req as AuthenticatedRequest;
    if (userId === authReq.user!.id && role && role !== 'admin') {
      res.status(400).json({ message: 'You cannot demote yourself from Admin status.' });
      return;
    }

    const updates: any = {};
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (email) updates.email = email;

    const updated = db.updateUser(userId, updates);
    res.json({ user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user configuration.' });
  }
});

// DELETE /api/admin/users/:id -> Administrative delete user
router.delete('/users/:id', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    // Safety: prevent self-deletion
    const authReq = req as AuthenticatedRequest;
    if (userId === authReq.user!.id) {
      res.status(400).json({ message: 'You cannot administratively delete your own active session.' });
      return;
    }

    const deleted = db.deleteUser(userId);
    if (!deleted) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({ success: true, message: 'User successfully removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user account.' });
  }
});

// GET /api/admin/orders -> View all active orders in database
router.get('/orders', requireAdmin, (req: Request, res: Response) => {
  try {
    const orders = db.getOrders().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving system-wide orders.' });
  }
});

// PUT /api/admin/orders/:id/status -> Transition status of order
router.put('/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { status, description } = req.body;

  const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ message: `Invalid status code. Options: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const order = db.updateOrderStatus(orderId, status as OrderStatus, description);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    // Auto restock items if order gets cancelled
    if (status === 'cancelled') {
      order.products.forEach(item => {
        const dbProd = db.findProductById(item.productId);
        if (dbProd) {
          db.updateProduct(item.productId, {
            stock: dbProd.stock + item.quantity
          });
        }
      });
    }

    res.json({ message: `Order transitioned to ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status.' });
  }
});

export default router;
