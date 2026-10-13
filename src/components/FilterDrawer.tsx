import React, { useState, useEffect } from 'react';
import { CATEGORIES_LIST } from '../data/categories';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { CategoryItem } from '../types';
import { Language, translations, getCategoryName, getConditionName } from '../i18n/translations';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  MapPin,
  Tag,
  BadgeDollarSign,
  Sparkles
} from 'lucide-react';

export interface FilterState {
  category: string;
  district: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  sortBy: string;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  categoryCounts: CategoryItem[];
  lang: Language;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  categoryCounts,
  lang,
}) => {
  const t = translations[lang];

  // Local draft state while tweaking in drawer
  const [draft, setDraft] = useState<FilterState>(filters);

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const currentDistrictObj =
    BANGLADESH_DISTRICTS.find((d) => d.name === draft.district) || BANGLADESH_DISTRICTS[0];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setDraft((prev) => ({
      ...prev,
      district: newDistrict,
      area: 'All', // Reset area when district changes
    }));
  };

  const getCatCount = (name: string) => {
    const found = categoryCounts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found ? found.count : 0;
  };

  // Condition is relevant for physical goods (Mobiles, Fashion, Home, Vehicles, Other)
  const isConditionRelevant =
    draft.category === 'All' ||
    ['Mobiles & Electronics', 'Fashion & Clothing', 'Home & Living', 'Vehicles', 'Other'].includes(
      draft.category
    );

  // Count how many filters differ from default
  let activeFilterCount = 0;
  if (draft.category !== 'All') activeFilterCount++;
  if (draft.district !== 'All') activeFilterCount++;
  if (draft.area !== 'All') activeFilterCount++;
  if (draft.minPrice && draft.minPrice.trim() !== '') activeFilterCount++;
  if (draft.maxPrice && draft.maxPrice.trim() !== '') activeFilterCount++;
  if (draft.condition !== 'All') activeFilterCount++;
  if (draft.sortBy !== 'latest') activeFilterCount++;

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onApplyFilters(draft);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {
      category: 'All',
      district: 'All',
      area: 'All',
      minPrice: '',
      maxPrice: '',
      condition: 'All',
      sortBy: 'latest',
    };
    setDraft(emptyFilters);
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      {/* Background backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel: Slide from right on desktop, bottom sheet style on mobile */}
      <div
        className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-base font-bold leading-tight flex items-center gap-2">
                <span>{t.filterTitle}</span>
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার চাহিদা অনুযায়ী ফিল্টার বাছাই করুন'
                  : 'Refine marketplace listings by category, location & price'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filter Form */}
        <form onSubmit={handleApply} className="p-5 space-y-6 overflow-y-auto grow">
          {/* 1. Category Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.category}</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, category: 'All' }))}
                className={`flex items-center justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                  draft.category === 'All'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <span>{t.allCategories}</span>
                {draft.category === 'All' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>

              {/* 9 Categories */}
              {CATEGORIES_LIST.map((cat) => {
                const isSelected = draft.category === cat.name;
                const count = getCatCount(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, category: cat.name }))}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate pr-1">{getCategoryName(cat.name, lang)}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Location (District & Thana/Area) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.location}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t.district}
                </span>
                <select
                  value={draft.district}
                  onChange={handleDistrictChange}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">{t.allDistricts}</option>
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t.area}
                </span>
                <select
                  value={draft.area}
                  disabled={draft.district === 'All'}
                  onChange={(e) => setDraft((prev) => ({ ...prev, area: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="All">{t.allAreas}</option>
                  {draft.district !== 'All' &&
                    currentDistrictObj.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Price Range (৳) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.priceRange}</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t.minPrice}
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={draft.minPrice}
                    onChange={(e) => setDraft((prev) => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t.maxPrice}
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={draft.maxPrice}
                    onChange={(e) => setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Condition (shown where relevant) */}
          {isConditionRelevant && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.condition}</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'All', label: t.allConditions },
                  { value: 'Used', label: t.condUsed },
                  { value: 'Brand New', label: t.condBrandNew },
                  { value: 'Like New', label: t.condLikeNew },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, condition: item.value }))}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      draft.condition === item.value
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Sort By */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.sortBy}
            </label>
            <select
              value={draft.sortBy}
              onChange={(e) => setDraft((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="latest">{t.sortLatest}</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
            </select>
          </div>
        </form>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetAll}</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{t.applyFilters}</span>
            {activeFilterCount > 0 && (
              <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
