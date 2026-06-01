import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';
import { User, Product, Order, Cart, Wishlist, Coupon, Address, Review, OrderStatus, SalesStats } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface SchemaType {
  users: any[];
  products: Product[];
  orders: Order[];
  carts: { [userId: string]: Cart };
  wishlists: { [userId: string]: Wishlist };
  coupons: Coupon[];
  recentlyViewed: { [userId: string]: string[] }; // Store productIds
}

// Initial seeded products for direct out-of-the-box professional e-commerce feel
const SEEDED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    title: 'Apple iPhone 15 Pro (128GB, Natural Titanium)',
    description: 'The iPhone 15 Pro is forged in titanium and features the groundbreaking A17 Pro chip, a customizable Action button, and a more versatile camera system. Its aerospace-grade titanium design is both strong and remarkably light, while its Super Retina XDR display delivers unmatched clarity with variable refresh rates up to 120Hz.',
    price: 999,
    category: 'Electronics',
    brand: 'Apple',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.8, count: 124 },
    reviews: [
      { id: 'rev_1_1', userId: 'user_mock_1', userName: 'Alex Johnson', rating: 5, comment: 'Incredible performance and build quality. The titanium finish is gorgeous!', createdAt: '2026-05-20T10:00:00Z' },
      { id: 'rev_1_2', userId: 'user_mock_2', userName: 'Maria Santos', rating: 4, comment: 'Excellent camera system. Battery life is solid but not a massive leap from the 14 Pro.', createdAt: '2026-05-22T14:30:00Z' }
    ],
    specifications: {
      'Display': '6.1-inch Super Retina XDR with ProMotion',
      'Processor': 'A17 Pro chip with 6-core GPU',
      'Main Camera': '48MP Main | 12MP Ultra Wide | 12MP Telephoto',
      'Battery': 'Up to 23 hours video playback',
      'Connector': 'USB-C (supports USB 3)'
    },
    isBestSeller: true,
    isFeatured: true,
    createdAt: '2026-05-15T08:00:00Z'
  },
  {
    id: 'prod_2',
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Our industry-leading noise canceling technology takes its biggest step forward. With four microphones on each earcup, ambient sound is captured even more accurately for a dramatic reduction in high frequency noise. Thanks to Auto NC Optimizer, noise canceling performance is automatically optimized based on wearing conditions and external environmental factors like atmospheric pressure.',
    price: 398,
    category: 'Electronics',
    brand: 'Sony',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.6, count: 85 },
    reviews: [
      { id: 'rev_2_1', userId: 'user_mock_1', userName: 'David Miller', rating: 5, comment: 'Active Noise Cancelling is top tier. Extremely comfortable even during long sessions.', createdAt: '2026-05-18T11:20:00Z' },
      { id: 'rev_2_2', userId: 'user_mock_3', userName: 'Jane Doe', rating: 4, comment: 'Sounds magnificent. The cases are a bit bulky compared to the XM4 though.', createdAt: '2026-05-19T09:15:00Z' }
    ],
    specifications: {
      'Driver Unit': '30mm',
      'Battery Life': 'Up to 30 hours',
      'Bluetooth Version': '5.2',
      'Charging Time': 'Quick charge (3 min for 3 hours playback)',
      'Weight': '250g'
    },
    isBestSeller: true,
    isFeatured: false,
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 'prod_3',
    title: 'Nike Air Max 270 (Running Shoes, Stealth Black)',
    description: 'Meet Nike\'s first lifestyle Air Max — designed to look and feel great anywhere. It delivers a super-soft ride and casual elegance with its huge heel window and array of sporty colors. The breathable woven fabric upper gives lightweight support, and the dual-density foam midsole provides plush, energized cushioning.',
    price: 150,
    category: 'Fashion',
    brand: 'Nike',
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.7, count: 210 },
    reviews: [
      { id: 'rev_3_1', userId: 'user_mock_2', userName: 'Emily Watson', rating: 5, comment: 'Super comfortable for walks and jogging. Fits true to size and looks sleek.', createdAt: '2026-05-24T08:45:00Z' }
    ],
    specifications: {
      'Style': 'AH8050-002',
      'Material': 'Woven and synthetic upper',
      'Technology': 'Large volume heel Max Air unit',
      'Origin': 'Imported',
      'Recommended Use': 'Lifestyle / Athleisure'
    },
    isBestSeller: false,
    isFeatured: true,
    createdAt: '2026-05-12T07:22:00Z'
  },
  {
    id: 'prod_4',
    title: 'Instant Pot Duo 7-in-1 Multi-Cooker (6 Quart)',
    description: 'The Instant Pot Duo has been simplified with an easy-to-use control panel, customized presets, and a premium tri-ply stainless steel cooking pot. Enjoy 13 smart programs for single-touch slow cooking, pressure cooking, steaming, and more. It is designed to cook delicious, healthy meals up to 70% faster.',
    price: 99,
    category: 'Home & Kitchen',
    brand: 'Instant Pot',
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.5, count: 140 },
    reviews: [
      { id: 'rev_4_1', userId: 'user_mock_3', userName: 'Robert Thompson', rating: 5, comment: 'A complete game changer in the kitchen! Made perfect pulled pork in 45 minutes.', createdAt: '2026-05-21T18:10:00Z' }
    ],
    specifications: {
      'Capacity': '6 Quarts',
      'Core Functions': '7-in-1 customizable pressure/slow cooker',
      'Material': 'Food-grade stainless steel (18/8)',
      'Safety': '10+ built-in safety features with Overheat Protection',
      'Power': '1000W'
    },
    isBestSeller: true,
    isFeatured: false,
    createdAt: '2026-05-08T15:30:00Z'
  },
  {
    id: 'prod_5',
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    description: 'Logitech\'s premier ergonomic mouse is remade for productivity. It features ultra-quiet tactile clicks that give satisfying feedback with 90% less noise compared to its predecessor. Equipped with an 8000 DPI optical sensor that tracks anywhere — even on glass — and the iconic MagSpeed electromagnetic scroll wheel.',
    price: 99,
    category: 'Electronics',
    brand: 'Logitech',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.9, count: 350 },
    reviews: [
      { id: 'rev_5_1', userId: 'user_mock_1', userName: 'Chris Evans', rating: 5, comment: 'Best mouse ever constructed. Scrolling feels like magic, and hand fatigue is completely gone.', createdAt: '2026-05-25T11:00:00Z' }
    ],
    specifications: {
      'Sensor Technology': 'Darkfield high precision',
      'Nominal Value': '1000 DPI (settable from 200 to 8000)',
      'Buttons': '7 buttons (Left/Right-click, Back/Forward, App-Switch, Wheel mode-shift, Middle click)',
      'Battery': 'Rechargeable Li-Po (500 mAh); up to 70 days on full charge',
      'Compatibility': 'Bluetooth Low Energy & Logi Bolt'
    },
    isBestSeller: true,
    isFeatured: true,
    createdAt: '2026-05-14T09:40:00Z'
  },
  {
    id: 'prod_6',
    title: 'Adidas Originals Essential Trefoil Hoodie',
    description: 'This classic streetwear staple is made of heavyweight French terry for maximum cozy warmth. Centered with the authentic Adidas embroidered Trefoil logo on the chest. Designed with a roomy kangaroo pouch pocket, ribbing on the collar/hem, and an adjustable drawcord crossover hood.',
    price: 75,
    category: 'Fashion',
    brand: 'Adidas',
    stock: 95,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.4, count: 58 },
    reviews: [
      { id: 'rev_6_1', userId: 'user_mock_2', userName: 'Liam O\'connor', rating: 4, comment: 'Thick fabric, sits very well. Slightly larger fit but super comfortable.', createdAt: '2026-05-23T16:20:00Z' }
    ],
    specifications: {
      'Fabric': '100% French Terry cotton',
      'Fit': 'Regular relaxed fit',
      'Care': 'Machine wash cold delicate cycle',
      'Kangaroo Pocket': 'Front center compartment'
    },
    isBestSeller: false,
    isFeatured: false,
    createdAt: '2026-05-20T10:15:00Z'
  },
  {
    id: 'prod_7',
    title: 'Bose Smart Soundbar 600 with Dolby Atmos',
    description: 'For movies, TV, and music, this smart soundbar delivers shockingly immersive audio for its size. Featuring vertical firing transducers to accurately project dialogue, action events, and soundscapes overhead, bringing true Dolby Atmos performance right into your living room space.',
    price: 499,
    category: 'Electronics',
    brand: 'Bose',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.5, count: 42 },
    reviews: [
      { id: 'rev_7_1', userId: 'user_mock_3', userName: 'Patricia Moore', rating: 5, comment: 'Dolby Atmos effects are very noticeable. Setup with HDMI eARC is flawless.', createdAt: '2026-05-26T20:30:00Z' }
    ],
    specifications: {
      'Audio Formats': 'Dolby Atmos, Dolby Digital, Dolby Digital Plus',
      'Connectivity': 'HDMI eARC, Optical, Bluetooth, Wi-Fi, Apple AirPlay 2',
      'Smart Voice Support': 'Amazon Alexa Built-in & Works with Google Home',
      'Dimensions': '2.2" H x 27.3" W x 4.1" D'
    },
    isBestSeller: false,
    isFeatured: true,
    createdAt: '2026-05-18T13:40:00Z'
  },
  {
    id: 'prod_8',
    title: 'The Alchemist by Paulo Coelho (Anniversary Paperback)',
    description: 'Paulo Coelho\'s masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. His quest will lead him to riches far different — and far more satisfying — than he ever imagined. Santiago\'s journey teaches us about the essential wisdom of listening to our hearts.',
    price: 15,
    category: 'Books',
    brand: 'HarperOne',
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop'
    ],
    rating: { average: 4.8, count: 680 },
    reviews: [
      { id: 'rev_8_1', userId: 'user_mock_1', userName: 'Booklover99', rating: 5, comment: 'Deeply inspirational, a book to read over and over again.', createdAt: '2026-05-15T09:00:00Z' }
    ],
    specifications: {
      'Publisher': 'HarperOne (Spl. 25th Anniversary Edition)',
      'Language': 'English',
      'Length': '163 pages',
      'Dimensions': '5.3" x 0.4" x 8.0"',
      'Format': 'Paperback'
    },
    isBestSeller: true,
    isFeatured: false,
    createdAt: '2026-05-01T04:00:00Z'
  }
];

