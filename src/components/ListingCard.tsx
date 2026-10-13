import React, { useState } from 'react';
import { Listing } from '../types';
import { MapPin, PhoneCall, Share2, Check, Heart } from 'lucide-react';
import { Language, translations, getConditionName, getCategoryName } from '../i18n/translations';

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
  onShare?: (listing: Listing) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  lang?: Language;
  viewMode?: 'grid' | 'list';
}

export function formatPriceBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimeAgo(dateString: string, lang: Language = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return lang === 'bn' ? `${diffInMinutes} মিনিট আগে` : `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return lang === 'bn' ? `${diffInHours} ঘণ্টা আগে` : `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return lang === 'bn' ? `${diffInDays} দিন আগে` : `${diffInDays}d ago`;
  }
  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  onShare,
  isFavorite = false,
  onToggleFavorite,
  lang = 'en',
  viewMode = 'grid'
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(listing);
    } else {
      const shareUrl = `${window.location.origin}/#ad-${listing.id}`;
      if (navigator.share) {
        navigator.share({
          title: listing.title,
          text: `৳ ${formatPriceBDT(listing.price)} - ${listing.title} on Isfadur`,
          url: shareUrl,
        }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(listing.id);
  };

  const primaryImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80';

  // --- LIST VIEW MODE (Horizontal compact row) ---
  if (viewMode === 'list') {
    return (
      <article
        onClick={() => onClick(listing)}
        className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer flex flex-row items-stretch w-full"
      >
        {/* Left: Thumbnail Image */}
        <div className="relative w-32 sm:w-48 shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={primaryImage}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {listing.condition && listing.condition !== 'Not Applicable' && (
            <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
              {getConditionName(listing.condition, lang)}
            </div>
          )}

          {/* Quick Favorite on thumbnail */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-xs transition-all z-10 ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-slate-900/60 hover:bg-slate-900/90 text-white hover:text-rose-400'
            }`}
            title={isFavorite ? 'Remove from saved' : 'Save ad'}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-white' : ''}`} />
          </button>

          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[9px] font-medium px-1 rounded">
              {t.photosCount.replace('{count}', listing.images.length.toString())}
            </div>
          )}
        </div>

        {/* Right: Content details */}
        <div className="p-3 sm:p-4 flex flex-col justify-between grow min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                {getCategoryName(listing.category, lang)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatTimeAgo(listing.createdAt, lang)}</span>
            </div>

            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
              {listing.title}
            </h3>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                ৳ {formatPriceBDT(listing.price)}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-medium ${
                  listing.isNegotiable
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {listing.isNegotiable ? t.negotiable : t.fixed}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 truncate max-w-[130px] sm:max-w-none">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{listing.area}, {listing.district}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className={`p-0.5 rounded transition-colors ${
                    isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                  }`}
                  title={isFavorite ? 'Remove from saved' : 'Save ad'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
                <span title={t.callSeller}>
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                </span>
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title={copied ? t.copied : t.shareAd}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // --- GRID VIEW MODE (Default 2/3/4 col responsive card) ---
  return (
    <article
      onClick={() => onClick(listing)}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer flex flex-col h-full relative"
    >
      {/* 1. Product/Listing Image */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={primaryImage}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Quiet Condition Tag if not 'Not Applicable' */}
        {listing.condition && listing.condition !== 'Not Applicable' && (
          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            {getConditionName(listing.condition, lang)}
          </div>
        )}

        {/* Save / Favorite Action Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-all z-10 ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-sm scale-105'
              : 'bg-slate-900/60 hover:bg-slate-900/90 text-white hover:text-rose-400'
          }`}
          title={isFavorite ? (lang === 'bn' ? 'সেভ থেকে সরান' : 'Remove from saved') : (lang === 'bn' ? 'বিজ্ঞাপনটি সেভ করুন' : 'Save advertisement')}
          aria-label={isFavorite ? 'Remove from saved' : 'Save advertisement'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Quiet image counter if multiple */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {t.photosCount.replace('{count}', listing.images.length.toString())}
          </div>
        )}
      </div>

      {/* 2. Card Content with compact padding */}
      <div className="p-3 sm:p-3.5 flex flex-col grow justify-between">
        <div>
          {/* Category & Time - unboxed text with separator */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {getCategoryName(listing.category, lang)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{formatTimeAgo(listing.createdAt, lang)}</span>
          </div>

          {/* 3. Listing Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug mb-2">
            {listing.title}
          </h3>
        </div>

        <div>
          {/* 4. Price & Negotiable tag */}
          <div className="flex items-baseline justify-between gap-1 mb-2">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              ৳ {formatPriceBDT(listing.price)}
            </span>
            <span
              className={`text-[10px] sm:text-[11px] font-medium shrink-0 ${
                listing.isNegotiable
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {listing.isNegotiable ? t.negotiable : t.fixed}
            </span>
          </div>

          {/* 5. Location & Quick Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 truncate pr-1">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{listing.area}, {listing.district}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`p-0.5 rounded transition-colors ${
                  isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                }`}
                title={isFavorite ? 'Remove from saved' : 'Save ad'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
              <span title={t.callSeller}>
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
              </span>
              <button
                type="button"
                onClick={handleShareClick}
                className="p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title={copied ? t.copied : t.shareAd}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
