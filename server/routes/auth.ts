import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-key-1337-market';

function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required.' });
    return;
  }

  try {
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const safeUser = db.createUser({
      name,
      email,
      password: passwordHash,
      role: 'user', // standard users are 'user'
      addresses: []
    });

    const token = generateToken(safeUser);

    res.status(201).json({
      user: safeUser,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering new user.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    // safe user without password
    const { password: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// GET /api/auth/me -> verify & return current user details
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const safeUser = db.findUserById(authReq.user.id);
  if (!safeUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.json({ user: safeUser });
});

// PUT /api/auth/profile -> update name, email, password
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { name, email, currentPassword, newPassword } = req.body;
  const userId = authReq.user.id;

  try {
    const rawUser = db.findRawUserById(userId);
    if (!rawUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    
    if (email && email.toLowerCase() !== rawUser.email.toLowerCase()) {
      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(400).json({ message: 'Email already taken by another account.' });
        return;
      }
      updates.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Current password is required to change password.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, rawUser.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = db.updateUser(userId, updates);
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile.' });
  }
});

// POST /api/auth/addresses -> manage user shipping addresses
router.post('/addresses', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { address } = req.body; // Full address object
  if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
    res.status(400).json({ message: 'Incomplete address details.' });
    return;
  }

  const userId = authReq.user.id;
  const rawUser = db.findRawUserById(userId);
  if (!rawUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const addresses = rawUser.addresses || [];
  
  if (address.isDefault) {
    addresses.forEach((addr: any) => addr.isDefault = false);
  }
  
  const newAddr = {
    ...address,
    isDefault: addresses.length === 0 ? true : !!address.isDefault
  };

  addresses.push(newAddr);
  const updatedUser = db.updateUser(userId, { addresses });
  res.json({ user: updatedUser });
});

// PUT /api/auth/addresses/default -> set default shipping address
router.put('/addresses/default', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { index } = req.body;
  const userId = authReq.user.id;
  const rawUser = db.findRawUserById(userId);
  
  if (!rawUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const addresses = rawUser.addresses || [];
  if (index < 0 || index >= addresses.length) {
    res.status(400).json({ message: 'Invalid address index.' });
    return;
  }

  addresses.forEach((addr: any, idx: number) => {
    addr.isDefault = idx === index;
  });

  const updatedUser = db.updateUser(userId, { addresses });
  res.json({ user: updatedUser });
});

// DELETE /api/auth/addresses/:index -> delete address by index
router.delete('/addresses/:index', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const index = parseInt(req.params.index);
  const userId = authReq.user.id;
  const rawUser = db.findRawUserById(userId);

  if (!rawUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  let addresses = rawUser.addresses || [];
  if (index < 0 || index >= addresses.length) {
    res.status(400).json({ message: 'Invalid address index.' });
    return;
  }

  const wasDefault = addresses[index].isDefault;
  addresses = addresses.filter((_, idx) => idx !== index);
  
  if (wasDefault && addresses.length > 0) {
    addresses[0].isDefault = true;
  }

  const updatedUser = db.updateUser(userId, { addresses });
  res.json({ user: updatedUser });
});

export default router;