// Initial coupons
const SEEDED_COUPONS: Coupon[] = [
  { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minPurchase: 50, expiryDate: '2027-12-31', isActive: true, description: '10% OFF on purchases above $50' },
  { code: 'SUPERDEAL', discountType: 'fixed', discountValue: 25, minPurchase: 150, expiryDate: '2027-12-31', isActive: true, description: 'Flat $25 OFF on orders of $150 or more' },
  { code: 'FESTIVE20', discountType: 'percentage', discountValue: 20, minPurchase: 100, expiryDate: '2027-12-31', isActive: true, description: 'Festive Special: 20% OFF on orders above $100' }
];

// --- Mongoose Schema Definitions ---

const AddressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses: [AddressSchema],
  createdAt: { type: String, required: true }
});

const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

const ReviewSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });

const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  stock: { type: Number, required: true },
  images: [{ type: String }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [ReviewSchema],
  specifications: { type: Map, of: String },
  isBestSeller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: String, required: true }
});

const ProductModel = (mongoose.models.Product || mongoose.model('Product', ProductSchema)) as any;

const CartItemSchema = new Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true }
}, { _id: false });

const CartSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  items: [CartItemSchema],
  couponUsed: { type: String },
  updatedAt: { type: String, required: true }
});

const CartModel = (mongoose.models.Cart || mongoose.model('Cart', CartSchema)) as any;

