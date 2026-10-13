import React, { useState, useEffect } from 'react';
import { Listing, AdminStats } from '../types';
import { formatPriceBDT } from './ListingCard';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
  LogOut,
  Eye,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  Check,
  X,
  Database,
  Cloud
} from 'lucide-react';
import { migrateListingsToFirestore } from '../services/firestoreListings';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onViewListing: (listing: Listing) => void;
  onListingUpdated: () => void;
  token: string | null;
  setToken: (token: string | null) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onViewListing,
  onListingUpdated,
  token,
  setToken
}) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalViews: 0
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Reject modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Listing does not satisfy marketplace verification rules');
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncToFirestore = async () => {
    if (!listings || listings.length === 0) return;
    setIsSyncingFirestore(true);
    setSyncMessage(null);
    try {
      const res = await migrateListingsToFirestore(listings);
      setSyncMessage(`Synced ${res.imported} new listings to Cloud Firestore (${res.skipped} already synced). All statuses preserved!`);
      setTimeout(() => setSyncMessage(null), 6000);
    } catch (err: any) {
      setActionError(`Firestore sync error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const fetchAdminData = async (currentToken: string) => {
    setIsLoadingListings(true);
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch listings
      const listRes = await fetch('/api/admin/listings', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        setListings(listData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingListings(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchAdminData(token);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      localStorage.setItem('isfadur_admin_token', data.token);
      fetchAdminData(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect administrator password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // ignore
      }
    }
    setToken(null);
    localStorage.removeItem('isfadur_admin_token');
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve listing');

      setActionSuccess(`Listing #${id} approved and is now live!`);
      setTimeout(() => setActionSuccess(''), 3000);
      fetchAdminData(token);
      onListingUpdated();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectingId) return;
    setActionError('');

    try {
      const res = await fetch(`/api/admin/listings/${rejectingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (!res.ok) throw new Error('Failed to reject listing');

      setActionSuccess(`Listing #${rejectingId} marked as rejected.`);
      setTimeout(() => setActionSuccess(''), 3000);
      setRejectingId(null);
      fetchAdminData(token);
      onListingUpdated();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to permanently delete listing #${id}?`)) {
      return;
    }
    setActionError('');

    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete listing');

      setActionSuccess(`Listing #${id} deleted permanently.`);
      setTimeout(() => setActionSuccess(''), 3000);
      fetchAdminData(token);
      onListingUpdated();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Filter listings based on tab and search
  const filteredListings = listings.filter((l) => {
    if (activeTab !== 'all' && l.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q) ||
        l.sellerPhone.includes(q) ||
        l.district.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">ISFADUR Admin Moderation Portal</h2>
              <p className="text-[11px] text-slate-400">
                Review & manage listings before they go live on Bangladesh marketplace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In Screen */}
        {!token ? (
          <div className="p-8 max-w-md mx-auto w-full text-center space-y-5">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Administrator Sign In</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative key to inspect pending submissions and moderate listings.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {loginError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>Default key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">isfadur-admin-2026</code></span>
                  <button
                    type="button"
                    onClick={() => setPassword('isfadur-admin-2026')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Use default
                  </button>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="flex flex-col grow overflow-hidden">
            {/* Cloud Firestore Status Banner */}
            <div className="bg-emerald-950 text-emerald-100 px-4 py-2.5 border-b border-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white">Cloud Firestore:</strong> Connected • Spark Free Tier ($0)
                </span>
                {syncMessage && (
                  <span className="text-emerald-300 font-semibold bg-emerald-900/60 px-2 py-0.5 rounded">
                    {syncMessage}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncToFirestore}
                disabled={isSyncingFirestore || listings.length === 0}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-2.5 py-1 rounded transition-colors shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isSyncingFirestore ? 'Syncing...' : `Sync ${listings.length} Listings to Firestore`}</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border-b border-slate-200">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Pending Review
                </div>
                <div className="text-xl font-black text-amber-600 mt-0.5">
                  {stats.pending}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Approved
                </div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">
                  {stats.approved}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Rejected Ads
                </div>
                <div className="text-xl font-black text-red-600 mt-0.5">
                  {stats.rejected}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Listings
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {stats.total}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Views
                </div>
                <div className="text-xl font-black text-slate-700 mt-0.5">
                  {stats.totalViews}
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'pending'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending ({stats.pending})</span>
                </button>

                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'approved'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved ({stats.approved})</span>
                </button>

                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'rejected'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Rejected ({stats.rejected})</span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({stats.total})
                </button>
              </div>

              {/* Search & Refresh */}
              <div className="flex items-center gap-2">
                <div className="relative grow sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search seller, title, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={() => token && fetchAdminData(token)}
                  disabled={isLoadingListings}
                  className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingListings ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {actionSuccess && (
              <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Listings table / list */}
            <div className="overflow-y-auto grow p-4 divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-sm">No listings found matching this status or query.</p>
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
                  >
                    {/* Left: Thumbnail & Main info */}
                    <div className="flex items-start gap-3 grow">
                      <img
                        src={listing.images[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=200&auto=format&fit=crop&q=80'}
                        alt={listing.title}
                        className="w-16 h-14 rounded-md object-cover border border-slate-200 shrink-0"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-900 line-clamp-1 max-w-sm">
                            {listing.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              listing.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : listing.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {listing.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-800">
                            ৳ {formatPriceBDT(listing.price)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{listing.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{listing.area}, {listing.district}</span>
                          <span aria-hidden="true">·</span>
                          <span>Seller: {listing.sellerName} ({listing.sellerPhone})</span>
                        </div>

                        {listing.rejectionReason && (
                          <div className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded inline-block">
                            Rejection note: {listing.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onViewListing(listing)}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        title="View ad preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {listing.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(listing.id)}
                          className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-md transition-colors shadow-xs"
                          title="Approve ad to go live"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {listing.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectingId(listing.id)}
                          className="flex items-center gap-1 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-md transition-colors"
                          title="Reject ad"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {rejectingId && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Listing #{rejectingId}
              </h3>
              <p className="text-xs text-slate-500">
                Provide a reason why this listing was not approved. This will be stored for audit purposes.
              </p>

              <form onSubmit={handleRejectSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingId(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
