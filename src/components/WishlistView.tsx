import { Heart, ShoppingCart, Trash2, ArrowLeft, Package, Sparkles } from 'lucide-react';
import { Wishlist, WishlistItem } from '../types';

interface WishlistViewProps {
  wishlist: Wishlist | null;
  onRemoveItem: (pId: string) => void;
  onAddToCart: (pId: string) => void;
  onContinueShopping: () => void;
  onViewProductDetails: (pId: string) => void;
  cartLoadingId: string | null;
}

export default function WishlistView({
  wishlist,
  onRemoveItem,
  onAddToCart,
  onContinueShopping,
  onViewProductDetails,
  cartLoadingId
}: WishlistViewProps) {
  const items = wishlist?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mb-8 border-b border-gray-105 dark:border-slate-800 pb-3">
        <Heart className="text-red-500 fill-red-500 w-6 h-6 md:w-7 md:h-7" />
        My Wishlist Inventory
      </h1>

      {items.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-800 rounded-3xl border border-gray-150 dark:border-slate-700/60 max-w-2xl mx-auto text-center py-16 shadow-lg">
          <Heart className="w-16 h-16 mx-auto text-red-200 animate-pulse mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Your wishlist is completely dry</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-2">Save details of products you are looking to purchase later! Build your personalized list of favorites in electronics, clothing, books, and fitness gadgets.</p>
          <button
            onClick={onContinueShopping}
            className="mt-6 inline-flex justify-center items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:brightness-105 shadow-md shadow-orange-500/10 active:scale-97 transition-colors"
          >
            <ArrowLeft size={14} />
            Explore Marketplace Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wishlists grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const originalPrice = Math.round(item.price * 1.25);
              const isOutOfStock = item.stock === 0;

              return (
                <div 
                  key={item.productId}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-705 p-3 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-300 relative group"
                >
                  {/* Remove absolute button */}
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 border border-gray-150 dark:border-slate-700 rounded-full transition-colors cursor-pointer z-10 shadow-xs"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div 
                    onClick={() => onViewProductDetails(item.productId)} 
                    className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50/50 cursor-pointer"
                  >
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  </div>

                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1 text-xs">
                      <span className="text-[9px] font-mono font-black uppercase text-orange-600 dark:text-orange-400">{item.brand}</span>
                      <h3 
                        onClick={() => onViewProductDetails(item.productId)}
                        className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 hover:underline cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-gray-550 dark:text-gray-400 font-semibold uppercase">{item.category}</p>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-1.5 pt-1 font-bold">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">${item.price}</span>
                        <span className="text-[10px] text-gray-400 line-through font-normal">${originalPrice}</span>
                      </div>

                      {/* Stock indication */}
                      <p className="text-[10px] font-semibold mt-1">
                        {isOutOfStock ? (
                          <span className="text-red-500">Out of Stock</span>
                        ) : (
                          <span className="text-teal-600 dark:text-teal-400">Available: {item.stock} in stock</span>
                        )}
                      </p>
                    </div>

                    {/* Actions button strip */}
                    <div className="mt-4 pt-2.5 border-t border-gray-105 dark:border-slate-705 flex gap-1.5 font-bold">
                      <button
                        onClick={() => onViewProductDetails(item.productId)}
                        className="flex-1 py-1 px-2.5 bg-gray-100 hover:bg-gray-150 dark:bg-slate-705 text-slate-750 dark:text-gray-300 rounded-xl text-[10px] cursor-pointer text-center"
                      >
                        Explore
                      </button>

                      <button
                        onClick={() => onAddToCart(item.productId)}
                        disabled={isOutOfStock || cartLoadingId === item.productId}
                        className={`flex-2 py-1 px-3 rounded-xl text-[10px] tracking-wide uppercase flex justify-center items-center gap-1 cursor-pointer active:scale-97 ${
                          isOutOfStock
                            ? 'bg-gray-150 dark:bg-slate-800 text-gray-400 pointer-events-none'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'
                        }`}
                      >
                        {cartLoadingId === item.productId ? (
                          <div className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-905 rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart size={11} />
                            To Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 dark:bg-amber-955/10 p-3.5 rounded-2xl border border-amber-100 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
            <Sparkles size={14} className="text-amber-505 shrink-0" />
            Add saved wishlist items directly to your shopping cart with one click! We will update and synchronize totals instantly.
          </div>
        </div>
      )}
    </div>
  );
}
