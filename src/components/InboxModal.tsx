import React, { useState } from 'react';
import { Conversation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Language } from '../i18n/translations';
import {
  X,
  MessageSquare,
  Search,
  MapPin,
  Clock,
  Ban,
  ArrowRight
} from 'lucide-react';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  lang: Language;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  lang
}) => {
  const { user } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  // Filter conversations by search term
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const isSeller = user?.uid === c.sellerUid;
    const counterpartName = isSeller ? c.buyerName : c.sellerName;
    return (
      counterpartName.toLowerCase().includes(term) ||
      c.listingTitle.toLowerCase().includes(term) ||
      c.lastMessage.toLowerCase().includes(term)
    );
  });

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
      if (diffMins < 60) return `${diffMins}${lang === 'bn' ? ' মি. আগে' : 'm ago'}`;
      if (diffHours < 24) return `${diffHours}${lang === 'bn' ? ' ঘণ্টা আগে' : 'h ago'}`;
      if (diffDays === 1) return lang === 'bn' ? 'গতকাল' : 'Yesterday';
      if (diffDays < 7) return `${diffDays}${lang === 'bn' ? ' দিন আগে' : 'd ago'}`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg h-[86vh] max-h-[680px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'বার্তা ও ইনবক্স' : 'Messages'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {conversations.length}{' '}
                {lang === 'bn' ? 'টি সক্রিয় কথোপকথন' : 'active conversations'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH FILTER */}
        {conversations.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={lang === 'bn' ? 'চ্যাট বা ব্যবহারকারী খুঁজুন...' : 'Search conversations...'}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* CONVERSATION LIST */}
        <div className="grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'bn' ? 'কোনো বার্তা নেই' : 'No Messages Yet'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-5">
                {lang === 'bn'
                  ? 'মার্কেটপ্লেসের বিজ্ঞাপনে ক্লিক করে "Chat with Seller" বাটনে চাপ দিলে এখানে কথোপকথন যুক্ত হবে।'
                  : 'Start chatting with sellers directly from any listing details page to inquire about items.'}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {lang === 'bn' ? 'বিজ্ঞাপন ব্রাউজ করুন' : 'Browse Listings'}
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {lang === 'bn' ? 'কোনো কথোপকথন পাওয়া যায়নি।' : 'No matching conversations found.'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSeller = user?.uid === conv.sellerUid;
              const counterpartName = isSeller ? conv.buyerName : conv.sellerName;
              const unreadCount = user?.uid && conv.unreadCount ? conv.unreadCount[user.uid] || 0 : 0;
              const isBlocked = conv.blockedBy && conv.blockedBy.length > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    unreadCount > 0 ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {/* Thumbnail / Avatar */}
                  <div className="relative shrink-0">
                    {conv.listingImage ? (
                      <img
                        src={conv.listingImage}
                        alt={conv.listingTitle}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-base">
                        {counterpartName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="grow min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {counterpartName}
                        </span>
                        <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                          {isSeller ? (lang === 'bn' ? 'ক্রেতা' : 'Buyer') : (lang === 'bn' ? 'বিক্রেতা' : 'Seller')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>

                    {/* Listing title & price */}
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                      {conv.listingTitle} · <span className="font-bold text-emerald-600 dark:text-emerald-400">৳ {conv.listingPrice.toLocaleString('en-IN')}</span>
                    </p>

                    {/* Last message preview */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`text-xs truncate ${
                          unreadCount > 0
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {conv.lastSenderUid === user?.uid && (
                          <span className="text-slate-400 dark:text-slate-500 mr-1">
                            {lang === 'bn' ? 'আপনি:' : 'You:'}
                          </span>
                        )}
                        {conv.lastMessage || (lang === 'bn' ? 'কথোপকথন শুরু হয়েছে' : 'Conversation started')}
                      </p>

                      {isBlocked && (
                        <span className="shrink-0 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <Ban className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'ব্লক' : 'Blocked'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center hidden sm:block" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
