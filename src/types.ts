/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared type definitions for the E-Commerce marketplace application

export type UserRole = 'user' | 'admin';

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  addresses: Address[];
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  reviews: Review[];
  specifications: { [key: string]: string };
  isBestSeller?: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  category: string;
  brand: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  couponUsed?: string;
  updatedAt: string;
}

export interface WishlistItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brand: string;
  ratingAverage: number;
  stock: number;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
}

export interface OrderProduct {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface TrackingStep {
  status: OrderStatus;
  timestamp: string;
  description: string;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  userId: string;
  products: OrderProduct[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  shippingAddress: Address;
  orderStatus: OrderStatus;
  trackingHistory: TrackingStep[];
  createdAt: string;
  paymentMethod: string;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  categorySales: { category: string; amount: number; count: number }[];
  recentOrdersCount: number;
  monthlyRevenue: { month: string; sales: number }[];
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  expiryDate: string;
  isActive: boolean;
  description: string;
}
