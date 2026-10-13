import React from 'react';
import { CATEGORIES_LIST } from '../data/categories';
import { CategoryItem } from '../types';
import { LayoutGrid } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: CategoryItem[];
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const getCount = (name: string) => {
    const found = categoryCounts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found ? found.count : 0;
  };

  const totalCount = categoryCounts.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <section className="bg-white border-b border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Explore Categories
          </h2>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => onSelectCategory('All')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Clear filter ({totalCount} ads)
            </button>
          )}
        </div>

        {/* Category horizontal scrolling or wrap grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {/* All Categories Option */}
          <button
            onClick={() => onSelectCategory('All')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <LayoutGrid
              className={`w-5 h-5 mb-1.5 ${
                selectedCategory === 'All' ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span className="text-xs font-semibold leading-tight">All Ads</span>
            <span
              className={`text-[10px] mt-0.5 ${
                selectedCategory === 'All' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* 9 Categories */}
          {CATEGORIES_LIST.map((cat) => {
            const Icon = cat.icon;
            const count = getCount(cat.name);
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1.5 ${
                    isSelected ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
                <span className="text-xs font-medium leading-tight line-clamp-1">
                  {cat.name}
                </span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
