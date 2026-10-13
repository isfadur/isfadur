import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Shield,
  ShieldCheck,
  Sun,
  Moon,
  Share2,
  X,
  User,
  Package,
  LogOut,
  ChevronDown,
  MessageSquare,
  Heart,
  MapPin
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Language, translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenPostAd: () => void;
  onOpenAdmin: () => void;
  onOpenShare: () => void;
  onOpenFilter: () => void;
  onOpenAuth: () => void;
  onOpenMyAds: () => void;
  onOpenProfile: () => void;
  onOpenInbox: () => void;
  unreadMessagesCount?: number;
  onOpenSavedAds?: () => void;
  savedAdsCount?: number;
  onOpenLocationSelector?: () => void;
  selectedDistrict?: string;
  selectedArea?: string;
  isAdminLoggedIn: boolean;
  onGoHome: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  activeFilterCount: number;
  lang: Language;
  onToggleLanguage: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPostAd,
  onOpenAdmin,
  onOpenShare,
  onOpenFilter,
  onOpenAuth,
  onOpenMyAds,
  onOpenProfile,
  onOpenInbox,
  unreadMessagesCount = 0,
  onOpenSavedAds,
  savedAdsCount = 0,
  onOpenLocationSelector,
  selectedDistrict = 'All',
  selectedArea = 'All',
  isAdminLoggedIn,
  onGoHome,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  activeFilterCount,
  lang,
  onToggleLanguage,
  isDarkTheme,
  onToggleTheme,
}) => {
  const t = translations[lang];
  const { user, profile, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePostAdClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenPostAd();
    }
  };

  const handleMessagesClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenInbox();
    }
  };

  const handleSavedAdsClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onOpenSavedAds?.();
    }
  };

  const userInitial = (profile?.displayName || user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* DESKTOP HEADER (Single Row ~60px) */}
        <div className="hidden md:flex items-center justify-between h-15 gap-4">
          {/* Left: Brand Typography Logo */}
          <div
            className="cursor-pointer shrink-0 py-1"
            onClick={onGoHome}
            title="Isfadur - Discover. Connect. Trade."
          >
            <BrandLogo isDark={isDarkTheme} size="xs" showTagline={true} lang={lang} />
          </div>

          {/* Center: Wide Search Input + Filter Button */}
          <div className="grow max-w-2xl flex items-center gap-2">
            {/* Location Selector Button (Desktop) */}
            {onOpenLocationSelector && (
              <button
                type="button"
                onClick={onOpenLocationSelector}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                title={lang === 'bn' ? 'লোকেশন পরিবর্তন করুন' : 'Change Location'}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="max-w-[110px] truncate">
                  {selectedDistrict && selectedDistrict !== 'All'
                    ? (selectedArea && selectedArea !== 'All' ? `${selectedArea}, ${selectedDistrict}` : selectedDistrict)
                    : (lang === 'bn' ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            )}

            <form onSubmit={onSearchSubmit} className="relative grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Filter Button with active counter badge */}
            <button
              type="button"
              onClick={onOpenFilter}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                activeFilterCount > 0
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={t.filterTitle}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.filter}</span>
              {activeFilterCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Right: Controls, User Account & Post Ad CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher (BN | EN) */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center justify-center px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Toggle Language (বাংলা / English)"
            >
              <span className={lang === 'bn' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-60'}>
                BN
              </span>
              <span className="opacity-40 mx-1">|</span>
              <span className={lang === 'en' ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-60'}>
                EN
              </span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkTheme ? t.themeLight : t.themeDark}
              aria-label="Toggle theme"
            >
              {isDarkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Saved Ads Button (SavedAdsModal) */}
            <button
              onClick={handleSavedAdsClick}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={lang === 'bn' ? 'সংরক্ষিত বিজ্ঞাপন' : 'Saved Ads'}
            >
              <Heart className="w-4 h-4" />
              {savedAdsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {savedAdsCount > 9 ? '9+' : savedAdsCount}
                </span>
              )}
            </button>

            {/* Messages Button (InboxModal) */}
            <button
              onClick={handleMessagesClick}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={lang === 'bn' ? 'বার্তা ও ইনবক্স' : 'Messages'}
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Share Marketplace */}
            <button
              onClick={onOpenShare}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t.share}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* USER AUTH & ACCOUNT SECTION */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {userInitial}
                  </div>
                  <span className="text-xs font-semibold max-w-[90px] truncate">
                    {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-750">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {profile?.displayName || user.displayName || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenInbox();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-between font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'bn' ? 'বার্তা ও ইনবক্স' : 'Messages'}</span>
                      </div>
                      {unreadMessagesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSavedAds?.();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-between font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>{lang === 'bn' ? 'সংরক্ষিত বিজ্ঞাপন' : 'Saved Ads'}</span>
                      </div>
                      {savedAdsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                          {savedAdsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenMyAds();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2 font-medium"
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'bn' ? 'আমার বিজ্ঞাপন (My Ads)' : 'My Ads'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{lang === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2 font-medium"
                    >
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>{isAdminLoggedIn ? t.adminMode : t.admin}</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-750" />

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
                </button>

                {/* Admin button for admins */}
                <button
                  onClick={onOpenAdmin}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    isAdminLoggedIn
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title={isAdminLoggedIn ? t.adminMode : t.admin}
                >
                  {isAdminLoggedIn ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Post Ad Primary CTA */}
            <button
              onClick={handlePostAdClick}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t.postAd}</span>
            </button>
          </div>
        </div>

        {/* MOBILE HEADER (Two Slim Rows) */}
        <div className="md:hidden py-2 space-y-2">
          {/* Row 1: Logo + Language + Theme + User + Compact Post Ad */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="cursor-pointer shrink-0"
              onClick={onGoHome}
              title="Isfadur"
            >
              <BrandLogo isDark={isDarkTheme} size="xs" showTagline={false} lang={lang} />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Switch */}
              <button
                onClick={onToggleLanguage}
                className="px-1.5 py-1 text-[11px] font-bold rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                {lang === 'bn' ? 'EN' : 'বাংলা'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className="p-1.5 text-slate-500 dark:text-slate-400 rounded"
                aria-label="Toggle theme"
              >
                {isDarkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Saved Ads Button Mobile */}
              <button
                onClick={handleSavedAdsClick}
                className="relative p-1.5 text-slate-500 dark:text-slate-400 rounded"
                title={lang === 'bn' ? 'সংরক্ষিত বিজ্ঞাপন' : 'Saved Ads'}
              >
                <Heart className="w-4 h-4" />
                {savedAdsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Messages Button Mobile */}
              <button
                onClick={handleMessagesClick}
                className="relative p-1.5 text-slate-500 dark:text-slate-400 rounded"
                title={lang === 'bn' ? 'বার্তা' : 'Messages'}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Share Button Mobile */}
              <button
                onClick={onOpenShare}
                className="p-1.5 text-slate-500 dark:text-slate-400 rounded"
                title={t.share}
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* User Account / My Ads Mobile */}
              {user ? (
                <button
                  onClick={onOpenMyAds}
                  className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                  title="My Ads & Profile"
                >
                  {userInitial}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="p-1.5 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  title="Login"
                >
                  <User className="w-4 h-4" />
                </button>
              )}

              {/* Compact Post Ad Button */}
              <button
                onClick={handlePostAdClick}
                className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>{lang === 'bn' ? 'পোস্ট' : 'Post'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Search Input + Compact Filter Button */}
          <div className="flex items-center gap-2">
            <form onSubmit={onSearchSubmit} className="relative grow">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            {onOpenLocationSelector && (
              <button
                type="button"
                onClick={onOpenLocationSelector}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                title={lang === 'bn' ? 'লোকেশন নির্বাচন' : 'Location'}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="max-w-[70px] truncate text-[11px]">
                  {selectedDistrict && selectedDistrict !== 'All' ? selectedDistrict : (lang === 'bn' ? 'বাংলাদেশ' : 'All BD')}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenFilter}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                activeFilterCount > 0
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.filter}</span>
              {activeFilterCount > 0 && (
                <span className="bg-emerald-600 text-white text-[9px] px-1 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
