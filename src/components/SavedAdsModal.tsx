import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { formatPriceBDT, formatTimeAgo } from './ListingCard';
import { Language, translations, getCategoryName } from '../i18n/translations';
import {
  X,
  Heart,
  MapPin,
  MessageSquare,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface SavedAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedListings: Listing[];
  onRemoveFavorite: (listingId: string) => void;
  onViewListing: (listing: Listing) => void;
  onStartChat?: (listing: Listing) => void;
  onExploreMarketplace: () => void;
  lang?: Language;
}

export const SavedAdsModal: React.FC<SavedAdsModalProps> = ({
  isOpen,
  onClose,
  savedListings,
  onRemoveFavorite,
  onViewListing,
  onStartChat,
  onExploreMarketplace,
  lang = 'en'
}) => {
  const [filterQuery, setFilterQuery] = useState<string>('');

  if (!isOpen) return null;

  const t = translations[lang];

  const filteredListings = savedListings.filter((l) =>
    l.title.toLowerCase().includes(filterQuery.toLowerCase().trim()) ||
    l.category.toLowerCase().includes(filterQuery.toLowerCase().trim()) ||
    l.district.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'bn' ? 'সক্রিয়' : 'Active'}
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            {lang === 'bn' ? 'বিক্রি হয়েছে (Sold)' : 'Sold'}
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {lang === 'bn' ? 'স্থগিত (Paused)' : 'Paused'}
          </span>
        );
      case 'removed_by_admin':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
            {lang === 'bn' ? 'অপসারিত' : 'Removed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-600 dark:fill-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t.savedAdsTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                  {savedListings.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার অ্যাকাউন্টে সংরক্ষিত প্রিয় বিজ্ঞাপনসমূহ'
                  : 'Listings you saved to track or inquire about later'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search inside favorites if more than 3 */}
        {savedListings.length > 3 && (
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'সংরক্ষিত বিজ্ঞাপন খুঁজুন...' : 'Filter saved ads...'}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        )}

        {/* Body / List */}
        <div className="p-4 sm:p-5 overflow-y-auto grow space-y-3">
          {savedListings.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 mx-auto flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.noSavedAds}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {t.noSavedAdsSubtext}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreMarketplace();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'মার্কেটপ্লেস ব্রাউজ করুন' : 'Browse Marketplace'}</span>
              </button>
            </div>
          ) : filteredListings.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">
              {lang === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No matching saved ads'}
            </p>
          ) : (
            filteredListings.map((item) => {
              const primaryImg =
                item.images && item.images.length > 0
                  ? item.images[0]
                  : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80';
              const isAvailable = item.status === 'active' || item.status === 'approved';

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                >
                  {/* Left: Thumbnail & Info */}
                  <div
                    onClick={() => {
                      onClose();
                      onViewListing(item);
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 grow"
                  >
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={primaryImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(item.status)}
                        <span className="text-[10px] font-medium text-slate-400">
                          {getCategoryName(item.category, lang)}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimeAgo(item.createdAt, lang)}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ৳ {formatPriceBDT(item.price)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.isNegotiable ? t.negotiable : t.fixed}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.area}, {item.district}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                    {isAvailable && onStartChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartChat(item);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Chat with seller"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{lang === 'bn' ? 'চ্যাট' : 'Chat'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewListing(item);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={lang === 'bn' ? 'সেভ তালিকা থেকে মুছুন' : 'Remove from saved'}
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedListings.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              {lang === 'bn'
                ? `মোট ${savedListings.length}টি বিজ্ঞাপন সেভ করা আছে`
                : `${savedListings.length} advertisement(s) saved`}
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
