import React, { useState, useEffect } from 'react';
import { User, Order, Address } from '../types';
import { api } from '../lib/api';
import { User as UserIcon, MapPin, Package, Lock, Plus, Trash2, Calendar, ClipboardList, CheckCircle, Truck, RefreshCw, Eye, ArrowRight, ShieldCheck } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onOpenAuth: () => void;
  onViewOrderDetails: (oId: string) => void;
}

export default function UserProfileView({
  user,
  onUpdateUser,
  showToast,
  onOpenAuth,
  onViewOrderDetails
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile forms
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [isDefault, setIsDefault] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Load user orders
  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const list = await api.orders.list();
      setOrders(list);
    } catch (e: any) {
      showToast('Error loading order history.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const response = await api.auth.updateProfile({
        name: profileName,
        email: profileEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      onUpdateUser(response.user);
      setCurrentPassword('');
      setNewPassword('');
      showToast('Profile information successfully updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating profile info.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !state || !zipCode) {
      showToast('Please print all asterisk fields.', 'error');
      return;
    }
    setSubmittingAddress(true);
    try {
      const response = await api.auth.addAddress({
        fullName,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault
      });
      onUpdateUser(response.user);
      setShowAddAddress(false);
      resetAddressForm();
      showToast('Shipping address successfully added to your address book.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error adding address.', 'error');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const resetAddressForm = () => {
    setFullName('');
    setPhone('');
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('USA');
    setIsDefault(false);
  };

  const handleDeleteAddress = async (index: number) => {
    try {
      const response = await api.auth.deleteAddress(index);
      onUpdateUser(response.user);
      showToast('Address has been removed.', 'success');
    } catch (err: any) {
      showToast('Error removing address.', 'error');
    }
  };

  const handleSetDefaultAddress = async (index: number) => {
    try {
      const response = await api.auth.setDefaultAddress(index);
      onUpdateUser(response.user);
      showToast('Default shipping address updated.', 'success');
    } catch (err: any) {
      showToast('Error updating default address.', 'error');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-950/50';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-950/50';
      case 'processing':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-950/50';
      case 'cancelled':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-950/50';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-950/20 dark:text-slate-400 border border-slate-200 dark:border-slate-950/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white rounded-2xl p-6 md:p-8 mb-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-400 text-slate-950 rounded-full shadow-lg">
            <UserIcon size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">{user.name}</h1>
            <p className="text-xs text-gray-300 font-light mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950">
              Registered Account • {user.role}
            </span>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-800 pt-4 md:pt-0 md:border-0 text-center md:text-right">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Placed Orders</span>
            <span className="text-xl font-extrabold text-white">{orders.length}</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Default Address</span>
            <span className="text-xs font-semibold text-yellow-400 truncate max-w-xs block">
              {user.addresses.find(a => a.isDefault)?.city || 'Not declared'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid tabs layout (Amazon details feel) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation panel */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-yellow-400 font-black shadow-md dark:bg-slate-705'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package size={14} />
              My Orders & Status
            </span>
            <span className="bg-slate-800 text-white dark:bg-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-slate-900 text-yellow-400 font-black shadow-md dark:bg-slate-750'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <MapPin size={14} />
            Address Book
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-yellow-400 font-black shadow-md dark:bg-slate-750'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <Lock size={14} />
            Security & Profile
          </button>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-3">
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-4 mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                  <ClipboardList className="text-orange-500" size={18} />
                  My Purchase Archives
                </h2>
                <button 
                  onClick={fetchOrders}
                  className="p-1 px-2 text-[10px] font-bold text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 rounded-md border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={10} className={loadingOrders ? 'animate-spin' : ''} />
                  Sync List
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex flex-col justify-center items-center gap-2">
                  <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Syncing order archives...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2.5" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">No orders placed yet</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Explore our hot categories, add products to your cart, and place your first order!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((val) => (
                    <div 
                      key={val.id} 
                      className="border border-gray-150 dark:border-slate-700/60 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-slate-50/50 dark:bg-slate-900/10"
                    >
                      {/* Order info strip */}
                      <div className="bg-gray-100 dark:bg-slate-900/50 p-3 flex flex-wrap gap-3 items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[10px] uppercase text-gray-400 block font-normal">Order ID</span>
                            <code className="text-xs font-mono font-bold text-slate-800 dark:text-gray-200">{val.id}</code>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-gray-400 block font-normal">Placed On</span>
                            <span className="flex items-center gap-0.5 text-slate-700 dark:text-gray-300">
                              <Calendar size={11} />
                              {new Date(val.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-gray-400 block font-normal">Grand Total</span>
                            <span className="font-bold text-slate-900 dark:text-white">${val.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(val.orderStatus)}`}>
                            {val.orderStatus}
                          </span>
                          <button
                            onClick={() => onViewOrderDetails(val.id)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 p-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                          >
                            <Eye size={11} />
                            Track Details
                          </button>
                        </div>
                      </div>

                      {/* Items previews list */}
                      <div className="p-3.5 space-y-3 bg-white dark:bg-slate-800/20">
                        {val.products.map(item => (
                          <div key={item.productId} className="flex gap-3 items-center text-xs justify-between">
                            <div className="flex gap-3 items-center">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-slate-700"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-md">{item.title}</h4>
                                <p className="text-gray-400 text-[10px] mt-0.5 font-medium">Quantity: {item.quantity} • Unit Price: ${item.price}</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-slate-800 dark:text-white">${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-4">
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="text-orange-500" size={18} />
                  My Delivery Address Book
                </h2>
                {!showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-yellow-400 rounded-xl text-xs font-bold hover:shadow-md transition-shadow cursor-pointer active:scale-97"
                  >
                    <Plus size={14} />
                    Add Address
                  </button>
                )}
              </div>

              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-750/80 rounded-2xl space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-2">New Address Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555-0199"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                      placeholder="Apartment, suite, unit, building, street address"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mountain View"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        required
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="94043"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
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
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                      Make this my default shipping address
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAddress}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:brightness-105 active:scale-97 flex items-center gap-1"
                    >
                      {submittingAddress ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {user.addresses.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-gray-200">No addresses declared</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Please configure an address to checkout quickly!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((val, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-2xl relative flex flex-col justify-between ${
                        val.isDefault 
                          ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/5' 
                          : 'border-gray-150 dark:border-slate-700/60'
                      }`}
                    >
                      {val.isDefault && (
                        <span className="absolute top-4 right-4 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md shadow-xs">
                          Default
                        </span>
                      )}

                      <div className="text-xs">
                        <h4 className="font-extrabold text-slate-900 dark:text-white mb-1">{val.fullName}</h4>
                        <p className="text-slate-650 dark:text-gray-300 font-light pr-12">{val.street}</p>
                        <p className="text-slate-650 dark:text-gray-300 font-light">{val.city}, {val.state} {val.zipCode}</p>
                        <p className="text-slate-650 dark:text-gray-300 font-medium mt-1">{val.country} • {val.phone}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                        {!val.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(idx)}
                            className="text-[10px] font-bold text-slate-600 hover:text-orange-500 hover:underline dark:text-gray-400 cursor-pointer"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-0.5">
                            <ShieldCheck size={11} />
                            Primary Delivery Option
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteAddress(idx)}
                          className="p-1 px-2 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-700/50 pb-4 mb-5">
                <Lock className="text-orange-500" size={18} />
                Profile & Security Center
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50 pr-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-3">Modify Account Password</h3>
                  <p className="text-[11px] text-gray-400 mb-4">Leave the following fields blank if you do not want to change your current password.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Secure Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold hover:brightness-105 transition-all shadow-md cursor-pointer active:scale-97"
                  >
                    {updatingProfile ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Update Account Profile'}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
