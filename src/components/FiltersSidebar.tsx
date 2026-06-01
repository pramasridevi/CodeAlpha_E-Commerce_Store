import React, { useState } from 'react';
import { Sliders, RefreshCw, Star, X } from 'lucide-react';

interface FiltersSidebarProps {
  categories: string[];
  brands: string[];
  selectedCategory: string;
  selectedBrand: string;
  minPrice: number;
  maxPrice: number;
  selectedSort: string;
  onCategoryChange: (cat: string) => void;
  onBrandChange: (brand: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onSortChange: (sort: string) => void;
  onReset: () => void;
  onCloseMobile?: () => void;
}

export default function FiltersSidebar({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  selectedSort,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onSortChange,
  onReset,
  onCloseMobile
}: FiltersSidebarProps) {
  const [minInput, setMinInput] = useState(minPrice === 0 ? '' : String(minPrice));
  const [maxInput, setMaxInput] = useState(maxPrice === 2000 ? '' : String(maxPrice));

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = Number(minInput) || 0;
    const maxVal = Number(maxInput) || 2000;
    onPriceChange(minVal, maxVal);
  };

  const clearFilters = () => {
    setMinInput('');
    setMaxInput('');
    onReset();
  };

  return (
    <aside className="w-full bg-white dark:bg-slate-800 rounded-sm border border-gray-150 dark:border-slate-700/60 p-5 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wide text-slate-800 dark:text-gray-100">
          <Sliders className="w-4 h-4 text-[#2874F0]" />
          Filters
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-[#2874F0] hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 hover:underline cursor-pointer"
            title="Reset to default settings"
          >
            <RefreshCw size={10} />
            Reset
          </button>
          
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-705"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Sorting layout */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">
          Sort Products By
        </label>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-gray-100 rounded-sm text-xs font-bold focus:outline-none focus:border-[#2874F0] cursor-pointer"
        >
          <option value="bestseller">Best Selling / Popularity</option>
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Categories listing */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">
          Category
        </label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange('All')}
            className={`text-left px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-blue-50 dark:bg-blue-950/20 text-[#2874F0] dark:text-blue-400'
                : 'text-slate-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-705'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`text-left px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-[#2874F0] dark:text-blue-400'
                  : 'text-slate-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-705'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Selection */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">
          Brand
        </label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onBrandChange('All')}
            className={`text-left px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              selectedBrand === 'All'
                ? 'bg-blue-50 dark:bg-blue-950/20 text-[#2874F0] dark:text-blue-400'
                : 'text-slate-655 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-705'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(b)}
              className={`text-left px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                selectedBrand === b
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-[#2874F0] dark:text-blue-400'
                  : 'text-slate-655 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-705'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Price constraints form layout */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2.5">
          Price Range ($)
        </label>
        <form onSubmit={handlePriceApply} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-750 text-slate-800 dark:text-gray-100 rounded-sm text-xs font-semibold focus:outline-none focus:border-[#2874F0]"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-750 text-slate-800 dark:text-gray-100 rounded-sm text-xs font-semibold focus:outline-none focus:border-[#2874F0]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-[#2874F0] hover:bg-blue-700 text-white rounded-sm text-xs font-bold cursor-pointer hover:shadow-xs transition-colors active:scale-97"
          >
            Apply Price Filters
          </button>
        </form>
      </div>

      {/* Trust & support note */}
      <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-sm border border-blue-100 dark:border-blue-950/20 text-[11px] text-slate-500 dark:text-blue-300 leading-normal font-medium">
        ⭐ Filter items instantly by categories or brands. Need help? Contact customer care support anytime in profile settings!
      </div>
    </aside>
  );
}
