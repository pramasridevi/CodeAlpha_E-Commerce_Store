import React from 'react';
import { Star, Heart, ShoppingCart, Eye, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (pId: string) => void;
  onAddToCart: (pId: string) => void;
  onViewDetails: (pId: string) => void;
  cartLoadingId: string | null;
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onViewDetails,
  cartLoadingId
}: ProductCardProps) {
  // Mock discount price representation - typical for Amazon/Flipkart styling!
  const originalPrice = Math.round(product.price * 1.25);
  const discountPercent = 20; // flat beautiful retail percentage

  const isLowStock = product.stock > 0 && product.stock <= 15;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-800 rounded-sm border border-gray-150 dark:border-slate-700/60 p-4 shadow-sm hover:shadow-md hover:border-[#2874F0]/40 transition-all duration-300">
      {/* Absolute Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 items-start">
        {product.isBestSeller && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white rounded-sm shadow-xs">
            Bestseller
          </span>
        )}
        {product.isFeatured && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#2874F0] text-white rounded-sm shadow-xs">
            Featured
          </span>
        )}
      </div>

      {/* Toggling Wishlist Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full border border-gray-150/50 dark:border-slate-705 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart size={15} className={`transition-transform duration-200 ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
      </button>

      {/* Product Image Area */}
      <div 
        onClick={() => onViewDetails(product.id)}
        className="relative h-44 w-full bg-gray-50 dark:bg-slate-900/40 rounded-sm overflow-hidden cursor-pointer flex items-center justify-center p-2"
      >
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full max-h-36 object-contain group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover quick look layer */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-2 bg-white text-slate-800 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform">
            <Eye size={15} />
          </div>
        </div>
      </div>

      {/* Info elements */}
      <div className="mt-3 flex-1 flex flex-col">
        {/* Brand */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
          {product.brand}
        </span>
        
        {/* Title */}
        <h3 
          onClick={() => onViewDetails(product.id)}
          className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer group-hover:text-[#2874F0] dark:group-hover:text-blue-400 line-clamp-1 h-5 transition-colors"
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Ratings details (Flipkart Style badge for high polish) */}
        <div className="mt-2 flex items-center gap-2">
          <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-0.5">
            {product.rating.average.toFixed(1)} ★
          </span>
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-400">
            ({product.rating.count.toLocaleString()})
          </span>
        </div>

        {/* Price grid resembling Flipkart styling */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            ${product.price.toLocaleString()}
          </span>
          <span className="text-xs text-gray-450 line-through">
            ${originalPrice.toLocaleString()}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-bold italic">
            {discountPercent}% Off
          </span>
        </div>

        {/* Inventory status helper */}
        <div className="mt-2 text-[10px] font-semibold">
          {isOutOfStock ? (
            <span className="text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-sm">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-orange-500 animate-pulse bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-sm">
              Few Left
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/25 px-1.5 py-0.5 rounded-sm italic">
              Top Rated
            </span>
          )}
        </div>
      </div>

      {/* Purchase button action */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-700/50 flex gap-2">
        <button
          onClick={() => onViewDetails(product.id)}
          className="flex-1 py-1.5 bg-gray-50 dark:bg-slate-700/50 hover:bg-[#2874F0] hover:text-white text-slate-700 dark:text-gray-300 rounded-sm text-xs font-bold transition-all cursor-pointer flex justify-center items-center gap-1 active:scale-97 border border-gray-200 dark:border-slate-600 hover:border-[#2874F0]"
        >
          Details
          <ArrowUpRight size={12} />
        </button>

        <button
          onClick={() => onAddToCart(product.id)}
          disabled={isOutOfStock || cartLoadingId === product.id}
          className={`flex-2 py-1.5 rounded-sm text-xs font-bold tracking-wide transition-all uppercase flex justify-center items-center gap-1 cursor-pointer active:scale-97 ${
            isOutOfStock
              ? 'bg-gray-150 dark:bg-slate-800 text-gray-400 pointer-events-none'
              : 'bg-[#FFD814] hover:bg-[#ffe042] text-[#232f3e] shadow-xs'
          }`}
        >
          {cartLoadingId === product.id ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingCart size={13} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