const WishlistItemSchema = new Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  ratingAverage: { type: Number, required: true },
  stock: { type: Number, required: true }
}, { _id: false });

const WishlistSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  items: [WishlistItemSchema]
});

const WishlistModel = (mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema)) as any;

const OrderProductSchema = new Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true }
}, { _id: false });

const TrackingStepSchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: String },
  description: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
}, { _id: false });

const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  products: [OrderProductSchema],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number },
  couponCode: { type: String },
  shippingAddress: AddressSchema,
  orderStatus: { type: String, required: true },
  trackingHistory: [TrackingStepSchema],
  paymentMethod: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const OrderModel = (mongoose.models.Order || mongoose.model('Order', OrderSchema)) as any;

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number },
  expiryDate: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, required: true }
});

const CouponModel = (mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema)) as any;

const RecentlyViewedSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  productIds: [{ type: String }]
});

const RecentlyViewedModel = (mongoose.models.RecentlyViewed || mongoose.model('RecentlyViewed', RecentlyViewedSchema)) as any;


export class Database {
  private isConnected = false;
  private data: SchemaType = {
    users: [],
    products: [],
    orders: [],
    carts: {},
    wishlists: {},
    coupons: [],
    recentlyViewed: {}
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supercart';
      console.log(`[Database] Connecting to MongoDB: ${dbUri}`);
      await mongoose.connect(dbUri, {
        serverSelectionTimeoutMS: 2000,
      });
      this.isConnected = true;
      console.log('[Database] MongoDB Connected Successfully.');

      // Migrate from db.json if it exists and MongoDB count is zero
      if (fs.existsSync(DB_FILE)) {
        console.log('[Migration] Migration check. Verifying current MongoDB counts before import...');
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const fileData = JSON.parse(raw);

          if (fileData.users?.length > 0) {
            const mUsers = await UserModel.countDocuments();
            if (mUsers === 0) {
              console.log(`[Migration] Copying ${fileData.users.length} users into MongoDB...`);
              await UserModel.insertMany(fileData.users);
            }
          }

          if (fileData.products?.length > 0) {
            const mProducts = await ProductModel.countDocuments();
            if (mProducts === 0) {
              console.log(`[Migration] Copying ${fileData.products.length} products into MongoDB...`);
              await ProductModel.insertMany(fileData.products);
            }
          }

          if (fileData.orders?.length > 0) {
            const mOrders = await OrderModel.countDocuments();
            if (mOrders === 0) {
              console.log(`[Migration] Copying ${fileData.orders.length} orders into MongoDB...`);
              await OrderModel.insertMany(fileData.orders);
            }
          }

          if (fileData.carts) {
            const mCarts = await CartModel.countDocuments();
            if (mCarts === 0) {
              const cartsToInsert = Object.entries(fileData.carts).map(([uId, c]: any) => ({
                userId: uId,
                items: c.items,
                couponUsed: c.couponUsed,
                updatedAt: c.updatedAt || new Date().toISOString()
              }));
              if (cartsToInsert.length > 0) {
                console.log(`[Migration] Copying ${cartsToInsert.length} shopping carts...`);
                await CartModel.insertMany(cartsToInsert);
              }
            }
          }

          if (fileData.wishlists) {
            const mWishlists = await WishlistModel.countDocuments();
            if (mWishlists === 0) {
              const wishlistsToInsert = Object.entries(fileData.wishlists).map(([uId, w]: any) => ({
                userId: uId,
                items: w.items
              }));
              if (wishlistsToInsert.length > 0) {
                console.log(`[Migration] Copying ${wishlistsToInsert.length} wishlists...`);
                await WishlistModel.insertMany(wishlistsToInsert);
              }
            }
          }

          if (fileData.coupons?.length > 0) {
            const mCoupons = await CouponModel.countDocuments();
            if (mCoupons === 0) {
              console.log(`[Migration] Copying ${fileData.coupons.length} coupons into MongoDB...`);
              await CouponModel.insertMany(fileData.coupons);
            }
          }

          if (fileData.recentlyViewed) {
            const mRecents = await RecentlyViewedModel.countDocuments();
            if (mRecents === 0) {
              const recentsToInsert = Object.entries(fileData.recentlyViewed).map(([uId, pIds]: any) => ({
                userId: uId,
                productIds: pIds
              }));
              if (recentsToInsert.length > 0) {
                console.log(`[Migration] Copying recently viewed entries...`);
                await RecentlyViewedModel.insertMany(recentsToInsert);
              }
            }
          }
        } catch (e) {
          console.error('[Migration] Migration from db.json failed:', e);
        }
      }

