import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Ticket, Percent, Plus, Minus, Info, ShieldCheck } from 'lucide-react';
import { Cart, CartItem } from '../types';
import { api } from '../lib/api';

interface CartViewProps {
  cart: Cart | null;
  onUpdateCart: (cart: Cart) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: (appliedCouponCode?: string, discountAmount?: number) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function CartView({
  cart,
  onUpdateCart,
  onContinueShopping,
  onProceedToCheckout,
  showToast
}: CartViewProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Auto Shipping Calculation (FREE above $100)
  const shippingFee = subtotal > 100 || subtotal === 0 ? 0 : 5.99;
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  
  const discountAmount = appliedCoupon ? Math.round(appliedCoupon.discountAmount * 100) / 100 : 0;
  const finalTotal = Math.max(0, Math.round((subtotal + shippingFee + estimatedTax - discountAmount) * 100) / 100);

  const handleUpdateQty = async (productId: string, currentQty: number, change: number) => {
    const targetQty = currentQty + change;
    setLoadingItemId(productId);
    
    try {
      if (targetQty <= 0) {
        const response = await api.cart.remove(productId);
        onUpdateCart(response);
        showToast('Product successfully removed from cart.', 'success');
      } else {
        const response = await api.cart.update(productId, targetQty);
        onUpdateCart(response);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating product quantities.', 'error');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setLoadingItemId(productId);
    try {
      const response = await api.cart.remove(productId);
      onUpdateCart(response);
      showToast('Product successfully removed from cart.', 'success');
    } catch (err: any) {
      showToast('Error removing product from cart.', 'error');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const result = await api.cart.applyCoupon(couponCode, subtotal);
      if (result.valid) {
        setAppliedCoupon(result);
        showToast(`Promo applied: "${result.code}". ${result.description}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid promotion code.', 'error');
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Promo code deactivated.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mb-8 border-b border-gray-100 dark:border-slate-800 pb-3">
        <ShoppingCart className="text-orange-500 w-6 h-6 md:w-7 md:h-7" />
        Shopping Cart Setup
      </h1>

      {cartItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-10 text-center shadow-lg max-w-2xl mx-auto py-16">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Your shopping cart is completely empty</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">Do not miss out on amazing deals on hot tech items! Explore categories, browse specifications, and find the perfect products.</p>
          <button
            onClick={onContinueShopping}
            className="mt-6 inline-flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-xs hover:brightness-105 transition-colors cursor-pointer active:scale-97 shadow-lg shadow-orange-500/10"
          >
            <ArrowLeft size={14} />
            Explore Marketplace Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart item listing table area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-4 shadow-xs">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Cart Items ({cartItems.length})</h2>
              
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {cartItems.map((item) => (
                  <div key={item.productId} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Item spec summary */}
                    <div className="flex gap-4 items-center">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-slate-700/60 bg-gray-50/50"
                        referrerPolicy="referrer"
                      />
                      <div>
                        {/* Brand spec */}
                        <span className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 font-mono tracking-wider">{item.brand}</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 hover:underline cursor-pointer">{item.title}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">{item.category}</p>
                        
                        {/* Dynamic price per unit */}
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-1">
                          ${item.price} <span className="text-[10px] text-gray-400 font-medium font-sans">each</span>
                        </span>
                      </div>
                    </div>

                    {/* Steppers & Quantity Adjuster controls */}
                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t border-gray-50 sm:border-0 pt-3 sm:pt-0">
                      <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-750">
                        {/* Decrement qty */}
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.quantity, -1)}
                          disabled={loadingItemId === item.productId}
                          className="p-1 px-2 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs font-black cursor-pointer transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        
                        <span className="text-xs font-black text-slate-900 dark:text-white w-6 text-center select-none">
                          {item.quantity}
                        </span>

                        {/* Increment qty */}
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.quantity, 1)}
                          disabled={loadingItemId === item.productId || item.quantity >= item.stock}
                          className="p-1 px-2 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs font-black cursor-pointer transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Calculated sum of element */}
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white min-w-16 text-right">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>

                        {/* Delete single button */}
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopping confidence list */}
            <div className="bg-amber-50 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-950/20 flex gap-3 text-xs text-amber-805 leading-normal">
              <Info className="text-amber-500 w-5 h-5 shrink-0" />
              <div>
                <strong>Free Home Shipping Threshold:</strong> Spend over <strong>$100</strong> globally in E-Commerce SuperCart to unlock complimentary dry courier shipping services instantly! Your package is protected with premium courier tracking insurance.
              </div>
            </div>
            
            <button
              onClick={onContinueShopping}
              className="py-1 px-3 text-xs font-bold text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1 cursor-pointer hover:underline"
            >
              <ArrowLeft size={12} />
              Continue Scrolling Catalogs
            </button>
          </div>

          {/* Pricing Totals Card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Order Summary</h3>

              {/* Subtotal, tax, shipping breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-655 dark:text-gray-300">
                  <span>Cart Subtotal</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">${subtotal.toLocaleString()}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between font-extrabold text-teal-605">
                    <span className="flex items-center gap-0.5">
                      <Percent size={11} />
                      Discount ({appliedCoupon.code})
                    </span>
                    <span>-${discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-slate-655 dark:text-gray-300">
                  <span>Shipping & Handling</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {shippingFee === 0 ? <span className="text-teal-650">FREE</span> : `$${shippingFee}`}
                  </span>
                </div>

                <div className="flex justify-between font-semibold text-slate-655 dark:text-gray-300">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-bold text-slate-900 dark:text-white">${estimatedTax}</span>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-base font-black text-orange-600 dark:text-orange-400">${finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Apply Promo Coupon Box */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                {appliedCoupon ? (
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-150 rounded-xl flex items-center justify-between text-xs text-teal-800 dark:text-teal-400">
                    <div>
                      <p className="font-extrabold">Active Promo: {appliedCoupon.code}</p>
                      <p className="text-[10px] font-medium leading-tight mt-0.5">{appliedCoupon.description}</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 font-extrabold hover:underline text-[10px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <Ticket size={13} />
                      </span>
                      <input
                        type="text"
                        placeholder="WELCOME10, SUPERDEAL"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-705 dark:hover:bg-slate-600 rounded-xl text-xs font-bold cursor-pointer active:scale-97 disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </form>
                )}
                <span className="block mt-1.5 text-[9px] text-gray-400 font-semibold tracking-wide">💡 Seeding coupons: <strong>WELCOME10</strong> (10% off), <strong>SUPERDEAL</strong> ($25 off)</span>
              </div>

              {/* Place Order / Process Checkout CTA */}
              <button
                onClick={() => onProceedToCheckout(appliedCoupon?.code, discountAmount)}
                className="w-full flex justify-center items-center gap-1.5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-orange-500/10 transition-all cursor-pointer uppercase active:scale-98"
              >
                Proceed To Checkout
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Verifiably safe secure payment badge */}
            <div className="p-3 bg-gray-50 dark:bg-slate-900/40 rounded-2xl text-center text-[10px] text-gray-450 font-semibold flex items-center justify-center gap-1.5 border border-gray-150/50">
              <ShieldCheck className="text-teal-600 inline" size={13} />
              Secured Checkout & SSL Encrypted Connection
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
