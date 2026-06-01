import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SalesStats, Product, User, Order, OrderStatus } from '../types';
import { Shield, BarChart3, PackagePlus, Users, ShoppingCart, TrendingUp, Sliders, Edit, Trash2, Plus, X, Globe, DollarSign, Calendar, Eye, MapPin, RefreshCw, Layers } from 'lucide-react';

interface AdminViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefreshProductsList: () => void; // refresh central products list
  categories: string[];
}

export default function AdminDashboardView({ showToast, onRefreshProductsList, categories }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'users' | 'orders'>('stats');
  
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loading, setLoading] = useState(true);

  // CRUD Product Modals/States
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  
  // Product Form states
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('Electronics');
  const [stock, setStock] = useState(1);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [specs, setSpecs] = useState<string>(''); // Format: Key: Value, One per line
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Filter products or orders
  const [productSearch, setProductSearch] = useState('');

  // Selected Order details modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const salesStats = await api.admin.getStats();
      setStats(salesStats);

      const prodsResp = await api.products.list({ limit: 100 });
      setProducts(prodsResp.products);

      const usersResp = await api.admin.getUsers();
      setUsers(usersResp);

      const ordersResp = await api.admin.getOrders();
      setOrders(ordersResp);
    } catch (e: any) {
      showToast(e.message || 'Error loading administrator dashboards.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProdId(null);
    setTitle('');
    setBrand('');
    setPrice(10);
    setCategory('Electronics');
    setStock(10);
    setDescription('');
    setImageUrl('');
    setSpecs('');
    setIsBestSeller(false);
    setIsFeatured(false);
    setShowProductDialog(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProdId(p.id);
    setTitle(p.title);
    setBrand(p.brand);
    setPrice(p.price);
    setCategory(p.category);
    setStock(p.stock);
    setDescription(p.description);
    setImageUrl(p.images[0]);
    setIsBestSeller(!!p.isBestSeller);
    setIsFeatured(!!p.isFeatured);
    
    // Format specs dictionary to newline inputs
    if (p.specifications) {
      const lines = Object.entries(p.specifications).map(([key, val]) => `${key}: ${val}`);
      setSpecs(lines.join('\n'));
    } else {
      setSpecs('');
    }
    
    setShowProductDialog(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !brand || price <= 0 || stock < 0) {
      showToast('Please insert valid title, brand, positive price.', 'error');
      return;
    }

    setSubmittingProduct(true);
    
    // Parse specifications
    const parsedSpecs: { [key: string]: string } = {};
    if (specs.trim()) {
      specs.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (key && val) {
            parsedSpecs[key] = val;
          }
        }
      });
    }

    const payload = {
      title,
      brand,
      price: Number(price),
      category,
      stock: Number(stock),
      description,
      images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      specifications: parsedSpecs,
      isBestSeller,
      isFeatured
    };

    try {
      if (editingProdId) {
        // Edit Action
        const resp = await api.products.update(editingProdId, payload);
        showToast(`Product "${resp.product.title}" updated successfully!`, 'success');
      } else {
        // Create Action
        const resp = await api.products.create(payload);
        showToast(`Product "${resp.product.title}" added successfully!`, 'success');
      }
      
      setShowProductDialog(false);
      // reload inventory lists
      fetchAdminData();
      onRefreshProductsList();
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving product parameters.', 'error');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}" from the catalog?`)) return;

    try {
      await api.products.delete(id);
      showToast('Product successfully purged.', 'success');
      fetchAdminData();
      onRefreshProductsList();
    } catch (e) {
      showToast('Error removing product.', 'error');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.admin.updateUser(userId, newRole);
      showToast('User permissions configuration updated.', 'success');
      fetchAdminData();
    } catch (e: any) {
      showToast(e.message || 'Error demoting/promoting user.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to administratively terminate "${name}"?`)) return;
    try {
      await api.admin.deleteUser(userId);
      showToast('User account successfully purged.', 'success');
      fetchAdminData();
    } catch (e: any) {
      showToast(e.message || 'Error removing user.', 'error');
    }
  };

  const handleOrderStatusTransition = async (orderId: string, status: OrderStatus) => {
    try {
      const resp = await api.admin.updateOrderStatus(orderId, status);
      showToast(`Order transitioned to "${status}" successfully!`, 'success');
      
      // Update local states lists representation
      setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: status, trackingHistory: resp.order.trackingHistory } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: status, trackingHistory: resp.order.trackingHistory });
      }
      
      // refresh sales stats due to cancellation restocks
      const salesStats = await api.admin.getStats();
      setStats(salesStats);
    } catch (e: any) {
      showToast(e.message || 'Error transitioning order status.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2">
        <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading administrative core system portals...</p>
      </div>
    );
  }

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-405 bg-yellow-400 text-slate-950 rounded-full shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black">Marketplace Admin Panel</h1>
            <p className="text-xs text-gray-400 font-light mt-0.5">Control product stock levels, view analytics revenues, manage logistics or profiles.</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-yellow-400 text-xs font-bold border border-slate-700/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw size={12} />
          Sync Control Panel
        </button>
      </div>

      {/* Primary tabs controller layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Navigation block */}
        <div className="lg:col-span-1 space-y-1.5 font-bold text-xs uppercase">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition-all text-left cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-slate-900 text-yellow-400 dark:bg-slate-705 shadow-md'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <BarChart3 size={15} />
            Analytics Dashboard
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition-all text-left cursor-pointer ${
              activeTab === 'products'
                ? 'bg-slate-900 text-yellow-400 dark:bg-slate-705 shadow-md'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <PackagePlus size={15} />
            Products Inventory ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition-all text-left cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-yellow-400 dark:bg-slate-705 shadow-md'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <ShoppingCart size={15} />
            Process Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl transition-all text-left cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-yellow-400 dark:bg-slate-705 shadow-md'
                : 'bg-white dark:bg-slate-805 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-150 dark:border-slate-700/60'
            }`}
          >
            <Users size={15} />
            User Registrar ({users.length})
          </button>
        </div>

        {/* Tab display sections */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 p-5 shadow-xs">
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">Financial Revenue & General Metrics</h2>
              
              {/* Stats highlights banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-150/50 dark:border-slate-700/50 text-center">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full w-max mx-auto shadow-sm">
                    <DollarSign size={18} />
                  </div>
                  <span className="block text-[10px] text-gray-408 text-gray-450 uppercase mt-2.5 font-bold">Gross Revenue</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-150/50 dark:border-slate-700/50 text-center">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-full w-max mx-auto shadow-sm">
                    <ShoppingCart size={18} />
                  </div>
                  <span className="block text-[10px] text-gray-408 text-gray-450 uppercase mt-2.5 font-bold">Total Orders</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stats.totalOrders}</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-150/50 dark:border-slate-700/50 text-center">
                  <div className="p-2 bg-orange-50 text-orange-650 rounded-full w-max mx-auto shadow-sm">
                    <PackagePlus size={18} />
                  </div>
                  <span className="block text-[10px] text-gray-458 text-gray-450 uppercase mt-2.5 font-bold">Total Inventory</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stats.totalProducts}</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-150/50 dark:border-slate-700/50 text-center">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-full w-max mx-auto shadow-sm">
                    <Users size={18} />
                  </div>
                  <span className="block text-[10px] text-gray-458 text-gray-450 uppercase mt-2.5 font-bold">User Registrations</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stats.totalUsers}</span>
                </div>
              </div>

              {/* Category Breakdown list */}
              <div className="border border-gray-150 dark:border-slate-700/60 p-4 rounded-2xl bg-slate-50/20">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Revenue Division by Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.categorySales.map((sales, i) => (
                    <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-gray-100 dark:border-slate-700 text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Layers size={13} className="text-orange-500" />
                        {sales.category}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-gray-100 block">${sales.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{sales.count} units sold</span>
                      </div>
                    </div>
                  ))}
                  {stats.categorySales.length === 0 && (
                    <p className="text-xs text-gray-400 font-semibold uppercase text-center col-span-2 py-4">No order items processed yet to calculate divisions.</p>
                  )}
                </div>
              </div>

              {/* Monthly sales analytical list */}
              <div className="border border-gray-150 dark:border-slate-700/60 p-4 rounded-2xl bg-slate-50/20">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1">
                  <TrendingUp size={14} className="text-orange-500" />
                  Monthly Performance Trends
                </h3>
                <div className="space-y-2">
                  {stats.monthlyRevenue.map((trend, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <span className="text-[11px] font-bold text-gray-400 w-10 text-right uppercase font-mono">{trend.month}</span>
                      <div className="flex-grow bg-gray-105 dark:bg-slate-900/50 h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${Math.min(100, Math.max(8, (trend.sales / (stats.totalRevenue || 1)) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white w-16 text-left">${trend.sales.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <input
                  type="text"
                  placeholder="Query by title, brand, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full md:max-w-xs p-2.5 bg-gray-55 dark:bg-slate-900 border border-gray-200 dark:border-slate-705 text-slate-805 dark:text-white rounded-xl text-xs font-semibold focus:outline-none"
                />

                <button
                  onClick={handleOpenAddProduct}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-97 transition-all ml-auto shrink-0"
                >
                  <Plus size={14} />
                  Add New Product
                </button>
              </div>

              {/* Products Catalog table listing */}
              <div className="overflow-x-auto border border-gray-150 dark:border-slate-700/60 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-slate-900 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-gray-150 dark:border-slate-705">
                    <tr>
                      <th className="p-3">Product Info</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock Level</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-755 transition-colors font-semibold">
                        <td className="p-3 flex items-center gap-2.5 max-w-xs md:max-w-md">
                          <img src={p.images[0]} alt={p.title} className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100" referrerPolicy="no-referrer" />
                          <div className="truncate">
                            <span className="text-[10px] uppercase font-bold text-orange-600 font-mono tracking-wider">{p.brand}</span>
                            <p className="font-extrabold text-slate-905 truncate text-slate-900 dark:text-white" title={p.title}>{p.title}</p>
                          </div>
                        </td>
                        <td className="p-3 capitalize font-bold text-slate-700 dark:text-gray-300">{p.category}</td>
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">${p.price.toLocaleString()}</td>
                        <td className="p-3">
                          {p.stock === 0 ? (
                            <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">Out</span>
                          ) : p.stock <= 15 ? (
                            <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded animate-pulse">{p.stock} units!</span>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-teal-605 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">{p.stock} units</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-amber-500">★ {p.rating.average.toFixed(1)} <span className="text-[9px] text-gray-405">({p.rating.count})</span></td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 hover:bg-gray-150 rounded-lg text-slate-655 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Edit product parameters"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-655 hover:text-red-700 transition-colors cursor-pointer"
                              title="Purge product from database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center font-bold text-gray-400 uppercase tracking-widest">No matching products found inside catalog lists.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">Registered User Accounts Registry</h2>
              
              <div className="overflow-x-auto border border-gray-150 dark:border-slate-700/60 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-slate-900 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-gray-150 dark:border-slate-705">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Assigned Role Privilege</th>
                      <th className="p-3">Registered On</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-755 transition-colors font-semibold">
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">{u.name}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-gray-300">{u.email}</td>
                        <td className="p-3 font-bold">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold rounded-lg focus:outline-none focus:border-orange-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Administrator (Admin)</option>
                          </select>
                        </td>
                        <td className="p-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-655 hover:text-red-700 transition-colors cursor-pointer"
                            title="Purge user account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">All active Marketplace Orders</h2>

              <div className="overflow-x-auto border border-gray-150 dark:border-slate-700/60 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-slate-900 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-gray-150 dark:border-slate-705">
                    <tr>
                      <th className="p-3">Order Code</th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Shipping Dest</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-755 transition-colors font-semibold">
                        <td className="p-3 font-mono font-bold text-orange-655 dark:text-orange-400">{o.id}</td>
                        <td className="p-3 font-mono text-gray-400">{o.userId}</td>
                        <td className="p-3 font-extrabold text-slate-905 text-slate-900 dark:text-white">${o.totalAmount.toLocaleString()}</td>
                        <td className="p-3 truncate max-w-[120px]" title={o.shippingAddress?.fullName}>{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                        <td className="p-3 text-slate-800">
                          <select
                            value={o.orderStatus}
                            onChange={(e) => handleOrderStatusTransition(o.id, e.target.value as OrderStatus)}
                            className="p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold rounded-lg focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled (Restore Stock)</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1 py-2 bg-slate-100 hover:bg-slate-150 text-slate-805 rounded-lg text-[10px] font-black cursor-pointer uppercase py-1"
                          >
                            Inspect details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center font-bold text-gray-400 uppercase tracking-widest">No customer orders found in archives.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Add/Edit Product Modal Dialog Overlay */}
      {showProductDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={16} className="text-yellow-400" />
                {editingProdId ? 'Edit Product Parameters' : 'Add New Retail Product'}
              </h2>
              <button onClick={() => setShowProductDialog(false)} className="text-white bg-slate-800 hover:bg-slate-700 p-1 rounded-full cursor-pointer">
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProductSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Apple iPhone 15 Pro"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="E.g. Apple"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="999"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Stock Amount *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    placeholder="25"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Books">Books</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image URL (Optional Unsplash presets)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Technical specifications (Format: 'Key: Value', One item per line)</label>
                <textarea
                  rows={3}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder="Display: 6.1-inch Super Retina XDR&#10;Battery: Up to 23 hours video playback&#10;Connector: USB-C"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Long Description Text</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details concerning the product utility, accessories, support, guarantees etc..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="isBestSeller"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded border-gray-200 text-orange-600 cursor-pointer"
                  />
                  <label htmlFor="isBestSeller" className="text-xs font-bold text-slate-700 cursor-pointer">Bestseller Badge</label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-gray-200 text-orange-600 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 cursor-pointer">Featured Carousel</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProductDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-slate-750 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-yellow-450 text-yellow-400 rounded-xl text-xs font-black cursor-pointer uppercase active:scale-97 disabled:opacity-40"
                >
                  {submittingProduct ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingProdId ? 'Save Edits' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Order Details overlay modal popup */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
              <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Eye size={15} />
                Order {selectedOrder.id} Inspector
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-white bg-slate-800 hover:bg-slate-700 p-1 rounded-full cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-medium leading-relaxed">
              {/* Shipping address details */}
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                <h3 className="font-extrabold uppercase tracking-wider text-slate-805 flex items-center gap-1">
                  <MapPin size={12} className="text-orange-500" />
                  Shipping Destination Address
                </h3>
                <p className="font-extrabold text-slate-805">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="font-light">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}</p>
                <p className="font-bold text-[10px] text-gray-500 mt-1">CONTACT: {selectedOrder.shippingAddress?.phone}</p>
              </div>

              {/* Items listing */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Purchase Items</h3>
                <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl overflow-hidden">
                  {selectedOrder.products.map(item => (
                    <div key={item.productId} className="p-2.5 bg-white flex justify-between items-center font-semibold">
                      <div className="flex items-center gap-2">
                        <img src={item.image} alt={item.title} className="w-7 h-7 rounded object-cover" />
                        <span className="truncate max-w-[240px] text-slate-900">{item.title}</span>
                      </div>
                      <span className="text-slate-500">
                        {item.quantity} x ${item.price} = <strong>${item.price * item.quantity}</strong>
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-10 text-slate-900 bg-slate-50 flex justify-between items-center font-extrabold text-xs">
                    <span>Grand Charged Total:</span>
                    <span className="text-orange-600">${selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Timelines tracking histories */}
              <div className="space-y-2 pt-2 border-t border-gray-105">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Logistics Tracking Milestones</h3>
                <div className="space-y-3 pl-3.5 border-l-2 border-orange-500/20">
                  {selectedOrder.trackingHistory.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* circle node symbol */}
                      <span className={`absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full ring-4 ${
                        step.isCompleted 
                          ? 'bg-orange-500 ring-orange-500/10 animate-pulse' 
                          : 'bg-gray-200 ring-white'
                      }`} />
                      
                      <div className="font-semibold text-[11px]">
                        <span className={`uppercase font-bold block ${step.isCompleted ? 'text-slate-905 text-slate-900' : 'text-gray-400'}`}>
                          {step.status} {step.isCompleted && '✓'}
                        </span>
                        <p className="text-gray-400 leading-tight font-light">{step.description}</p>
                        {step.timestamp && (
                          <span className="text-[9px] font-mono font-bold text-gray-400">{new Date(step.timestamp).toLocaleDateString()} {new Date(step.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-105">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