      // Seeding in case database is still blank (no file or empty file)
      const usersCount = await UserModel.countDocuments();
      if (usersCount === 0) {
        console.log('[Seeding] Seeding admin@ecommerce.com and user@ecommerce.com accounts...');
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync('admin123', salt);
        const userPasswordHash = bcrypt.hashSync('user123', salt);

        await UserModel.insertMany([
          {
            id: 'admin_1',
            name: 'Supreme Admin',
            email: 'admin@ecommerce.com',
            password: passwordHash,
            role: 'admin',
            addresses: [{
              fullName: 'Corporate HQ',
              phone: '+14155552671',
              street: '1600 Amphitheatre Parkway',
              city: 'Mountain View',
              state: 'CA',
              zipCode: '94043',
              country: 'USA',
              isDefault: true
            }],
            createdAt: new Date().toISOString()
          },
          {
            id: 'user_1',
            name: 'John Customer',
            email: 'user@ecommerce.com',
            password: userPasswordHash,
            role: 'user',
            addresses: [{
              fullName: 'John Customer',
              phone: '+15104443322',
              street: '221B Baker Street',
              city: 'London',
              state: 'Greater London',
              zipCode: 'NW1 6XE',
              country: 'United Kingdom',
              isDefault: true
            }],
            createdAt: new Date().toISOString()
          }
        ]);
      }

