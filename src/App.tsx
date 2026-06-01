import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import ProductCard from './components/ProductCard';
import FiltersSidebar from './components/FiltersSidebar';
import AuthModal from './components/AuthModal';
import UserProfileView from './components/UserProfileView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import ProductDetailsView from './components/ProductDetailsView';
import WishlistView from './components/WishlistView';
import AdminDashboardView from './components/AdminDashboardView';
import { api } from './lib/api';
import { Product, Cart, Wishlist, User, Order } from './types';
import { Sparkles, ShoppingBag, ListFilter, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication & Users states
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Core inventories states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);

  // Application routing / view screen states
  // Views: 'home' | 'product-details' | 'cart' | 'wishlist' | 'checkout' | 'profile' | 'admin'
  const [currentView, setCurrentView] = useState<'home' | 'product-details' | 'cart' | 'wishlist' | 'checkout' | 'profile' | 'admin'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Search & Filter system parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('');

  // Interface loading states
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [cartLoadingId, setCartLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Checkout transitions passing states
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Theme Sync on mounting
  useEffect(() => {
    // Check local storage theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Try auto-loading user profile session from localStorage JWT
    const token = localStorage.getItem('ecommerce_token');
    if (token) {
      api.auth.me()
        .then(resp => {
          setUser(resp.user);
        })
        .catch(() => {
          localStorage.removeItem('ecommerce_token');
        });
    }

    // Always seed base catalog
    fetchProducts();
  }, []);

  // Sync inventories pools on change of user session status
  useEffect(() => {
    syncUserDataPools();
  }, [user]);

  const syncUserDataPools = async () => {
    if (localStorage.getItem('ecommerce_token')) {
      try {
        const [cartData, wishlistData] = await Promise.all([
          api.cart.get(),
          api.wishlist.get()
        ]);
        setCart(cartData);
        setWishlist(wishlistData);
      } catch (err) {
        console.error('Error syncing user pools:', err);
      }
    } else {
      setCart(null);
      setWishlist(null);
    }
  };

  const fetchProducts = async () => {
    setFetchingProducts(true);
    try {
      const resp = await api.products.list({ limit: 120 });
      setProducts(resp.products);
      
      // Calculate active categories list automatically
      const cats = Array.from(new Set(resp.products.map(p => p.category)));
      setCategories(cats);
    } catch (e) {
      showToast('Failed to connect to marketplace data catalog.', 'error');
    } finally {
      setFetchingProducts(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Toggle night mode stylesheet mapper
  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    showToast(`Switched to ${nextDark ? 'Night' : 'Day'} visual theme.`, 'success');
  };

  // Authentication Callbacks
  const handleLoginSuccess = (profile: User) => {
    setUser(profile);
    setShowAuthModal(false);
    showToast(`Welcome back, ${profile.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('ecommerce_token');
    setUser(null);
    setCart(null);
    setWishlist(null);
    setCurrentView('home');
    showToast('Logout processed successfully.', 'success');
  };

  // Cart operations triggers
  const handleAddToCart = async (productId: string) => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please login to add items to your cart.', 'error');
      return;
    }

    setCartLoadingId(productId);
    try {
      const updatedCart = await api.cart.add(productId, 1);
      setCart(updatedCart);
      showToast('Product added to your cart!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error occurred while adding item to cart.', 'error');
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleBuyNow = async (productId: string) => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please login to process instant purchase.', 'error');
      return;
    }

    setCartLoadingId(productId);
    try {
      const updatedCart = await api.cart.add(productId, 1);
      setCart(updatedCart);
      showToast('Instant purchase initiated! Opening checkout...', 'success');
      setCurrentView('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Error occurred during Buy Now sequence.', 'error');
    } finally {
      setCartLoadingId(null);
    }
  };

  // Wishlist operation triggers
  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please login to manage wishlist.', 'error');
      return;
    }

    try {
      const resp = await api.wishlist.toggle(productId);
      setWishlist(resp.wishlist);
      
      const isNowSaved = resp.wishlist.items.some(i => i.productId === productId);
      showToast(
        isNowSaved 
          ? 'Product saved to your wishlist!' 
          : 'Product removed from favorite list.', 
        'success'
      );
    } catch (err) {
      showToast('Error syncing favorited inventory settings.', 'error');
    }
  };

  const handleViewProductDetails = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView(productId ? 'product-details' : 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartCallback = (updatedCart: Cart) => {
    setCart(updatedCart);
  };

  const handleProceedToCheckout = (coupon?: string, discount: number = 0) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (order: Order) => {
    setCart({ items: [] } as any);
  };

  const handleSearchTrigger = (search: string, cat: string = 'All') => {
    setSearchQuery(search);
    setSelectedCategory(cat);
    setCurrentView('home');
  };

  // Extract dynamic brands list
  const brandsList = Array.from(new Set(products.map(p => p.brand))) as string[];

  // Filter products client side based on selection parameters
  const filteredProducts = products.filter(p => {
    const matchSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || selectedCategory === '' || p.category === selectedCategory;
    const matchBrand = selectedBrand === 'All' || selectedBrand === '' || p.brand === selectedBrand;
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchRating = p.rating.average >= minRating;

    return matchSearch && matchCategory && matchBrand && matchPrice && matchRating;
  });

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.rating.average - a.rating.average);
  } else if (sortBy === 'newest') {
    filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const isWishlisted = (productId: string) => {
    return wishlist?.items.some(i => i.productId === productId) || false;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col justify-between text-slate-800 dark:text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Banner Notification info */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-[10px] uppercase py-2 px-4 shadow-sm text-center flex items-center justify-center gap-1.5 leading-snug tracking-wider">
        <Sparkles size={11} className="animate-pulse" />
        GRAND PREMIERE DEALS: Unlock up to 25% Off + Express Free Shipping Threshold over $100!
      </div>

      {/* Primary Sticky Header */}
      <Navbar 
        user={user}
        cart={cart}
        wishlistCount={wishlist?.items.length || 0}
        onSearch={handleSearchTrigger}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedProductId('');
        }}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        categories={categories}
        currentCategory={selectedCategory}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          setCurrentView('home');
        }}
        darkMode={isDarkMode}
        onToggleDarkMode={handleToggleTheme}
      />

      {/* Main Container Contents Area */}
      <main className="flex-grow">
        
        {/* Dynamic State Router Screens Rendering */}

        {/* 1. HOMEPAGE VIEW */}
        {currentView === 'home' && (
          <div className="space-y-6">
            
            {/* Promo slider layout on top of marketplace only */}
            {searchQuery === '' && selectedCategory === 'All' && selectedBrand === 'All' && (
              <div className="max-w-7xl mx-auto px-4 pt-6">
                <HeroCarousel 
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setCurrentView('home');
                  }} 
                  onExplore={() => {
                    setSelectedCategory('All');
                    setCurrentView('home');
                  }} 
                />
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Product Filtering parameters Sidebar column layout */}
              <div className="lg:col-span-1">
                <FiltersSidebar 
                  categories={categories}
                  brands={brandsList}
                  selectedCategory={selectedCategory}
                  selectedBrand={selectedBrand}
                  minPrice={priceRange[0]}
                  maxPrice={priceRange[1]}
                  selectedSort={sortBy}
                  onCategoryChange={(cat) => {
                    setSelectedCategory(cat);
                    setCurrentView('home');
                  }}
                  onBrandChange={(br) => {
                    setSelectedBrand(br);
                    setCurrentView('home');
                  }}
                  onPriceChange={(min, max) => {
                    setPriceRange([min, max]);
                  }}
                  onSortChange={(sort) => {
                    setSortBy(sort);
                  }}
                  onReset={() => {
                    setSelectedCategory('All');
                    setSelectedBrand('All');
                    setPriceRange([0, 2000]);
                    setMinRating(0);
                    setSortBy('');
                    setSearchQuery('');
                  }}
                />
              </div>

              {/* Central Catalog Products Grid */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Search descriptors / tags info */}
                {(searchQuery || selectedCategory !== 'All' || selectedBrand !== 'All' || sortBy) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 px-4.5 rounded-sm border border-gray-150 dark:border-slate-705 shadow-sm text-xs font-bold leading-none">
                    <span className="text-gray-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <ListFilter size={13} className="text-[#2874F0]" />
                      Active Catalog Filters
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <span className="p-1 px-3 bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-gray-200 rounded-sm">
                          Searching: "{searchQuery}"
                        </span>
                      )}
                      {selectedCategory !== 'All' && (
                        <span className="p-1 px-3 bg-blue-55/70 dark:bg-slate-700 text-[#2874F0] dark:text-gray-200 rounded-sm capitalize">
                          Category: {selectedCategory}
                        </span>
                      )}
                      {selectedBrand !== 'All' && (
                        <span className="p-1 px-3 bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-gray-200 rounded-sm">
                          Brand: {selectedBrand}
                        </span>
                      )}
                      {sortBy && (
                        <span className="p-1 px-3 bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-gray-200 rounded-sm capitalize">
                          Sort: {sortBy.replace('_', ' ')}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedBrand('All');
                          setPriceRange([0, 2000]);
                          setMinRating(0);
                          setSortBy('');
                          setSearchQuery('');
                        }}
                        className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                )}

                {fetchingProducts ? (
                  <div className="py-24 text-center space-y-2">
                    <div className="w-9 h-9 border-2 border-[#2874F0]/20 border-t-[#2874F0] rounded-full animate-spin mx-auto" />
                    <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Loading Marketplace Catalogs...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700/60 rounded-sm max-w-lg mx-auto shadow-sm">
                    <AlertCircle className="w-14 h-14 mx-auto text-blue-200 animate-pulse mb-3" />
                    <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase">Product entries not found</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">No matching tech products align with your filter configuration. Try lowering minimum ratings, clearing parameters, or relaxing price cap thresholds.</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedBrand('All');
                        setPriceRange([0, 2000]);
                        setMinRating(0);
                        setSortBy('');
                        setSearchQuery('');
                      }}
                      className="mt-5 px-5 py-2 text-xs font-bold text-white bg-[#2874F0] hover:bg-blue-700 rounded-sm cursor-pointer"
                    >
                      Clear Store Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1 text-xs">
                      <span className="text-gray-405 uppercase font-bold tracking-wider font-mono">Displaying {filteredProducts.length} entries of tech product catalogs</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map(p => (
                        <ProductCard 
                          key={p.id}
                          product={p}
                          isWishlisted={isWishlisted(p.id)}
                          onAddToCart={(id) => { handleAddToCart(id); }}
                          onToggleWishlist={(id) => { handleToggleWishlist(id); }}
                          onViewDetails={(id) => handleViewProductDetails(id)}
                          cartLoadingId={cartLoadingId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCT DETAILED VIEW */}
        {currentView === 'product-details' && (
          <ProductDetailsView 
            productId={selectedProductId}
            isWishlisted={isWishlisted(selectedProductId)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onViewProduct={handleViewProductDetails}
            cartLoadingId={cartLoadingId}
            showToast={showToast}
            isLoggedIn={!!user}
          />
        )}

        {/* 3. CART OVERVIEW VIEW */}
        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            onUpdateCart={handleUpdateCartCallback}
            onContinueShopping={() => setCurrentView('home')}
            onProceedToCheckout={handleProceedToCheckout}
            showToast={showToast}
          />
        )}

        {/* 4. TRANSACTION CHECKOUT DISPATCH */}
        {currentView === 'checkout' && (
          <CheckoutView 
            cartItems={cart?.items || []}
            userAddresses={user?.addresses || []}
            couponCode={appliedCoupon}
            discountAmount={discountAmount}
            onOrderPlaced={handleOrderPlaced}
            onBackToCart={() => setCurrentView('cart')}
            showToast={showToast}
            onRefreshUser={(updated) => setUser(updated)}
          />
        )}

        {/* 5. WISHLIST DIRECTORY VIEW */}
        {currentView === 'wishlist' && (
          <WishlistView 
            wishlist={wishlist}
            onRemoveItem={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onContinueShopping={() => setCurrentView('home')}
            onViewProductDetails={handleViewProductDetails}
            cartLoadingId={cartLoadingId}
          />
        )}

        {/* 6. CONSUMER PROFILE SCREEN */}
        {currentView === 'profile' && user && (
          <UserProfileView 
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            showToast={showToast}
            onOpenAuth={() => setShowAuthModal(true)}
            onViewOrderDetails={(oId) => {
              // Redirect to order status inside active profile subtabs or view
              showToast(`Tracking details for order: ${oId}`, 'success');
            }}
          />
        )}

        {/* 7. ADMIN DASHBOARD CONTROL PORTAL */}
        {currentView === 'admin' && (
          <AdminDashboardView 
            showToast={showToast}
            onRefreshProductsList={fetchProducts}
            categories={categories}
          />
        )}

      </main>

      {/* Global Auto fading Floating Toast Notification alert popup box */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-55 p-3.5 px-5 border rounded-sm flex items-center gap-2.5 transition-all text-xs font-bold shadow-md ${
          toastType === 'success'
            ? 'bg-[#172337]/95 text-white border-emerald-500'
            : 'bg-red-950/95 text-red-100 border-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toastType === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {toastMessage}
        </div>
      )}

      {/* Unified User Sign-In/Register Overlay AuthModal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* Complete Footer Section */}
      <footer className="bg-[#172337] border-t border-[#232f3e] text-white font-medium py-10 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 leading-relaxed">
          {/* Brand Intro */}
          <div className="space-y-3">
            <span className="text-[#FFD814] font-bold text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <ShoppingBag size={18} />
              SuperCart Retailers
            </span>
            <p className="text-gray-300 text-[11px] leading-relaxed">Designed in the likeness of Amazon & Flipkart with persistent catalog registries, logistics timeline tracers, promo coupons, and administrator command systems.</p>
          </div>

          {/* Quick links block */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Marketplace Segments</h4>
            <ul className="space-y-1 text-gray-300 leading-loose">
              <li><button onClick={() => { setSelectedCategory('Electronics'); setCurrentView('home'); }} className="hover:text-[#FFD814] cursor-pointer text-left">Premium Electronics</button></li>
              <li><button onClick={() => { setSelectedCategory('Fashion'); setCurrentView('home'); }} className="hover:text-[#FFD814] cursor-pointer text-left">Modern Fashion Store</button></li>
              <li><button onClick={() => { setSelectedCategory('Fitness'); setCurrentView('home'); }} className="hover:text-[#FFD814] cursor-pointer text-left">Sports & Fitness Gear</button></li>
              <li><button onClick={() => { setSelectedCategory('Home & Kitchen'); setCurrentView('home'); }} className="hover:text-[#FFD814] cursor-pointer text-left">Kitchen Utilities</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Customer Support & Guarantees</h4>
            <ul className="space-y-1 text-gray-300 leading-loose">
              <li><a href="#return" className="hover:text-[#FFD814]">Easy 30-Day Returns</a></li>
              <li><a href="#courier" className="hover:text-[#FFD814]">Logistics Tracking Help</a></li>
              <li><a href="#insurance" className="hover:text-[#FFD814]">Secured Checkout Protection</a></li>
              <li><a href="#faq" className="hover:text-[#FFD814]">Merchant SLA Agreements</a></li>
            </ul>
          </div>

          {/* Seed accounts block */}
          <div className="space-y-2 text-[11px] bg-[#232f3e]/80 p-4 border border-[#232f3e] rounded-sm leading-normal">
            <h4 className="uppercase font-bold text-[#FFD814] text-[10px] tracking-wider mb-1">🔐 Demonstration Seed Logins</h4>
            <p className="text-gray-300">For instant previewing, sign-in with our seeded user and admin accounts:</p>
            <div className="font-mono mt-2 text-[10px] space-y-1 text-gray-200">
              <p><strong>Admin Email:</strong> admin@gmail.com<br /><strong>Password:</strong> admin123</p>
              <p className="border-t border-[#172337] pt-1.5"><strong>User Email:</strong> ramasridevi17@gmail.com<br /><strong>Password:</strong> user123</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-[#232f3e] text-center text-gray-400 text-[10px] font-semibold uppercase">
          © {new Date().getFullYear()} SuperCart. Built with precision for premium full-stack shopping. All Rights Reserved.
        </div>
      </footer>

    </div>
  );
}
