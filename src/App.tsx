import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Listing, CategoryItem, ListingsResponse, Conversation } from './types';
import { Navbar } from './components/Navbar';
import { FilterDrawer, FilterState } from './components/FilterDrawer';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { PostAdModal } from './components/PostAdModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { InfoModal, InfoModalType } from './components/InfoModals';
import { ShareModal } from './components/ShareModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { MyAdsModal } from './components/MyAdsModal';
import { InboxModal } from './components/InboxModal';
import { ChatModal } from './components/ChatModal';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { SavedAdsModal } from './components/SavedAdsModal';
import { HomepageCarousel } from './components/HomepageCarousel';
import { useAuth } from './context/AuthContext';
import { subscribeUserConversations, getOrCreateConversation } from './services/firestoreChat';
import {
  fetchUserFavorites,
  toggleFavorite,
  fetchSavedListings
} from './services/favoritesService';
import { Language, translations, getCategoryName, getConditionName } from './i18n/translations';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Search,
  Store,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MapPin,
  Heart
} from 'lucide-react';

export default function App() {
  // View mode state (Grid vs List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('isfadur_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('isfadur_view_mode', mode);
  };

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    return localStorage.getItem('isfadur_theme') === 'dark';
  });

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('isfadur_lang') as Language) || 'en';
  });

  const t = translations[lang];

  // Apply dark mode class to document element
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('isfadur_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('isfadur_theme', 'light');
    }
  }, [isDarkTheme]);

  const handleToggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  const handleToggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    localStorage.setItem('isfadur_lang', nextLang);
  };

  // Filter & Search states
  const [filterState, setFilterState] = useState<FilterState>({
    category: 'All',
    district: 'All',
    area: 'All',
    minPrice: '',
    maxPrice: '',
    condition: 'All',
    sortBy: 'latest',
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalListings, setTotalListings] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categoryCounts, setCategoryCounts] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User Auth & Modals
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalNotice, setAuthModalNotice] = useState<{ title?: string; message?: string } | null>(null);
  const [isMyAdsModalOpen, setIsMyAdsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // In-App Chat & Messaging states (Phase 3)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(false);
  const [activeChatConversation, setActiveChatConversation] = useState<Conversation | null>(null);

  // Location selector state (Phase 4)
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState<boolean>(false);

  // Favorites state (Phase 4)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('isfadur_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [isSavedAdsOpen, setIsSavedAdsOpen] = useState<boolean>(false);
  const [savedListingObjects, setSavedListingObjects] = useState<Listing[]>([]);
  const [pendingSaveListingId, setPendingSaveListingId] = useState<string | null>(null);

  // Sync favorites with Firestore and backend on user change
  useEffect(() => {
    if (user?.uid) {
      fetchUserFavorites(user.uid)
        .then((favIds) => {
          setFavorites(favIds);
          if (favIds.length > 0) {
            fetchSavedListings(user.uid, favIds).then(setSavedListingObjects);
          }
        })
        .catch((err) => console.warn('Could not sync user favorites:', err));
    }
  }, [user?.uid]);

  const handleSelectLocation = (district: string, area: string) => {
    setFilterState((prev) => ({ ...prev, district, area }));
    setCurrentPage(1);
    localStorage.setItem('isfadur_location_district', district);
    localStorage.setItem('isfadur_location_area', area);
  };

  const handleToggleFavorite = async (listingId: string) => {
    if (!user) {
      setPendingSaveListingId(listingId);
      setAuthModalNotice({
        title: lang === 'bn' ? 'বিজ্ঞাপন সেভ করতে লগইন প্রয়োজন' : 'Login Required to Save Ads',
        message:
          lang === 'bn'
            ? 'আপনার পছন্দের বিজ্ঞাপনগুলো আপনার অ্যাকাউন্টে সুরক্ষিতভাবে সেভ করে রাখতে অনুগ্রহ করে লগইন করুন।'
            : 'Please log in or register to save your favorite advertisements to your account and access them anytime.'
      });
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const { favorites: nextFavs } = await toggleFavorite(user.uid, listingId);
      setFavorites(nextFavs);
      fetchSavedListings(user.uid, nextFavs).then(setSavedListingObjects);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleOpenSavedAds = () => {
    if (!user) {
      setAuthModalNotice({
        title: lang === 'bn' ? 'সংরক্ষিত বিজ্ঞাপন দেখতে লগইন প্রয়োজন' : 'Login Required to View Saved Ads',
        message:
          lang === 'bn'
            ? 'আপনার অ্যাকাউন্টে সংরক্ষিত বিজ্ঞাপনসমূহ দেখতে অনুগ্রহ করে লগইন করুন।'
            : 'Please log in or register to view and manage your saved advertisements.'
      });
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    } else {
      fetchSavedListings(user.uid, favorites).then(setSavedListingObjects);
      setIsSavedAdsOpen(true);
    }
  };

  // Subscribe to user conversations
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      return;
    }
    const unsubscribe = subscribeUserConversations(user.uid, (convs) => {
      setConversations(convs);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Unread messages count for logged-in user
  const unreadMessagesCount = useMemo(() => {
    if (!user?.uid || !conversations.length) return 0;
    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCount?.[user.uid] || 0);
    }, 0);
  }, [user?.uid, conversations]);

  const handleStartChatForListing = async (item: Listing) => {
    if (!user) {
      setAuthModalNotice({
        title: lang === 'bn' ? 'চ্যাট করতে লগইন প্রয়োজন' : 'Login Required to Chat',
        message:
          lang === 'bn'
            ? 'বিক্রেতার সাথে ইন-অ্যাপ মেসেজে সরাসরি কথা বলতে অনুগ্রহ করে লগইন করুন।'
            : 'Please log in or create an account to start an in-app conversation with the seller.'
      });
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (user.uid === item.ownerUid) {
      setIsMyAdsModalOpen(true);
      setActiveListing(null);
      return;
    }

    try {
      const conv = await getOrCreateConversation(
        item,
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Buyer'
      );
      setActiveChatConversation(conv);
      setActiveListing(null);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      alert(err.message || 'Could not start conversation');
    }
  };

  // Modals & Views
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [isPostAdOpen, setIsPostAdOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isPromoBannerVisible, setIsPromoBannerVisible] = useState<boolean>(() => {
    return localStorage.getItem('isfadur_promo_banner') !== 'dismissed';
  });

  const handleOpenPostAd = () => {
    if (!user) {
      setAuthModalNotice({
        title: lang === 'bn' ? 'বিজ্ঞাপন দিতে লগইন প্রয়োজন' : 'Login Required to Post an Ad',
        message:
          lang === 'bn'
            ? 'Isfadur মার্কেটপ্লেসে বিনামূল্যে বিজ্ঞাপন পোস্ট করতে এবং পরবর্তীতে এডিট বা স্ট্যাটাস আপডেট করতে অনুগ্রহ করে লগইন করুন।'
            : 'Please log in or create a free account to publish your ad and manage its status anytime.',
      });
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    } else {
      setIsPostAdOpen(true);
    }
  };

  const [shareData, setShareData] = useState<{
    isOpen: boolean;
    title: string;
    text?: string;
    url?: string;
  }>({
    isOpen: false,
    title: '',
    text: '',
    url: ''
  });

  // Admin Auth state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('isfadur_admin_token');
  });

  // Fetch category counts
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoryCounts(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch listings with query params
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterState.category && filterState.category !== 'All') {
        params.append('category', filterState.category);
      }
      if (filterState.district && filterState.district !== 'All') {
        params.append('district', filterState.district);
      }
      if (filterState.area && filterState.area !== 'All') {
        params.append('area', filterState.area);
      }
      if (filterState.condition && filterState.condition !== 'All') {
        params.append('condition', filterState.condition);
      }
      if (filterState.minPrice && filterState.minPrice.trim() !== '') {
        params.append('minPrice', filterState.minPrice.trim());
      }
      if (filterState.maxPrice && filterState.maxPrice.trim() !== '') {
        params.append('maxPrice', filterState.maxPrice.trim());
      }
      if (activeSearch) {
        params.append('q', activeSearch);
      }
      if (filterState.sortBy) {
        params.append('sort', filterState.sortBy);
      }
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch advertisements');
      }

      const data: ListingsResponse = await res.json();
      setListings(data.listings || []);
      setTotalListings(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  }, [filterState, activeSearch, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle search submit from header
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterState({
      category: 'All',
      district: 'All',
      area: 'All',
      minPrice: '',
      maxPrice: '',
      condition: 'All',
      sortBy: 'latest',
    });
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  const handleApplyDrawerFilters = (newFilters: FilterState) => {
    setFilterState(newFilters);
    setCurrentPage(1);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.category !== 'All') count++;
    if (filterState.district !== 'All') count++;
    if (filterState.area !== 'All') count++;
    if (filterState.minPrice.trim() !== '') count++;
    if (filterState.maxPrice.trim() !== '') count++;
    if (filterState.condition !== 'All') count++;
    if (filterState.sortBy !== 'latest') count++;
    return count;
  }, [filterState]);

  // Secondary section: Local Businesses & Services
  const localServicesListings = useMemo(() => {
    return listings.filter(
      (l) => l.category === 'Services' || l.category === 'Local Businesses'
    );
  }, [listings]);

  const handlePostAdSuccess = (newListingId: string) => {
    setBannerNotice(
      lang === 'bn'
        ? `আপনার বিজ্ঞাপন (আইডি: ${newListingId}) সফলভাবে জমা হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে!`
        : `Your ad (ID: ${newListingId}) was submitted successfully and is pending administrator review!`
    );
    fetchCategories();
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors`}>
      {/* Top Notice Banner if ad submitted */}
      {bannerNotice && (
        <div className="bg-emerald-700 text-white text-xs py-2.5 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>{bannerNotice}</span>
            </div>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-emerald-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Compact Header (Single row on desktop, 2 slim rows on mobile) */}
      <Navbar
        onOpenPostAd={handleOpenPostAd}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShare={() => {
          setShareData({
            isOpen: true,
            title: 'Isfadur - Bangladesh Marketplace',
            text: t.brandTagline,
            url: window.location.origin
          });
        }}
        onOpenFilter={() => setIsFilterDrawerOpen(true)}
        onOpenAuth={() => {
          setAuthModalNotice(null);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenMyAds={() => {
          if (user) {
            setIsMyAdsModalOpen(true);
          } else {
            setAuthModalNotice({
              title: lang === 'bn' ? 'লগইন প্রয়োজন' : 'Login Required',
              message:
                lang === 'bn'
                  ? 'আপনার বিজ্ঞাপনসমূহ দেখতে ও পরিচালনা করতে অনুগ্রহ করে একাউন্টে লগইন করুন।'
                  : 'Please log in to view and manage your advertisements.',
            });
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }
        }}
        onOpenProfile={() => {
          if (user) {
            setIsProfileModalOpen(true);
          } else {
            setAuthModalNotice(null);
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }
        }}
        onOpenInbox={() => {
          if (user) {
            setIsInboxOpen(true);
          } else {
            setAuthModalNotice({
              title: lang === 'bn' ? 'ইনবক্স দেখতে লগইন প্রয়োজন' : 'Login to View Messages',
              message:
                lang === 'bn'
                  ? 'আপনার বার্তা ও ইনবক্স দেখতে অনুগ্রহ করে লগইন করুন।'
                  : 'Please log in or create an account to view and send in-app messages.'
            });
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }
        }}
        unreadMessagesCount={unreadMessagesCount}
        onOpenSavedAds={handleOpenSavedAds}
        savedAdsCount={favorites.length}
        onOpenLocationSelector={() => setIsLocationSelectorOpen(true)}
        selectedDistrict={filterState.district}
        selectedArea={filterState.area}
        isAdminLoggedIn={Boolean(adminToken)}
        onGoHome={handleResetFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        activeFilterCount={activeFilterCount}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        isDarkTheme={isDarkTheme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Responsive Highlights Carousel Banner (Compact, Accessible, Genuine Messaging) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 w-full">
        <HomepageCarousel
          onPostAd={handleOpenPostAd}
          onOpenLocation={() => setIsLocationSelectorOpen(true)}
          onOpenInbox={() => {
            if (user) {
              setIsInboxOpen(true);
            } else {
              setAuthModalNotice({
                title: lang === 'bn' ? 'ইনবক্স দেখতে লগইন প্রয়োজন' : 'Login to View Messages',
                message:
                  lang === 'bn'
                    ? 'আপনার বার্তা ও ইনবক্স দেখতে অনুগ্রহ করে লগইন করুন।'
                    : 'Please log in or create an account to view and send in-app messages.'
              });
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }
          }}
          onBrowse={() => {
            const el = document.getElementById('marketplace-listings-heading');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          lang={lang}
        />
      </div>

      {/* Main Content Area - Starts directly below compact carousel */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-1 pb-12 grow w-full">
        {/* Clean 1-line section header (without legacy announcements or counts) */}
        <div id="marketplace-listings-heading" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {filterState.category === 'All'
                  ? (lang === 'bn' ? 'মার্কেটপ্লেস বিজ্ঞাপন' : 'Marketplace Listings')
                  : getCategoryName(filterState.category, lang)}
              </h1>
              {filterState.district !== 'All' && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'bn'
                    ? `— ${filterState.district}${filterState.area !== 'All' ? ` (${filterState.area})` : ''}`
                    : `in ${filterState.district}${filterState.area !== 'All' ? ` (${filterState.area})` : ''}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto flex-wrap">
            {/* Quick Location Selector */}
            <button
              type="button"
              onClick={() => setIsLocationSelectorOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'লোকেশন পরিবর্তন' : 'Change Location'}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[120px] truncate">
                {filterState.district !== 'All'
                  ? (filterState.area !== 'All' ? `${filterState.area}, ${filterState.district}` : filterState.district)
                  : (lang === 'bn' ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh')}
              </span>
            </button>
            {/* Short 1-line welcome slogan */}
            <span className="hidden lg:inline text-xs font-medium text-slate-400 dark:text-slate-500 italic">
              {t.welcomeTagline}
            </span>

            {/* List / Grid View Toggle Button */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={lang === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={lang === 'bn' ? 'লিস্ট ভিউ' : 'List View'}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Filter Drawer Open button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.filters}</span>
              {activeFilterCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Pill Bar (Visible when any filter or search is active) */}
        {(activeFilterCount > 0 || activeSearch) && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {t.activeFilters}
            </span>

            {/* Category tag */}
            {filterState.category !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>{getCategoryName(filterState.category, lang)}</span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, category: 'All' }))}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                  title="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* District tag */}
            {filterState.district !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>{filterState.district}</span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, district: 'All', area: 'All' }))}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Area tag */}
            {filterState.area !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>{filterState.area}</span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, area: 'All' }))}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Price range tag */}
            {(filterState.minPrice.trim() !== '' || filterState.maxPrice.trim() !== '') && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>
                  ৳{filterState.minPrice || '0'} - ৳{filterState.maxPrice || '∞'}
                </span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, minPrice: '', maxPrice: '' }))}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Condition tag */}
            {filterState.condition !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>{getConditionName(filterState.condition, lang)}</span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, condition: 'All' }))}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Active search query tag */}
            {activeSearch && (
              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                <span>"{activeSearch}"</span>
                <button
                  onClick={handleClearSearch}
                  className="hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Reset All */}
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline ml-1"
            >
              {t.resetAll}
            </button>
          </div>
        )}

        {/* 2. Responsive Listings (Grid View vs List View) */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 h-64 sm:h-72 animate-pulse flex flex-col justify-between"
                >
                  <div className="w-full aspect-4/3 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2" />
                  <div className="space-y-1.5">
                    <div className="w-1/3 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-4/5 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded mt-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 animate-pulse flex gap-3"
                >
                  <div className="w-32 sm:w-48 h-full bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                  <div className="grow space-y-2 py-1">
                    <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : error ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 max-w-lg mx-auto">
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={fetchListings}
              className="mt-3 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t.noAdsFound}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t.noAdsSubtext}
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t.clearFilters}
              </button>
              <button
                onClick={handleOpenPostAd}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                {t.postAd}
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={(item) => setActiveListing(item)}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={handleToggleFavorite}
                onShare={(item) => {
                  setShareData({
                    isOpen: true,
                    title: `${item.title} - ৳ ${item.price.toLocaleString('en-IN')}`,
                    text: `Check out this ${getCategoryName(item.category, lang)} listing in ${item.area}, ${item.district} on Isfadur:`,
                    url: `${window.location.origin}/#ad-${item.id}`
                  });
                }}
                lang={lang}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={(item) => setActiveListing(item)}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={handleToggleFavorite}
                onShare={(item) => {
                  setShareData({
                    isOpen: true,
                    title: `${item.title} - ৳ ${item.price.toLocaleString('en-IN')}`,
                    text: `Check out this ${getCategoryName(item.category, lang)} listing in ${item.area}, ${item.district} on Isfadur:`,
                    url: `${window.location.origin}/#ad-${item.id}`
                  });
                }}
                lang={lang}
                viewMode="list"
              />
            ))}
          </div>
        )}

        {/* Functional Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. Secondary Section: Local Businesses & Services in Bangladesh */}
        {localServicesListings.length > 0 && filterState.category === 'All' && !activeSearch && (
          <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t.localBusinessesTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  setFilterState((prev) => ({ ...prev, category: 'Services' }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {lang === 'bn' ? 'সব দেখুন →' : 'View all →'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {localServicesListings.slice(0, 4).map((item) => (
                <ListingCard
                  key={`service-${item.id}`}
                  listing={item}
                  onClick={(l) => setActiveListing(l)}
                  onShare={(l) => {
                    setShareData({
                      isOpen: true,
                      title: `${l.title} - ৳ ${l.price}`,
                      text: `Check out on Isfadur:`,
                      url: `${window.location.origin}/#ad-${l.id}`
                    });
                  }}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenInfo={(type) => setActiveInfoModal(type)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        lang={lang}
        isDark={isDarkTheme}
      />

      {/* Modals & Drawers */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filterState}
        onApplyFilters={handleApplyDrawerFilters}
        onResetFilters={handleResetFilters}
        categoryCounts={categoryCounts}
        lang={lang}
      />

      <ListingDetailModal
        listing={activeListing}
        onClose={() => setActiveListing(null)}
        onCategoryClick={(cat) => {
          setFilterState((prev) => ({ ...prev, category: cat }));
          setCurrentPage(1);
        }}
        onOpenShare={(item) => {
          setShareData({
            isOpen: true,
            title: `${item.title} - ৳ ${item.price.toLocaleString('en-IN')}`,
            text: `Check out this listing in ${item.area}, ${item.district} on Isfadur:`,
            url: `${window.location.origin}/#ad-${item.id}`
          });
        }}
        onStartChat={handleStartChatForListing}
        onOpenMyAds={() => {
          setActiveListing(null);
          setIsMyAdsModalOpen(true);
        }}
        onOpenAuth={(notice) => {
          setAuthModalNotice(notice || null);
          setIsAuthModalOpen(true);
        }}
        isFavorite={activeListing ? favorites.includes(activeListing.id) : false}
        onToggleFavorite={handleToggleFavorite}
        lang={lang}
      />

      {/* In-App Chat & Messaging Modals (Phase 3) */}
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        conversations={conversations}
        onSelectConversation={(conv) => {
          setIsInboxOpen(false);
          setActiveChatConversation(conv);
        }}
        lang={lang}
      />

      <ChatModal
        isOpen={Boolean(activeChatConversation)}
        onClose={() => setActiveChatConversation(null)}
        conversation={activeChatConversation}
        onBackToInbox={() => {
          setActiveChatConversation(null);
          setIsInboxOpen(true);
        }}
        onViewListing={(listingId) => {
          const found = listings.find((l) => l.id === listingId);
          if (found) {
            setActiveListing(found);
            setActiveChatConversation(null);
          }
        }}
        lang={lang}
      />

      <PostAdModal
        isOpen={isPostAdOpen}
        onClose={() => setIsPostAdOpen(false)}
        onSuccess={handlePostAdSuccess}
        lang={lang}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalNotice(null);
        }}
        initialMode={authModalMode}
        customTitle={authModalNotice?.title}
        customMessage={authModalNotice?.message}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setAuthModalNotice(null);
          // If user was trying to save a listing, save it now!
          if (pendingSaveListingId && user?.uid) {
            handleToggleFavorite(pendingSaveListingId);
            setPendingSaveListingId(null);
          }
          // If user was trying to post an ad, open PostAd modal now
          if (authModalNotice?.title?.includes('Post') || authModalNotice?.title?.includes('বিজ্ঞাপন')) {
            setIsPostAdOpen(true);
          }
        }}
        lang={lang}
      />

      {/* Location Selector Modal (Phase 4) */}
      <LocationSelectorModal
        isOpen={isLocationSelectorOpen}
        onClose={() => setIsLocationSelectorOpen(false)}
        selectedDistrict={filterState.district}
        selectedArea={filterState.area}
        onSelectLocation={handleSelectLocation}
        lang={lang}
      />

      {/* Saved / Favorites Modal (Phase 4) */}
      <SavedAdsModal
        isOpen={isSavedAdsOpen}
        onClose={() => setIsSavedAdsOpen(false)}
        savedListings={savedListingObjects}
        onRemoveFavorite={(listingId) => handleToggleFavorite(listingId)}
        onViewListing={(item) => setActiveListing(item)}
        onStartChat={handleStartChatForListing}
        onExploreMarketplace={() => {
          setIsSavedAdsOpen(false);
          const el = document.getElementById('marketplace-listings-heading');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        lang={lang}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenMyAds={() => setIsMyAdsModalOpen(true)}
        lang={lang}
      />

      <MyAdsModal
        isOpen={isMyAdsModalOpen}
        onClose={() => {
          setIsMyAdsModalOpen(false);
          fetchListings();
        }}
        onOpenPostAd={() => setIsPostAdOpen(true)}
        onViewListing={(item) => setActiveListing(item)}
        lang={lang}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onViewListing={(item) => {
          setActiveListing(item);
        }}
        onListingUpdated={() => {
          fetchListings();
          fetchCategories();
        }}
        token={adminToken}
        setToken={setAdminToken}
      />

      <InfoModal
        type={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
      />

      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        title={shareData.title}
        text={shareData.text}
        url={shareData.url}
        lang={lang}
      />
    </div>
  );
}