      const productsCount = await ProductModel.countDocuments();
      if (productsCount === 0) {
        console.log('[Seeding] Seeding initial product collections...');
        await ProductModel.insertMany(SEEDED_PRODUCTS);
      }

      const couponsCount = await CouponModel.countDocuments();
      if (couponsCount === 0) {
        console.log('[Seeding] Seeding standard promotional coupons...');
        await CouponModel.insertMany(SEEDED_COUPONS);
      }

      // Build initial synchronous in-memory cache
      await this.syncAllFromDB();

    } catch (err) {
      console.log('[Database] MongoDB connection not available. Falling back to robust local storage file (db.json).');
      this.isConnected = false;
      this.loadFallbackJSON();
    }
  }

  private loadFallbackJSON() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = [...SEEDED_PRODUCTS];
        }
        if (!this.data.orders) this.data.orders = [];
        if (!this.data.carts) this.data.carts = {};
        if (!this.data.wishlists) this.data.wishlists = {};
        if (!this.data.coupons || this.data.coupons.length === 0) {
          this.data.coupons = [...SEEDED_COUPONS];
        }
        if (!this.data.recentlyViewed) this.data.recentlyViewed = {};
      } else {
        this.data = {
          users: [],
          products: [...SEEDED_PRODUCTS],
          orders: [],
          carts: {},
          wishlists: {},
          coupons: [...SEEDED_COUPONS],
          recentlyViewed: {}
        };
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync('admin123', salt);
        const userPasswordHash = bcrypt.hashSync('user123', salt);
        
        this.data.users.push({
          id: 'admin_1',
          name: 'Supreme Admin',
          email: 'admin@ecommerce.com',
          password: passwordHash,
          role: 'admin',
          addresses: [{
            fullName: 'Corporate HQ',
            phone: '+14155552671',
            street: '1600 Amphitheatre Parkway',
            city: 'Mountain View',
            state: 'CA',
            zipCode: '94043',
            country: 'USA',
            isDefault: true
          }],
          createdAt: new Date().toISOString()
        });

        this.data.users.push({
          id: 'user_1',
          name: 'John Customer',
          email: 'user@ecommerce.com',
          password: userPasswordHash,
          role: 'user',
          addresses: [{
            fullName: 'John Customer',
            phone: '+15104443322',
            street: '221B Baker Street',
            city: 'London',
            state: 'Greater London',
            zipCode: 'NW1 6XE',
            country: 'United Kingdom',
            isDefault: true
          }],
          createdAt: new Date().toISOString()
        });
        this.saveBackupJSON();
      }
    } catch (e) {
      console.error('[Fallback] JSON backup load failed:', e);
    }
  }

  public async syncAllFromDB() {
    try {
      const users = await UserModel.find({});
      const products = await ProductModel.find({});
      const orders = await OrderModel.find({});
      const cartsList = await CartModel.find({});
      const wishlistsList = await WishlistModel.find({});
      const coupons = await CouponModel.find({});
      const recentsList = await RecentlyViewedModel.find({});

      const carts: { [userId: string]: Cart } = {};
      cartsList.forEach(c => {
        carts[c.userId] = {
          userId: c.userId,
          items: c.items.map((it: any) => ({
            productId: it.productId,
            title: it.title,
            price: it.price,
            image: it.image,
            quantity: it.quantity,
            stock: it.stock,
            category: it.category,
            brand: it.brand
          })),
          couponUsed: c.couponUsed,
          updatedAt: c.updatedAt
        };
      });

      const wishlists: { [userId: string]: Wishlist } = {};
      wishlistsList.forEach(w => {
        wishlists[w.userId] = {
          userId: w.userId,
          items: w.items.map((it: any) => ({
            productId: it.productId,
            title: it.title,
            price: it.price,
            image: it.image,
            category: it.category,
            brand: it.brand,
            ratingAverage: it.ratingAverage,
            stock: it.stock
          }))
        };
      });

      const recentlyViewed: { [userId: string]: string[] } = {};
      recentsList.forEach(r => {
        recentlyViewed[r.userId] = r.productIds;
      });

      this.data = {
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          addresses: u.addresses,
          createdAt: u.createdAt
        })),
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          category: p.category,
          brand: p.brand,
          stock: p.stock,
          images: p.images,
          rating: p.rating,
          reviews: p.reviews,
          specifications: p.specifications ? Object.fromEntries(p.specifications) : {},
          isBestSeller: p.isBestSeller,
          isFeatured: p.isFeatured,
          createdAt: p.createdAt
        })),
        orders: orders.map(o => ({
          id: o.id,
          userId: o.userId,
          products: o.products,
          totalAmount: o.totalAmount,
          discountAmount: o.discountAmount,
          couponCode: o.couponCode,
          shippingAddress: o.shippingAddress,
          orderStatus: o.orderStatus,
          trackingHistory: o.trackingHistory,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt
        })),
        carts,
        wishlists,
        coupons: coupons.map(c => ({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minPurchase: c.minPurchase,
          expiryDate: c.expiryDate,
          isActive: c.isActive,
          description: c.description
        })),
        recentlyViewed
      };

      this.saveBackupJSON(); // Sync local file as a live hot-standby copy
      console.log('[Database] synchronized memory structure with MongoDB.');
    } catch (err) {
      console.error('[Database] Sync error, using existing cache state:', err);
    }
  }

  private saveBackupJSON() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Backup] JSON save failed:', e);
    }
  }

  // Fallback support for any explicit write requests
  public save() {
    this.saveBackupJSON();
  }

  // --- Users Helper APIs ---
  public getUsers() {
    return this.data.users;
  }

  public findUserById(id: string) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public findRawUserById(id: string) {
    return this.data.users.find(u => u.id === id) || null;
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public createUser(userData: any) {
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      addresses: [],
      role: 'user',
      ...userData
    };
    
    // 1. Sync memory
    this.data.users.push(newUser);
    this.saveBackupJSON();

    // 2. Persist MongoDB
    if (this.isConnected) {
      UserModel.create({ ...newUser }).catch((err: any) => {
        console.error('[Database] MongoDB UserModel.create error:', err);
      });
    }

    const { password, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUser(id: string, updates: any) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const current = this.data.users[idx];
    const updated = {
      ...current,
      ...updates,
      id,
      createdAt: current.createdAt
    };

    // 1. Sync memory
    this.data.users[idx] = updated;
    this.saveBackupJSON();

    // 2. Persist MongoDB
    if (this.isConnected) {
      UserModel.findOneAndUpdate({ id }, { $set: updates }).catch((err: any) => {
        console.error('[Database] MongoDB UserModel.findOneAndUpdate error:', err);
      });
    }

    const { password, ...safeUser } = updated;
    return safeUser;
  }

  public deleteUser(id: string) {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      delete this.data.carts[id];
      delete this.data.wishlists[id];
      delete this.data.recentlyViewed[id];
      this.saveBackupJSON();

      // Async DB deletes
      if (this.isConnected) {
        UserModel.deleteOne({ id }).catch((err: any) => console.error(err));
        CartModel.deleteOne({ userId: id }).catch((err: any) => console.error(err));
        WishlistModel.deleteOne({ userId: id }).catch((err: any) => console.error(err));
        RecentlyViewedModel.deleteOne({ userId: id }).catch((err: any) => console.error(err));
      }
      return true;
    }
    return false;
  }

  // --- Products Helper APIs ---
  public getProducts() {
    return this.data.products;
  }

  public findProductById(id: string) {
    return this.data.products.find(p => p.id === id) || null;
  }

  public createProduct(productData: Partial<Product>) {
    const newProduct: Product = {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      title: productData.title || 'New Product',
      description: productData.description || '',
      price: Number(productData.price) || 0,
      category: productData.category || 'Uncategorized',
      brand: productData.brand || 'Generic',
      stock: Number(productData.stock) || 0,
      images: productData.images && productData.images.length > 0 ? productData.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'],
      rating: { average: 0, count: 0 },
      reviews: [],
      specifications: productData.specifications || {},
      isBestSeller: !!productData.isBestSeller,
      isFeatured: !!productData.isFeatured,
      createdAt: new Date().toISOString()
    };

    // 1. Sync memory
    this.data.products.push(newProduct);
    this.saveBackupJSON();

    // 2. Persist MongoDB
    if (this.isConnected) {
      ProductModel.create({ ...newProduct }).catch((err: any) => {
        console.error('[Database] MongoDB ProductModel.create error:', err);
      });
    }

    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = this.data.products[idx];
    const updated = {
      ...current,
      ...updates,
      id,
      rating: current.rating,
      reviews: current.reviews
    } as Product;

    // 1. Sync memory
    this.data.products[idx] = updated;
    this.saveBackupJSON();

    // 2. Persist MongoDB
    if (this.isConnected) {
      ProductModel.findOneAndUpdate({ id }, { $set: updates }).catch((err: any) => {
        console.error('[Database] MongoDB ProductModel.findOneAndUpdate error:', err);
      });
    }

    return updated;
  }

  public deleteProduct(id: string) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveBackupJSON();

      // Persist MongoDB
      if (this.isConnected) {
        ProductModel.deleteOne({ id }).catch((err: any) => {
          console.error('[Database] MongoDB ProductModel.deleteOne error:', err);
        });
      }
      return true;
    }
    return false;
  }

  public addReviewToProduct(productId: string, review: Review) {
    const product = this.findProductById(productId);
    if (!product) return null;

    product.reviews = product.reviews || [];
    product.reviews.unshift(review);

    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = {
      average: Number((totalRating / product.reviews.length).toFixed(1)),
      count: product.reviews.length
    };

    this.saveBackupJSON();

    // Persist MongoDB
    if (this.isConnected) {
      ProductModel.findOneAndUpdate(
        { id: productId },
        { $set: { reviews: product.reviews, rating: product.rating } }
      ).catch((err: any) => {
        console.error('[Database] MongoDB addReviewToProduct error:', err);
      });
    }

    return product;
  }

  // --- Cart Helpers ---
  public getCart(userId: string): Cart {
    if (!this.data.carts[userId]) {
      this.data.carts[userId] = {
        userId,
        items: [],
        updatedAt: new Date().toISOString()
      };
      this.saveBackupJSON();

      // Persist MongoDB Setup
      if (this.isConnected) {
        CartModel.create({
          userId,
          items: [],
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }
    return this.data.carts[userId];
  }

  public saveCart(userId: string, cart: Cart) {
    this.data.carts[userId] = {
      ...cart,
      userId,
      updatedAt: new Date().toISOString()
    };
    this.saveBackupJSON();

    // Persist MongoDB Setup
    if (this.isConnected) {
      CartModel.findOneAndUpdate(
        { userId },
        { $set: { items: cart.items, couponUsed: cart.couponUsed, updatedAt: cart.updatedAt } },
        { upsert: true }
      ).catch((err: any) => {
        console.error('[Database] MongoDB saveCart error:', err);
      });
    }

    return this.data.carts[userId];
  }

  // --- Wishlist Helpers ---
  public getWishlist(userId: string): Wishlist {
    if (!this.data.wishlists[userId]) {
      this.data.wishlists[userId] = {
        userId,
        items: []
      };
      this.saveBackupJSON();

      if (this.isConnected) {
        WishlistModel.create({
          userId,
          items: []
        }).catch(() => {});
      }
    }
    return this.data.wishlists[userId];
  }

  public saveWishlist(userId: string, wishlist: Wishlist) {
    this.data.wishlists[userId] = wishlist;
    this.saveBackupJSON();

    if (this.isConnected) {
      WishlistModel.findOneAndUpdate(
        { userId },
        { $set: { items: wishlist.items } },
        { upsert: true }
      ).catch((err: any) => {
        console.error('[Database] MongoDB saveWishlist error:', err);
      });
    }

    return this.data.wishlists[userId];
  }

  // --- Orders Helpers ---
  public getOrders() {
    return this.data.orders;
  }

  public getOrdersByUserId(userId: string) {
    return this.data.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(orderData: Partial<Order>) {
    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      userId: orderData.userId || '',
      products: orderData.products || [],
      totalAmount: orderData.totalAmount || 0,
      discountAmount: orderData.discountAmount || 0,
      couponCode: orderData.couponCode || undefined,
      shippingAddress: orderData.shippingAddress as Address,
      orderStatus: 'pending',
      paymentMethod: orderData.paymentMethod || 'Credit/Debit Card',
      trackingHistory: [
        { status: 'pending', timestamp: new Date().toISOString(), description: 'Order has been placed and is awaiting confirmation.', isCompleted: true },
        { status: 'processing', timestamp: '', description: 'Seller is packing your items.', isCompleted: false },
        { status: 'shipped', timestamp: '', description: 'Handed over to delivery courier.', isCompleted: false },
        { status: 'delivered', timestamp: '', description: 'Successfully delivered to shipping address.', isCompleted: false }
      ],
      createdAt: new Date().toISOString()
    };

    this.data.orders.push(newOrder);
    this.saveBackupJSON();

    // Persist MongoDB
    if (this.isConnected) {
      OrderModel.create({ ...newOrder }).catch((err: any) => {
        console.error('[Database] MongoDB createOrder error:', err);
      });
    }

    return newOrder;
  }

  public updateOrderStatus(id: string, status: OrderStatus, customDescription?: string) {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return null;

    order.orderStatus = status;

    const stepIdx = order.trackingHistory.findIndex(s => s.status === status);
    if (stepIdx !== -1) {
      order.trackingHistory[stepIdx].isCompleted = true;
      order.trackingHistory[stepIdx].timestamp = new Date().toISOString();
      if (customDescription) {
        order.trackingHistory[stepIdx].description = customDescription;
      }
    } else {
      order.trackingHistory.push({
        status,
        timestamp: new Date().toISOString(),
        description: customDescription || `Order status updated to ${status}.`,
        isCompleted: true
      });
    }

    const statusOrder: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStatusIdx = statusOrder.indexOf(status);
    if (currentStatusIdx !== -1) {
      for (let i = 0; i < currentStatusIdx; i++) {
        const prevStatus = statusOrder[i];
        const step = order.trackingHistory.find(s => s.status === prevStatus);
        if (step && !step.isCompleted) {
          step.isCompleted = true;
          step.timestamp = step.timestamp || new Date().toISOString();
        }
      }
    }

    this.saveBackupJSON();

    // Persist MongoDB
    if (this.isConnected) {
      OrderModel.findOneAndUpdate(
        { id },
        { $set: { orderStatus: order.orderStatus, trackingHistory: order.trackingHistory } }
      ).catch((err: any) => {
        console.error('[Database] MongoDB updateOrderStatus error:', err);
      });
    }

    return order;
  }

  // --- Recently Viewed ---
  public trackRecentlyViewed(userId: string, productId: string) {
    if (!this.data.recentlyViewed[userId]) {
      this.data.recentlyViewed[userId] = [];
    }

    let list = this.data.recentlyViewed[userId].filter(id => id !== productId);
    list.unshift(productId);

    if (list.length > 10) {
      list = list.slice(0, 10);
    }

    this.data.recentlyViewed[userId] = list;
    this.saveBackupJSON();

    // Persist MongoDB
    if (this.isConnected) {
      RecentlyViewedModel.findOneAndUpdate(
        { userId },
        { $set: { productIds: list } },
        { upsert: true }
      ).catch((err: any) => {
        console.error('[Database] MongoDB trackRecentlyViewed error:', err);
      });
    }
  }

  public getRecentlyViewed(userId: string): Product[] {
    const ids = this.data.recentlyViewed[userId] || [];
    return ids
      .map(id => this.findProductById(id))
      .filter((p): p is Product => p !== null);
  }

  // --- Coupons ---
  public getCoupons() {
    return this.data.coupons.filter(c => c.isActive);
  }

  public findCouponByCode(code: string) {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive) || null;
  }

  // --- Analytics Matrix Helper ---
  public getSalesStatistics(): SalesStats {
    const totalOrders = this.data.orders.length;
    const completedOrders = this.data.orders.filter(o => o.orderStatus !== 'cancelled');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalUsers = this.data.users.length;
    const totalProducts = this.data.products.length;

    const categorySalesObj: { [category: string]: { amount: number; count: number } } = {};
    completedOrders.forEach(order => {
      order.products.forEach(item => {
        const prod = this.findProductById(item.productId);
        const cat = prod?.category || 'Electronics';
        if (!categorySalesObj[cat]) {
          categorySalesObj[cat] = { amount: 0, count: 0 };
        }
        categorySalesObj[cat].amount += item.price * item.quantity;
        categorySalesObj[cat].count += item.quantity;
      });
    });

    const categorySales = Object.entries(categorySalesObj).map(([category, info]) => ({
      category,
      amount: Math.round(info.amount),
      count: info.count
    }));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      const monthLabel = months[idx];
      const factor = i === 0 ? 1 : 0.8 - Math.random() * 0.4;
      monthlyRevenue.push({
        month: monthLabel,
        sales: Math.round(totalRevenue * factor * 0.2 + (i + 1) * 120)
      });
    }

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalUsers,
      totalProducts,
      categorySales,
      recentOrdersCount: this.data.orders.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        const past24hObj = Date.now() - (24 * 60 * 60 * 1000);
        return orderTime > past24hObj;
      }).length,
      monthlyRevenue
    };
  }
}

export const db = new Database();
export default db;
