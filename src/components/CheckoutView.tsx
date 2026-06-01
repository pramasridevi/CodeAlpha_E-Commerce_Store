import React, { useState } from 'react';
import { Address, CartItem, Order } from '../types';
import { api } from '../lib/api';
import { ShieldCheck, MapPin, CreditCard, ChevronRight, Activity, Calendar, User, Mail, Sparkles, CheckCircle, Package, ArrowLeft, RefreshCw } from 'lucide-react';

interface CheckoutViewProps {
  cartItems: CartItem[];
  userAddresses: Address[];
  couponCode?: string;
  discountAmount?: number;
  onOrderPlaced: (order: Order) => void;
  onBackToCart: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefreshUser: (updatedUser: any) => void;
}

export default function CheckoutView({
  cartItems,
  userAddresses,
  couponCode,
  discountAmount = 0,
  onOrderPlaced,
  onBackToCart,
  showToast,
  onRefreshUser
}: CheckoutViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number>(
    userAddresses.findIndex(a => a.isDefault) !== -1 ? userAddresses.findIndex(a => a.isDefault) : 0
  );

  // Address entry state if not picking presets
  const [useNewAddress, setUseNewAddress] = useState(userAddresses.length === 0);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [savingAddressChecked, setSavingAddressChecked] = useState(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<Order | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 100 ? 0 : 5.99;
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal + shippingFee + estimatedTax - discountAmount) * 100) / 100);

  const handleNextStepFromAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useNewAddress) {
      if (!fullName || !phone || !street || !city || !state || !zipCode) {
        showToast('Please print all asterisk fields.', 'error');
        return;
      }
      
      if (savingAddressChecked) {
        setPlacingOrder(true);
        try {
          const response = await api.auth.addAddress({
            fullName,
            phone,
            street,
            city,
            state,
            zipCode,
            country,
            isDefault: userAddresses.length === 0
          });
          onRefreshUser(response.user);
          setSelectedAddressIdx(response.user.addresses.length - 1);
          setUseNewAddress(false);
          showToast('Address saved successfully!', 'success');
        } catch (err) {
          showToast('Failed to save address info.', 'error');
        } finally {
          setPlacingOrder(false);
        }
      }
    } else {
      if (selectedAddressIdx < 0 || selectedAddressIdx >= userAddresses.length) {
        showToast('Please select shipping destination preset.', 'error');
        return;
      }
    }
    setStep(2);
  };

  const handleNextStepFromPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        showToast('Please print your core card numbers.', 'error');
        return;
      }
    }
    setStep(3);
  };

  const handlePlaceOrderSubmit = async () => {
    setPlacingOrder(true);
    let finalAddress: Address;

    if (useNewAddress) {
      finalAddress = { fullName, phone, street, city, state, zipCode, country };
    } else {
      finalAddress = userAddresses[selectedAddressIdx];
    }

    try {
      const resp = await api.orders.place({
        products: cartItems.map(item => ({
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress: finalAddress,
        totalAmount: grandTotal,
        discountAmount,
        couponCode,
        paymentMethod: paymentMethod === 'card' ? 'Secure Card Checkout' : paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Net Banking Express'
      });

      setPlacedOrderDetails(resp.order);
      onOrderPlaced(resp.order);
      showToast('Order successfully generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving order details.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // SUCCESS PAGE RENDER
  if (placedOrderDetails) {
    const address = placedOrderDetails.shippingAddress;
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-150 dark:border-slate-700/60 p-6 md:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md">
            <CheckCircle size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Placed Successfully!</h1>
            <p className="text-xs text-gray-400 font-medium">Thank you for your purchase. Your transaction has processed safely.</p>
            <div className="inline-block p-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 mt-2">
              <span className="text-[10px] text-gray-400 font-medium mr-1.5 uppercase tracking-wider">Tracking Reference</span>
              <code className="text-xs font-mono font-black text-orange-600 dark:text-orange-400">{placedOrderDetails.id}</code>
            </div>
          </div>

          {/* Email confirmation layout panel */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 text-left shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full filter blur-2xl" />
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 text-xs text-yellow-400 font-bold">
              <Mail size={14} />
              EMAIL CONFIRMATION RECEIPT (SENT)
              <span className="ml-auto bg-yellow-400 text-[9px] font-black uppercase text-slate-950 px-2 py-0.5 rounded-full">
                Delivered
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <p className="font-semibold">To: <span className="text-gray-300 font-light">ramasridevi17@gmail.com</span></p>
              <p className="font-semibold">Subject: <span className="text-gray-300 font-light">✓ Order confirmed! Welcome to SuperCart - ID: {placedOrderDetails.id}</span></p>
              
              <div className="pt-2 border-t border-white/5 space-y-2">
                <p className="text-gray-300 font-light">Hi customer, your order has been received! Our logistics team will process it shortly. Below are your shipping details:</p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 text-[10px] font-mono leading-tight">
                  <strong>SHIPPING TO:</strong> {address.fullName}<br />
                  <strong>PHONE:</strong> {address.phone}<br />
                  <strong>ADDRESS:</strong> {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}<br />
                  <strong>METHOD:</strong> {placedOrderDetails.paymentMethod}
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span>GRAND TOTAL CHARGED</span>
                  <span className="text-yellow-400">${placedOrderDetails.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <button
              onClick={() => onOrderPlaced(placedOrderDetails)} // this re-binds view profile to inspect tracking steps
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-extrabold cursor-pointer hover:brightness-105 active:scale-97 flex items-center gap-1.5 shadow-md shadow-orange-500/10 justify-center"
            >
              <Activity size={14} />
              Track Delivery Timeline
            </button>
            <button
              onClick={onBackToCart} // redirect shopping
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-colors justify-center flex items-center gap-1.5"
            >
              <Package size={14} />
              Continue Shopping Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Upper steps navigation headers */}
      <div className="mb-8 max-w-xl mx-auto flex items-center justify-between text-xs text-center font-bold">
        <div className={`flex flex-col items-center gap-1.5 cursor-pointer`} onClick={() => step > 1 && setStep(1)}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
            step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>1</span>
          <span className={step >= 1 ? 'text-slate-900 dark:text-white' : 'text-gray-400'}>Shipping Address</span>
        </div>
        <ChevronRight className="text-gray-300" size={16} />
        
        <div className={`flex flex-col items-center gap-1.5 cursor-pointer`} onClick={() => step > 2 && setStep(2)}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
            step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>2</span>
          <span className={step >= 2 ? 'text-slate-900 dark:text-white' : 'text-gray-400'}>Billing & Payment</span>
        </div>
        <ChevronRight className="text-gray-300" size={16} />

        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
            step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>3</span>
          <span className={step >= 3 ? 'text-slate-900 dark:text-white' : 'text-gray-400'}>Order Summary</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Core Steps Details Content */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <MapPin className="text-orange-500" size={18} />
                Select Shipping Address
              </h2>

              {!useNewAddress && userAddresses.length > 0 ? (
                <form onSubmit={handleNextStepFromAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAddressIdx(idx)}
                        className={`p-4 border rounded-xl cursor-pointer relative flex items-start gap-3 transition-all ${
                          selectedAddressIdx === idx
                            ? 'border-orange-500 bg-orange-50/10'
                            : 'border-gray-150 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressIdx === idx}
                          onChange={() => setSelectedAddressIdx(idx)}
                          className="mt-1 accent-orange-600"
                        />
                        <div className="text-xs">
                          <h3 className="font-extrabold text-slate-900 dark:text-white">{addr.fullName}</h3>
                          <p className="text-slate-600 dark:text-gray-300 font-light mt-0.5">{addr.street}</p>
                          <p className="text-slate-600 dark:text-gray-300 font-light">{addr.city}, {addr.state} {addr.zipCode}</p>
                          <p className="text-slate-700 dark:text-gray-400 font-semibold mt-1">{addr.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-705 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      + Add New Delivery Address
                    </button>
                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-950 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 active:scale-97"
                    >
                      Next: Payment
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleNextStepFromAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555-0155"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-805 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="123 Main St, Apt 4"
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-805 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-semibold">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Berkeley"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ZIP *</label>
                      <input
                        type="text"
                        required
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="94704"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Country *</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="USA"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="saveDetailsCheck"
                      checked={savingAddressChecked}
                      onChange={(e) => setSavingAddressChecked(e.target.checked)}
                      className="rounded border-gray-200 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="saveDetailsCheck" className="text-xs font-semibold text-slate-750 dark:text-gray-300">
                      Save address info inside my primary user profile address book
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    {userAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseNewAddress(false)}
                        className="text-xs font-bold text-slate-600 dark:text-gray-300 hover:underline cursor-pointer"
                      >
                        Cancel & Use Address Presets
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-950 text-white rounded-xl text-xs font-bold ml-auto cursor-pointer flex items-center gap-1 active:scale-97"
                    >
                      {placingOrder ? (
                        <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Next: Payment Option'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <CreditCard className="text-orange-500" size={18} />
                Select Billing Method
              </h2>

              <form onSubmit={handleNextStepFromPayment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Credit card */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 text-xs font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'border-orange-500 bg-orange-50/10 text-orange-600 dark:text-orange-400 font-extrabold'
                        : 'border-gray-150 dark:border-slate-700 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <CreditCard className="mx-auto" size={20} />
                    <span>Credit / Debit Card</span>
                  </div>

                  {/* Cash On Delivery */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 text-xs font-bold transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50/10 text-orange-600 dark:text-orange-400 font-extrabold'
                        : 'border-gray-150 dark:border-slate-700 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <Package className="mx-auto" size={20} />
                    <span>Cash on Delivery (COD)</span>
                  </div>

                  {/* Net Banking */}
                  <div
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 text-xs font-bold transition-all ${
                      paymentMethod === 'netbanking'
                        ? 'border-orange-500 bg-orange-50/10 text-orange-600 dark:text-orange-400 font-extrabold'
                        : 'border-gray-150 dark:border-slate-700 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <RefreshCw className="mx-auto" size={20} />
                    <span>Net Banking Express</span>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750/80 rounded-2xl space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">Secure Credit Card Input</h3>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Card Number *</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-850 dark:text-white rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date *</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-805 dark:text-white rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CVV Security Code *</label>
                        <input
                          type="password"
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          maxLength={3}
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-805 dark:text-white rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/10 border border-teal-150 rounded-2xl text-xs leading-normal text-teal-800 dark:text-teal-400 font-medium">
                    📍 <strong>COD Option Select:</strong> You can pay directly to our courier executive in cash or local UPI code scanning at the moment of physical bundle delivery. Flat $0.00 COD charges apply!
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-700 rounded-2xl text-xs leading-normal text-slate-750 dark:text-gray-350">
                    🏦 Select your bank from the secure redirected gateway on the next summary screen to initiate express wire clearance.
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-gray-330 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-300"
                  >
                    Back to Addresses
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-950 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 active:scale-97"
                  >
                    Next: Order Summary
                    <ChevronRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs space-y-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700/65 flex items-center gap-1">
                <ShieldCheck size={18} className="text-orange-500" />
                Comprehensive Review & Final Order Dispatch
              </h2>

              {/* Grid representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-loose font-medium">
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-150/60 dark:border-slate-750">
                  <h3 className="font-extrabold text-slate-805 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                    <MapPin size={13} className="text-orange-500" />
                    Shipping Destination
                  </h3>
                  {useNewAddress ? (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{fullName}</p>
                      <p className="text-slate-600 dark:text-gray-300 font-light">{street}</p>
                      <p className="text-slate-600 dark:text-gray-300 font-light">{city}, {state} {zipCode}</p>
                      <p className="text-slate-700 dark:text-gray-400 font-semibold">{phone}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{userAddresses[selectedAddressIdx]?.fullName}</p>
                      <p className="text-slate-600 dark:text-gray-300 font-light">{userAddresses[selectedAddressIdx]?.street}</p>
                      <p className="text-slate-600 dark:text-gray-300 font-light">{userAddresses[selectedAddressIdx]?.city}, {userAddresses[selectedAddressIdx]?.state} {userAddresses[selectedAddressIdx]?.zipCode}</p>
                      <p className="text-slate-750 dark:text-gray-400 font-semibold">{userAddresses[selectedAddressIdx]?.phone}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-150/60 dark:border-slate-750">
                  <h3 className="font-extrabold text-slate-805 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                    <CreditCard size={13} className="text-orange-500" />
                    Billing Setup
                  </h3>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Method:{' '}
                    <span className="text-orange-600 dark:text-orange-400 font-extrabold">
                      {paymentMethod === 'card' ? 'Secure Card' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Express Net Banking'}
                    </span>
                  </p>
                  {paymentMethod === 'card' && (
                    <div className="mt-1 font-mono leading-relaxed font-light text-slate-600 dark:text-gray-300 text-[11px]">
                      <strong>Card:</strong> •••• •••• •••• {cardNumber.slice(-4)}<br />
                      <strong>Expires:</strong> {cardExpiry}
                    </div>
                  )}
                </div>
              </div>

              {/* Items listing summaries */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Order Items</h3>
                <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map(item => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <img src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <span className="text-slate-800 dark:text-slate-200 line-clamp-1 max-w-sm">{item.title}</span>
                      </div>
                      <span className="text-slate-500 dark:text-gray-400 font-normal">
                        {item.quantity} x ${item.price} = <strong className="text-slate-850 dark:text-white font-extrabold">${item.price * item.quantity}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-gray-330 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-300"
                >
                  Back to Billing
                </button>
                <button
                  onClick={handlePlaceOrderSubmit}
                  disabled={placingOrder}
                  className="px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5 active:scale-97 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {placingOrder ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Place Order
                      <Sparkles size={13} className="text-yellow-250 animate-pulse" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Totals overview panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200">Payment Breakdown</h3>

          <div className="space-y-2.5 text-xs font-semibold leading-relaxed">
            <div className="flex justify-between text-slate-650 dark:text-gray-300">
              <span>Items Total</span>
              <span className="font-bold text-slate-850 dark:text-white">${subtotal.toLocaleString()}</span>
            </div>

            {couponCode && (
              <div className="flex justify-between text-teal-650">
                <span>Applied Coupon Discount ({couponCode})</span>
                <span>-${discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-650 dark:text-gray-300">
              <span>Estimated Shipping</span>
              <span>{shippingFee === 0 ? <span className="text-teal-600 font-bold dark:text-teal-400">FREE</span> : `$${shippingFee}`}</span>
            </div>

            <div className="flex justify-between text-slate-650 dark:text-gray-300">
              <span>Estimated Sales Tax (8%)</span>
              <span>${estimatedTax}</span>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between text-sm font-black text-slate-900 dark:text-white">
              <span>GRAND TOTAL</span>
              <span className="text-base text-orange-600 dark:text-orange-400 font-black">${grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-700/55">
            <button
              onClick={onBackToCart}
              className="w-full text-center py-2 bg-gray-50 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-750 text-slate-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer block active:scale-98"
            >
              Modify Cart Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
