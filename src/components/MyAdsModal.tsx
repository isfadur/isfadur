import React, { useState, useEffect, useCallback } from 'react';
import { Listing, ListingStatus, StatusHistoryEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { EditAdModal } from './EditAdModal';
import {
  X,
  Package,
  Eye,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  History,
  Edit,
  AlertCircle,
  Loader2,
  Plus,
  Tag,
  Clock,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface MyAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPostAd: () => void;
  onViewListing: (listing: Listing) => void;
  lang?: 'en' | 'bn';
}

export const MyAdsModal: React.FC<MyAdsModalProps> = ({
  isOpen,
  onClose,
  onOpenPostAd,
  onViewListing,
  lang = 'en',
}) => {
  const { user } = useAuth();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter tab: 'all' | 'active' | 'sold' | 'paused'
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'sold' | 'paused'>('all');

  // Edit ad modal state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Status History drawer / modal state
  const [viewHistoryListing, setViewHistoryListing] = useState<Listing | null>(null);

  const fetchUserAds = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/listings?ownerUid=${encodeURIComponent(user.uid)}`);
      if (!res.ok) {
        throw new Error('Failed to load your advertisements');
      }
      const data = await res.json();
      setUserListings(data.listings || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching your ads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserAds();
    }
  }, [isOpen, user, fetchUserAds]);

  if (!isOpen) return null;

  // Handle status change: active, sold, paused
  const handleUpdateStatus = async (
    listingId: string,
    newStatus: 'active' | 'sold' | 'paused',
    noteText?: string
  ) => {
    if (!user) return;
    setActionLoadingId(listingId);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userUid: user.uid,
          note: noteText || `Status changed to ${newStatus} by owner`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Update in state locally
      setUserListings((prev) =>
        prev.map((item) => (item.id === listingId ? data.listing : item))
      );

      const msg =
        newStatus === 'sold'
          ? (lang === 'bn' ? 'বিজ্ঞাপনটি "বিক্রিত" হিসেবে চিহ্নিত করা হয়েছে।' : 'Listing marked as Sold.')
          : newStatus === 'paused'
          ? (lang === 'bn' ? 'বিজ্ঞাপনটি সাময়িকভাবে স্থগিত রাখা হয়েছে।' : 'Listing paused and hidden from marketplace.')
          : (lang === 'bn' ? 'বিজ্ঞাপনটি পুনরায় সক্রিয় করা হয়েছে।' : 'Listing reactivated and published live.');

      setStatusMessage(msg);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Status update failed');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter listings by tab
  const filteredListings = userListings.filter((item) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return item.status === 'active' || item.status === 'approved';
    if (selectedTab === 'sold') return item.status === 'sold';
    if (selectedTab === 'paused') return item.status === 'paused';
    return true;
  });

  const totalAds = userListings.length;
  const activeAdsCount = userListings.filter((l) => l.status === 'active' || l.status === 'approved').length;
  const soldAdsCount = userListings.filter((l) => l.status === 'sold').length;
  const pausedAdsCount = userListings.filter((l) => l.status === 'paused').length;
  const totalViews = userListings.reduce((sum, l) => sum + (l.views || 0), 0);

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <CheckCircle className="w-3 h-3 text-purple-600" />
            {lang === 'bn' ? 'বিক্রিত (Sold)' : 'Sold'}
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <PauseCircle className="w-3 h-3 text-amber-600" />
            {lang === 'bn' ? 'স্থগিত (Paused)' : 'Paused'}
          </span>
        );
      case 'removed_by_admin':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            {lang === 'bn' ? 'এডমিন দ্বারা অপসারিত' : 'Removed by Admin'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600" />
            {lang === 'bn' ? 'পর্যালোচনাধীন' : 'Pending Review'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {lang === 'bn' ? 'আমার বিজ্ঞাপন সমূহ (My Ads)' : 'My Advertisements'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'আপনার পোস্ট করা সকল বিজ্ঞাপন পরিচালনা ও পর্যবেক্ষণ করুন'
                  : 'Manage, edit, pause, and track your listings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenPostAd();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ নতুন বিজ্ঞাপন' : '+ Post New Ad'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'bn' ? 'মোট বিজ্ঞাপন' : 'Total Ads'}
              </p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalAds}</p>
            </div>
            <Package className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {lang === 'bn' ? 'সক্রিয় বিজ্ঞাপন' : 'Active Ads'}
              </p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {activeAdsCount}
              </p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                {lang === 'bn' ? 'বিক্রিত হয়েছে' : 'Sold Ads'}
              </p>
              <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                {soldAdsCount}
              </p>
            </div>
            <ShoppingBag className="w-5 h-5 text-purple-400" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'bn' ? 'মোট ভিউজ' : 'Total Views'}
              </p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalViews}</p>
            </div>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({totalAds})
          </button>
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedTab === 'active'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'সক্রিয়' : 'Active'} ({activeAdsCount})
          </button>
          <button
            onClick={() => setSelectedTab('sold')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedTab === 'sold'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'বিক্রিত' : 'Sold'} ({soldAdsCount})
          </button>
          <button
            onClick={() => setSelectedTab('paused')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedTab === 'paused'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'স্থগিত' : 'Paused'} ({pausedAdsCount})
          </button>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Listings Content */}
        <div className="p-4 sm:p-5 overflow-y-auto grow space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'বিজ্ঞাপনসমূহ লোড হচ্ছে...' : 'Loading your advertisements...'}
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTab === 'all'
                    ? (lang === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No ads posted yet')
                    : (lang === 'bn' ? `এই ক্যাটাগরিতে কোনো বিজ্ঞাপন নেই` : `No ${selectedTab} ads found`)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'আপনার ব্যবহৃত বা নতুন পণ্য বিক্রি করতে বিনামূল্যে এখনই বিজ্ঞাপন দিন।'
                    : 'Start selling today across Bangladesh by posting your advertisement for free.'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenPostAd();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'বিজ্ঞাপন পোস্ট করুন' : 'Post Ad Now'}</span>
              </button>
            </div>
          ) : (
            filteredListings.map((listing) => {
              const isActionLoading = actionLoadingId === listing.id;
              const isSold = listing.status === 'sold';
              const isPaused = listing.status === 'paused';
              const isRemoved = listing.status === 'removed_by_admin' || listing.status === 'rejected';
              const isActive = listing.status === 'active' || listing.status === 'approved';
              const primaryImage =
                listing.images && listing.images.length > 0
                  ? listing.images[0]
                  : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={listing.id}
                  className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/70 p-3 sm:p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex gap-3.5 items-start sm:items-center grow min-w-0">
                    <img
                      src={primaryImage}
                      alt={listing.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0 bg-slate-100 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="grow min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(listing.status)}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          ID: {listing.id}
                        </span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-400" />
                          {listing.views || 0} views
                        </span>
                      </div>

                      <h4
                        onClick={() => onViewListing(listing)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {listing.title}
                      </h4>

                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          ৳ {listing.price.toLocaleString('en-IN')}
                        </span>
                        {listing.isNegotiable && (
                          <span className="text-[10px] text-slate-500">
                            ({lang === 'bn' ? 'আলোচনা সাপেক্ষ' : 'Negotiable'})
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {listing.category} • {listing.area}, {listing.district}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50 justify-end">
                    {/* View Details button */}
                    <button
                      onClick={() => onViewListing(listing)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                      title="View Public Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === 'bn' ? 'ভিউ' : 'View'}</span>
                    </button>

                    {/* View Status History */}
                    <button
                      onClick={() => setViewHistoryListing(listing)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                      title="View Status History"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">{lang === 'bn' ? 'হিস্ট্রি' : 'History'}</span>
                    </button>

                    {/* Edit Ad (available for non-removed ads) */}
                    {!isRemoved && (
                      <button
                        onClick={() => setEditingListing(listing)}
                        disabled={isActionLoading}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                        title="Edit Ad"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>
                    )}

                    {/* Mark Sold or Available Again */}
                    {!isRemoved && (
                      isSold ? (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'active', 'Marked as available again by owner')}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === 'bn' ? 'পুনরায় সক্রিয় করুন' : 'Mark Available'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'sold', 'Marked as sold by owner')}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-colors flex items-center gap-1"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === 'bn' ? 'বিক্রিত চিহ্নিত করুন' : 'Mark Sold'}</span>
                        </button>
                      )
                    )}

                    {/* Pause or Reactivate */}
                    {!isRemoved && !isSold && (
                      isPaused ? (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'active', 'Reactivated by owner')}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-xs"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === 'bn' ? 'চালু করুন' : 'Reactivate'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, 'paused', 'Paused by owner')}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PauseCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{lang === 'bn' ? 'স্থগিত করুন' : 'Pause'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Ad Modal */}
      {editingListing && (
        <EditAdModal
          isOpen={Boolean(editingListing)}
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            fetchUserAds();
            setEditingListing(null);
          }}
          lang={lang}
        />
      )}

      {/* Status History Drawer / Modal */}
      {viewHistoryListing && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setViewHistoryListing(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {lang === 'bn' ? 'বিজ্ঞাপনের স্ট্যাটাস হিস্ট্রি' : 'Listing Status History'}
                </h3>
              </div>
              <button
                onClick={() => setViewHistoryListing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {viewHistoryListing.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ID: {viewHistoryListing.id} • Posted: {new Date(viewHistoryListing.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {lang === 'bn' ? 'কার্যক্রম ও পরিবর্তনের তালিকা' : 'Activity & Moderation Log'}
                </h4>
                {viewHistoryListing.statusHistory && viewHistoryListing.statusHistory.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {viewHistoryListing.statusHistory.map((item: StatusHistoryEntry, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                        <div className="bg-white dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                              {item.status}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                              {item.note}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            By: {item.changedBy === user?.uid ? 'You (Owner)' : item.changedBy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {lang === 'bn' ? 'কোনো পরিবর্তন রেকর্ড পাওয়া যায়নি।' : 'No status change history recorded.'}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-right">
              <button
                onClick={() => setViewHistoryListing(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
