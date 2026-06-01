import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { api } from '../lib/api';
import { Star, Heart, ShoppingCart, ShieldCheck, Truck, RotateCcw, PenTool, ClipboardList, Package, ArrowUpRight, Zap } from 'lucide-react';

interface ProductDetailsProps {
  productId: string;
  isWishlisted: boolean;
  onToggleWishlist: (pId: string) => void;
  onAddToCart: (pId: string) => void;
  onBuyNow?: (pId: string) => void;
  onViewProduct: (pId: string) => void;
  cartLoadingId: string | null;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isLoggedIn: boolean;
}

export default function ProductDetailsView({
  productId,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onViewProduct,
  cartLoadingId,
  showToast,
  isLoggedIn
}: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery slider
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await api.products.getById(productId);
      setProduct(response.product);
      setRelatedProducts(response.related || []);
      setSelectedImageIdx(0);
    } catch (e) {
      showToast('Error loading product profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmittingReview(true);
    try {
      const response = await api.products.submitReview(product.id, userRating, userComment);
      setProduct(response.product); // refresh core ratings & reviews list
      setUserComment('');
      showToast('Review submitted successfully! Thank you.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error submitting review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2">
        <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Syncing details & reviews...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center text-gray-500 container">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-bold text-slate-805">Product profiles not found</h3>
        <p className="text-xs text-gray-400">The product you are trying to review could not be retrieved from the catalog.</p>
      </div>
    );
  }

  const originalPrice = Math.round(product.price * 1.25);
  const discountAmount = originalPrice - product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category Route breadcrumbs */}
      <div className="text-xs font-semibold text-gray-400 mb-6 flex items-center gap-1">
        <span className="hover:underline cursor-pointer" onClick={() => onViewProduct('')}>Store</span>
        <span>/</span>
        <span className="hover:underline cursor-pointer" onClick={() => onViewProduct('')}>{product.category}</span>
        <span>/</span>
        <span className="text-slate-700 dark:text-gray-300 truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main product presentation grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-12">
        {/* Left: Gallery selection */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-700/60 rounded-2xl overflow-hidden p-6 flex justify-center items-center">
            <img 
              src={product.images[selectedImageIdx]} 
              alt={product.title} 
              className="max-h-full max-w-full object-contain rounded-xl hover:scale-110 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 rounded-lg bg-gray-50 dark:bg-slate-900 p-1 border object-cover overflow-hidden transition-all cursor-pointer ${
                    selectedImageIdx === idx 
                      ? 'border-orange-500 ring-2 ring-orange-500/10' 
                      : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Technical Information Summary */}
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-400 font-mono">
              ★ {product.brand} BRAND ORIGINAL
            </span>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            
            {/* Rating Stars overview */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={13} 
                    className={i < Math.floor(product.rating.average) ? 'fill-amber-400' : 'text-gray-200'} 
                  />
                ))}
              </div>
              <span className="bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded">
                {product.rating.average.toFixed(1)} Rating
              </span>
              <span className="text-xs text-gray-400 font-semibold">• {product.rating.count} Customer reviews</span>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-slate-705" />

          {/* Pricing grid */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ${product.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice.toLocaleString()}
              </span>
              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">
                Flat 20% OFF Clearance Deal
              </span>
            </div>
            <p className="text-[11px] text-gray-400">You save flat <strong className="text-teal-605 font-extrabold">${discountAmount.toLocaleString()}</strong> instantly at secure checkout.</p>
          </div>

          {/* Stock state */}
          <div className="flex gap-2.5 items-center pt-1">
            {product.stock === 0 ? (
              <span className="text-xs font-bold text-white bg-red-650 px-3 py-1 rounded-sm uppercase tracking-wide">
                Out of Stock
              </span>
            ) : product.stock <= 15 ? (
              <span className="text-xs font-bold text-white bg-orange-600 px-3 py-1 rounded-sm uppercase tracking-wide animate-pulse">
                Low Stock: Only {product.stock} units left!
              </span>
            ) : (
              <span className="text-xs font-bold text-white bg-emerald-600 px-3 py-1 rounded-sm uppercase tracking-wide">
                In Stock: {product.stock} remaining
              </span>
            )}
          </div>

          {/* Direct Buy Now / Add to Cart Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock === 0 || cartLoadingId === product.id}
              className={`flex-1 py-3 px-4 rounded-sm font-bold text-xs uppercase tracking-wider transition-all flex justify-center items-center gap-1.5 cursor-pointer shadow-xs border ${
                product.stock === 0
                  ? 'bg-gray-150 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 pointer-events-none'
                  : 'bg-[#FFD814] hover:bg-[#ffe042] text-[#232f3e] border-[#FCD200]'
              }`}
            >
              {cartLoadingId === product.id ? (
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Add to Cart
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (onBuyNow) {
                  onBuyNow(product.id);
                } else {
                  onAddToCart(product.id);
                }
              }}
              disabled={product.stock === 0 || cartLoadingId === product.id}
              className={`flex-1 py-3 px-4 rounded-sm font-bold text-xs uppercase tracking-wider transition-all flex justify-center items-center gap-1.5 cursor-pointer shadow-xs ${
                product.stock === 0
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 pointer-events-none'
                  : 'bg-[#FB641B] hover:bg-[#f2560c] text-white font-extrabold'
              }`}
            >
              <Zap size={14} className="fill-current text-white" />
              Buy Now
            </button>

            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`px-4.5 py-3 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                isWishlisted 
                  ? 'border-red-500 text-red-500 bg-red-50/10' 
                  : 'border-gray-250 hover:border-gray-300 text-slate-400 hover:text-red-500 bg-gray-55 dark:bg-slate-800'
              }`}
            >
              <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500 scale-105' : ''} />
            </button>
          </div>

          {/* Flipkart / Amazon Trust icons footer inside Fold */}
          <div className="grid grid-cols-3 gap-2 py-3 bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800/60 rounded-sm text-[10px] text-gray-500 text-center font-bold">
            <div className="space-y-1 border-r border-gray-150 last:border-0 dark:border-slate-800 flex flex-col justify-center items-center">
              <Truck size={13} className="text-slate-600 dark:text-gray-300" />
              <span>Free Delivery</span>
            </div>
            <div className="space-y-1 border-r border-gray-150 last:border-0 dark:border-slate-800 flex flex-col justify-center items-center">
              <RotateCcw size={13} className="text-slate-650 dark:text-gray-300" />
              <span>30-Day Return</span>
            </div>
            <div className="space-y-1 flex flex-col justify-center items-center">
              <ShieldCheck size={13} className="text-slate-655 dark:text-gray-305" />
              <span>Secure Transaction</span>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-slate-705" />

          {/* Description */}
          <div className="space-y-1 text-xs">
            <span className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Product Description</span>
            <p className="text-slate-650 dark:text-gray-350 font-normal leading-relaxed">{product.description}</p>
          </div>

          {/* Specifications table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <ClipboardList size={13} className="text-[#2874F0]" />
                Technical Specifications
              </span>
              <div className="border border-gray-150 dark:border-slate-700/60 rounded-sm overflow-hidden bg-slate-50/20">
                <table className="w-full text-xs text-left">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-slate-705 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-755 transition-colors">
                        <td className="p-2 px-3 font-bold text-gray-550 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-slate-900/50">{key}</td>
                        <td className="p-2 px-3 font-semibold text-slate-800 dark:text-gray-300">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-100 dark:border-slate-705 my-8" />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 mb-12">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-750 pb-2">
            <Package size={16} className="text-orange-500" />
            Related Products Suggested
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => {
              const op = Math.round(p.price * 1.25);
              return (
                <div 
                  key={p.id}
                  onClick={() => onViewProduct(p.id)}
                  className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-705 rounded-xl p-2.5 cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <img src={p.images[0]} alt={p.title} className="w-full aspect-square object-contain rounded-lg bg-gray-50" referrerPolicy="no-referrer" />
                  <div className="mt-2 text-xs font-semibold uppercase leading-tight">
                    <span className="text-[9px] font-mono font-black text-orange-600 tracking-wider inline">{p.brand}</span>
                    <h3 className="text-[11px] font-bold line-clamp-1 text-slate-800 dark:text-white mt-0.5">{p.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white">${p.price}</span>
                      <span className="text-[9px] text-gray-400 line-through">${op}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews and Ratings Center Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Ratings distribution graph */}
        <div className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-755 p-5 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">Ratings Summary</h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{product.rating.average.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < Math.floor(product.rating.average) ? 'fill-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">{product.rating.count} ratings and metrics</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-705 text-[11px] text-gray-405 leading-relaxed font-semibold">
            📜 <strong>Verifiably Sourced Customer Reviews:</strong> All listed reviews are formulated from verifiably authenticated customer purchases in E-Commerce SuperCart. Submit your rating by filling out the review form!
          </div>
        </div>

        {/* Right: Submission form and comments feed list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit form */}
          <div className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-755 p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-1.5">
              <PenTool size={13} className="text-orange-500" />
              Write Product Review
            </h3>

            {isLoggedIn ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Set Star Rating:</span>
                  <div className="flex gap-1 text-slate-300">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setUserRating(stars)}
                        className="hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star 
                          size={18} 
                          className={`cursor-pointer transition-all ${userRating >= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Write Comments</label>
                  <textarea
                    required
                    rows={3}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Describe your user experience in detail..."
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-705 text-slate-805 dark:text-white rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-700 text-yellow-400 rounded-xl text-xs font-bold cursor-pointer transition-all py-2 active:scale-97 disabled:opacity-40"
                  >
                    {submittingReview ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Publish Review'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-955/10 rounded-xl border border-amber-100 text-xs text-center font-bold text-amber-800 dark:text-amber-300">
                ⚠️ Please login to publish reviews and submit rating comments for this product profile.
              </div>
            )}
          </div>

          {/* Comments Feed List */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Comments Feed ({product.reviews?.length || 0})</h3>
            
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-3.5">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-755 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                      <div className="flex gap-2 items-center">
                        <span className="font-extrabold text-slate-805 dark:text-white">{rev.userName}</span>
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className={i < rev.rating ? 'fill-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-normal">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-655 dark:text-gray-300 font-light font-sans">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl text-xs text-center text-gray-400 font-semibold uppercase tracking-wider">
                No reviews recorded yet. Write the first review!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
