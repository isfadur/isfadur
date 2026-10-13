import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { formatPriceBDT, formatTimeAgo } from './ListingCard';
import { useAuth } from '../context/AuthContext';
import {
  X,
  MapPin,
  Calendar,
  Eye,
  ShieldAlert,
  Phone,
  MessageSquare,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Package,
  Flag,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { Language, translations, getCategoryName, getConditionName } from '../i18n/translations';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onCategoryClick?: (category: string) => void;
  onOpenShare?: (listing: Listing) => void;
  onStartChat?: (listing: Listing) => void;
  onOpenMyAds?: () => void;
  onOpenAuth?: (notice?: { title: string; message: string }) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  lang?: Language;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onCategoryClick,
  onOpenShare,
  onStartChat,
  onOpenMyAds,
  onOpenAuth,
  isFavorite = false,
  onToggleFavorite,
  lang = 'en'
}) => {
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Suspected Fraud');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isSellerBlocked, setIsSellerBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const t = translations[lang];

  if (!listing) return null;

  const isOwner = Boolean(user && listing.ownerUid && user.uid === listing.ownerUid);

  // Check if seller is blocked by current user
  useEffect(() => {
    if (user?.uid && listing.ownerUid && user.uid !== listing.ownerUid) {
      fetch(`/api/users/${user.uid}/blocked`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.blockedUsers)) {
            setIsSellerBlocked(data.blockedUsers.some((b: any) => b.blockedUid === listing.ownerUid));
          }
        })
        .catch(() => {});
    }
  }, [user?.uid, listing.ownerUid]);

  const handleToggleBlockSeller = async () => {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth({
          title: lang === 'bn' ? 'ব্লক করতে লগইন প্রয়োজন' : 'Login Required to Block',
          message: lang === 'bn'
            ? 'বিক্রেতাকে ব্লক করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।'
            : 'Please log in to block this seller from communicating with you.'
        });
      }
      return;
    }

    if (!listing.ownerUid || isOwner) return;

    setBlockLoading(true);
    try {
      const endpoint = isSellerBlocked ? `/api/users/${user.uid}/unblock` : `/api/users/${user.uid}/block`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUid: listing.ownerUid,
          targetName: listing.sellerName
        })
      });
      if (res.ok) {
        setIsSellerBlocked(!isSellerBlocked);
      }
    } catch (err) {
      console.error('Failed to toggle block seller:', err);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleOpenReport = () => {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth({
          title: lang === 'bn' ? 'রিপোর্ট করতে লগইন প্রয়োজন' : 'Login Required to Report Ad',
          message:
            lang === 'bn'
              ? 'বিজ্ঞাপনটিতে প্রতারণা, ভুল তথ্য বা অসঙ্গতি রিপোর্ট করতে অনুগ্রহ করে লগইন করুন।'
              : 'Please log in or create an account to report suspected fraud, misleading information, or policy violations.'
        });
      }
      return;
    }
    setReportError(null);
    setReportSuccess(false);
    setIsReportOpen(true);
  };

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80'];

  // Check seller contact preferences
  const canShowPhone = listing.showPhone !== false && Boolean(listing.sellerPhone);
  const canCall = canShowPhone && listing.allowCalls !== false;

  const handleShare = () => {
    if (onOpenShare) {
      onOpenShare(listing);
    } else {
      if (navigator.share) {
        navigator
          .share({
            title: listing.title,
            text: `৳ ${formatPriceBDT(listing.price)} - ${listing.title} on Isfadur`,
            url: window.location.href,
          })
          .catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleChatClick = () => {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth({
          title: lang === 'bn' ? 'চ্যাট করতে লগইন করুন' : 'Login to Chat with Seller',
          message:
            lang === 'bn'
              ? 'বিক্রেতার সাথে সরাসরি চ্যাট করতে অনুগ্রহ করে লগইন করুন বা অ্যাকাউন্ট তৈরি করুন।'
              : 'Please log in or create an account to start an in-app conversation with the seller.'
        });
      }
      return;
    }

    if (isOwner) {
      return;
    }

    if (onStartChat) {
      onStartChat(listing);
    }
  };

  const handleSubmitListingReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      handleOpenReport();
      return;
    }

    setIsSubmittingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
          reporterUid: user.uid
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || 'Failed to submit report');
        return;
      }

      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportDetails('');
        setReportError(null);
      }, 1800);
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => {
                onClose();
                onCategoryClick?.(listing.category);
              }}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {getCategoryName(listing.category, lang)}
            </button>
            {listing.subcategory && (
              <>
                <span>/</span>
                <span className="text-slate-400">{listing.subcategory}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save / Favorite */}
            <button
              onClick={() => onToggleFavorite?.(listing.id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isFavorite
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={isFavorite ? 'Remove from saved' : 'Save ad'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title={t.shareAd}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Gallery & Description (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Main Image Stage */}
              <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <img
                  src={images[activeImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-contain bg-slate-950/5 dark:bg-slate-950"
                />

                {/* Left/Right controls for multiple photos */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                      }
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[11px] font-mono">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  {t.itemDescription}
                </h3>
                <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {listing.description}
                </div>
              </div>

              {/* Report ad button */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Ad ID: {listing.id}</span>
                <button
                  onClick={handleOpenReport}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বিজ্ঞাপন রিপোর্ট করুন' : 'Report this Ad'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Details & Seller Contact (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Title & Metadata */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug mb-2">
                  {listing.title}
                </h1>

                {/* Location and timestamp */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {listing.area}, {listing.district}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatTimeAgo(listing.createdAt, lang)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {t.viewsCount.replace('{count}', (listing.views || 0).toString())}
                  </span>
                </div>

                {/* Price card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      ৳ {formatPriceBDT(listing.price)}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        listing.isNegotiable
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {listing.isNegotiable ? t.negotiable : t.fixed}
                    </span>
                  </div>
                  {listing.condition && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t.condition}:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {getConditionName(listing.condition, lang)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Seller Contact & In-App Chat Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t.sellerInfo}
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {listing.sellerName}
                      </div>
                      {canShowPhone ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {listing.sellerPhone}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 mt-0.5 italic">
                          {lang === 'bn' ? 'ফোন নম্বর গোপন রাখা হয়েছে' : 'Phone hidden by seller'}
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {listing.sellerName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-2 space-y-2">
                    {/* If current user is the seller */}
                    {isOwner ? (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-center space-y-2">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          {lang === 'bn' ? 'এটি আপনার নিজস্ব বিজ্ঞাপন' : 'This is your own listing'}
                        </p>
                        {onOpenMyAds && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenMyAds();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'আমার বিজ্ঞাপনে যান' : 'Manage in My Ads'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Primary Action: IN-APP CHAT (Phase 3) */}
                        <button
                          onClick={handleChatClick}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                          <span>{lang === 'bn' ? 'বিক্রেতার সাথে চ্যাট করুন' : 'Chat with Seller'}</span>
                        </button>

                        {/* Phone Call (Respects privacy preferences strictly) */}
                        {canCall ? (
                          <a
                            href={`tel:${listing.sellerPhone}`}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {t.callSeller} {listing.sellerPhone}
                            </span>
                          </a>
                        ) : (
                          <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-1">
                            {lang === 'bn'
                              ? 'বিক্রেতা চ্যাটে যোগাযোগ অগ্রাধিকার দিয়েছেন'
                              : 'Seller prefers in-app chat • Calls disabled'}
                          </div>
                        )}

                        {/* Block/Unblock Seller Option (Phase 5) */}
                        {!isOwner && listing.ownerUid && (
                          <div className="pt-1 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={handleToggleBlockSeller}
                              disabled={blockLoading}
                              className={`text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-lg border ${
                                isSellerBlocked
                                  ? 'border-emerald-300 dark:border-emerald-850 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-750 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              <span>
                                {isSellerBlocked
                                  ? (lang === 'bn' ? 'বিক্রেতাকে আনব্লক করুন' : 'Unblock Seller')
                                  : (lang === 'bn' ? 'বিক্রেতাকে ব্লক করুন' : 'Block Seller')}
                              </span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Safety Tips */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 text-xs space-y-1.5 mt-4">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{t.safetyRulesTitle}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-900/90 dark:text-amber-300/90 pl-1 leading-snug">
                    <li>{t.safetyRule1}</li>
                    <li>{t.safetyRule2}</li>
                    <li>{t.safetyRule3}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REPORT LISTING POPUP */}
        {isReportOpen && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xs z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{lang === 'bn' ? 'বিজ্ঞাপন রিপোর্ট করুন' : 'Report Advertisement'}</span>
                </h4>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="py-6 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                  <Check className="w-8 h-8 mx-auto" />
                  <p className="text-xs font-bold">
                    {lang === 'bn'
                      ? 'রিপোর্ট জমা হয়েছে। মডারেশন টিম এটি পর্যালোচনা করবে।'
                      : 'Report submitted. Our moderation team will review this ad.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitListingReport} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'bn' ? 'রিপোর্টের কারণ' : 'Reason for report'}
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Fraudulent or Scam listing">Fraudulent or Scam listing (ভুয়া বা প্রতারণামূলক)</option>
                      <option value="Prohibited or Illegal item">Prohibited or Illegal item (নিষিদ্ধ বা অবৈধ পণ্য)</option>
                      <option value="Wrong Category or Misleading info">Wrong Category or Misleading info (ভুল তথ্য)</option>
                      <option value="Duplicate or Spam listing">Duplicate or Spam listing (স্প্যাম বিজ্ঞাপন)</option>
                      <option value="Other">Other concern (অন্যান্য কারণ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'bn' ? 'বিস্তারিত বিবরণ' : 'Details'}
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={3}
                      placeholder={
                        lang === 'bn'
                          ? 'কী সমস্যা রয়েছে সংক্ষেপে লিখুন...'
                          : 'Explain the issue with this listing...'
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      {isSubmittingReport ? 'Submitting...' : (lang === 'bn' ? 'জমা দিন' : 'Submit Report')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
