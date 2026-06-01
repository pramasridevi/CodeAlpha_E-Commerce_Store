import React, { useState } from 'react';
import { ShoppingBag, Search, Heart, ShoppingCart, User as UserIcon, LogOut, ShieldAlert, Sliders, Moon, Sun, ChevronDown } from 'lucide-react';
import { User, Cart } from '../types';

interface NavbarProps {
  user: User | null;
  cart: Cart | null;
  wishlistCount: number;
  onViewChange: (view: 'home' | 'cart' | 'wishlist' | 'profile' | 'admin') => void;
  onSearch: (q: string, cat?: string) => void;
  onLogout: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  categories: string[];
  currentCategory: string;
  onCategorySelect: (cat: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  user,
  cart,
  wishlistCount,
  onViewChange,
  onSearch,
  onLogout,
  onOpenAuth,
  categories,
  currentCategory,
  onCategorySelect,
  darkMode,
  onToggleDarkMode
}: NavbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const cartItemsCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal, selectedCat);
  };

  const categoriesWithAll = ['All', ...categories];

  return (
    <header className="sticky top-0 z-40 w-full transition-all bg-[#2874F0] dark:bg-slate-900 text-white shadow-md">
      {/* Upper bar: Professional Polish style header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => { onViewChange('home'); onSearch('', 'All'); setSearchVal(''); setSelectedCat('All'); }}
          className="flex items-center gap-1.5 cursor-pointer select-none group"
        >
          <div className="p-1 px-2.5 bg-[#FFD814] text-[#232f3e] font-black rounded-sm transform duration-200 group-hover:scale-105">
            <ShoppingBag className="w-5 h-5 inline-block -mt-1 mr-1 text-[#232f3e]" />
            S
          </div>
          <span className="text-xl font-extrabold italic tracking-tight hidden sm:inline-block">
            uper<span className="text-[#FFD814]">Cart</span>
          </span>
        </div>

        {/* Search section: Flipkart/Amazon combo bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl flex items-center bg-white rounded-sm overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-[#FFD814]">
          <div className="relative border-r border-gray-200 hidden md:block">
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                onCategorySelect(e.target.value);
              }}
              className="pl-3 pr-8 py-2 text-xs text-slate-700 bg-gray-50 focus:outline-none appearance-none cursor-pointer h-10 select-none font-medium"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search for products, brands, tech, essentials..."
            className="flex-grow px-4 py-2 text-sm text-slate-800 placeholder-gray-400 focus:outline-none h-10 w-full"
          />

          <button 
            type="submit" 
            className="px-5 bg-[#FFD814] hover:bg-[#ffe042] text-[#232f3e] font-bold h-10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#232f3e]" />
          </button>
        </form>

        {/* Interactive icons layout */}
        <div className="flex items-center gap-2 sm:gap-4 font-medium text-sm">
          {/* Theme customizer toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-white/80 hover:text-white rounded-sm hover:bg-white/10 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} className="text-[#FFD814]" /> : <Moon size={18} className="text-[#FFD814]" />}
          </button>

          {/* User Account / Welcome Area */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded-sm hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <UserIcon size={16} className="text-[#FFD814]" />
                  <div className="hidden sm:block text-xs leading-none">
                    <span className="text-[10px] text-white/80 block font-normal">Hello, Sign In</span>
                    <span className="font-bold text-white">{user.name.split(' ')[0]}</span>
                  </div>
                  <ChevronDown size={14} className="text-white/80 ml-1" />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-sm shadow-xl border border-gray-100 dark:border-slate-700 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-t-sm">
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { onViewChange('admin'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2 text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#2874F0] dark:text-[#2874F0] font-bold transition-all cursor-pointer"
                        >
                          <ShieldAlert size={14} />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => { onViewChange('profile'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        <UserIcon size={14} />
                        My Profile
                      </button>

                      <button
                        onClick={() => { onViewChange('home'); onSearch('', 'All'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        <Sliders size={14} />
                        Explore Marketplace
                      </button>

                      <button
                        onClick={() => { onLogout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-650 dark:text-red-400 border-t border-gray-100 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 py-1.5 px-4 bg-white hover:bg-gray-50 text-[#2874F0] font-bold rounded-sm transition-all text-xs cursor-pointer shadow-sm"
              >
                <UserIcon size={14} />
                Sign In
              </button>
            )}
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={() => onViewChange('wishlist')}
            className="p-2 text-slate-300 hover:text-white rounded-sm hover:bg-white/10 transition-all relative cursor-pointer"
            title="My Wishlist"
          >
            <Heart size={18} className={wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFD814] text-[#232f3e] text-[9.5px] font-black rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Icon */}
          <button
            onClick={() => onViewChange('cart')}
            className="flex items-center gap-1.5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all relative cursor-pointer"
            title="My Shopping Cart"
          >
            <ShoppingCart size={18} />
            <span className="hidden md:inline font-bold text-xs text-white">Cart</span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#FFD814] text-[#232f3e] text-[10px] font-black rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Categories navbar strip: White background with clean separators */}
      <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 border-t border-b border-gray-100 dark:border-slate-700/50 h-12 flex items-center justify-center flex-shrink-0 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 text-xs font-semibold h-8 select-none">
          <div className="mr-5 text-gray-550 dark:text-gray-400 pr-5 border-r border-gray-200 dark:border-slate-700 flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <Sliders size={13} className="text-[#2874F0]" />
            Shop by Category
          </div>
          
          <button
            onClick={() => onCategorySelect('All')}
            className={`px-3.5 py-1.5 rounded-sm transition-all cursor-pointer font-bold uppercase tracking-wide ${
              currentCategory === 'All' 
                ? 'bg-[#2874F0] text-white shadow-sm' 
                : 'hover:text-[#2874F0] text-slate-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            All Products
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={`px-3.5 py-1.5 rounded-sm transition-all cursor-pointer font-bold uppercase tracking-wide ${
                currentCategory === cat 
                  ? 'bg-[#2874F0] text-white shadow-sm' 
                  : 'hover:text-[#2874F0] text-slate-705 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
