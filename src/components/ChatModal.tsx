import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  blockUser,
  unblockUser,
  reportAbuse
} from '../services/firestoreChat';
import { Language } from '../i18n/translations';
import {
  X,
  Send,
  ArrowLeft,
  ShieldAlert,
  Ban,
  Unlock,
  Check,
  MapPin,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onBackToInbox?: () => void;
  onViewListing?: (listingId: string) => void;
  lang: Language;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onBackToInbox,
  onViewListing,
  lang
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);

  // Report modal states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam / Scams');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine counterpart info
  const isSeller = user?.uid === conversation?.sellerUid;
  const counterpartName = isSeller
    ? conversation?.buyerName || 'Buyer'
    : conversation?.sellerName || 'Seller';
  const counterpartUid = isSeller
    ? conversation?.buyerUid || ''
    : conversation?.sellerUid || '';

  // Blocked status check
  useEffect(() => {
    if (!conversation || !user) return;
    const blockedList = conversation.blockedBy || [];
    setIsBlocked(blockedList.length > 0);
    setIsBlockedByMe(blockedList.includes(user.uid));
  }, [conversation, user]);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!isOpen || !conversation?.id) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeConversationMessages(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
      },
      (err) => {
        console.error('Messages sync error:', err);
      }
    );

    // Mark conversation read
    if (user?.uid) {
      markConversationAsRead(conversation.id, user.uid);
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen, conversation?.id, user?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current && !isBlocked) {
      inputRef.current.focus();
    }
  }, [isOpen, isBlocked]);

  if (!isOpen || !conversation) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !inputText.trim() || isSending || isBlocked) return;

    const text = inputText.trim();
    if (text.length > 1000) {
      setErrorNotice(lang === 'bn' ? 'বার্তা ১০০০ অক্ষরের কম হতে হবে' : 'Message cannot exceed 1000 characters');
      return;
    }

    setIsSending(true);
    setErrorNotice(null);

    try {
      await sendChatMessage({
        conversationId: conversation.id,
        senderUid: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Member',
        recipientUid: counterpartUid,
        text
      });
      setInputText('');
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !conversation) return;
    try {
      if (isBlockedByMe) {
        await unblockUser(conversation.id, user.uid);
        setIsBlockedByMe(false);
        setIsBlocked(false);
      } else {
        const confirmed = window.confirm(
          lang === 'bn'
            ? 'আপনি কি এই ব্যবহারকারীকে ব্লক করতে চান? তিনি আর আপনাকে মেসেজ দিতে পারবেন না।'
            : 'Are you sure you want to block this user? They will not be able to message you.'
        );
        if (confirmed) {
          await blockUser(conversation.id, user.uid);
          setIsBlockedByMe(true);
          setIsBlocked(true);
        }
      }
    } catch (err) {
      console.error('Failed to change block status:', err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversation) return;
    setIsSubmittingReport(true);
    try {
      await reportAbuse({
        conversationId: conversation.id,
        reporterUid: user.uid,
        reportedUid: counterpartUid,
        reason: reportReason,
        details: reportDetails
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportDetails('');
      }, 1500);
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl h-[92vh] sm:h-[84vh] max-h-[760px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToInbox && (
              <button
                onClick={onBackToInbox}
                className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={lang === 'bn' ? 'ইনবক্সে ফিরুন' : 'Back to Inbox'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {counterpartName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {counterpartName}
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {isSeller ? (lang === 'bn' ? 'ক্রেতা' : 'Buyer') : (lang === 'bn' ? 'বিক্রেতা' : 'Seller')}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {lang === 'bn' ? 'ইশফাদুর চ্যাটে সক্রিয়' : 'Active on Isfadur Chat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Block action */}
            <button
              onClick={handleToggleBlock}
              className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                isBlockedByMe
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isBlockedByMe ? 'Unblock User' : 'Block User'}
            >
              {isBlockedByMe ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            </button>

            {/* Report action */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={lang === 'bn' ? 'রিপোর্ট করুন' : 'Report Conversation'}
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LISTING CONTEXT CARD */}
        <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {conversation.listingImage ? (
              <img
                src={conversation.listingImage}
                alt={conversation.listingTitle}
                className="w-11 h-11 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {conversation.listingTitle}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ৳ {conversation.listingPrice.toLocaleString('en-IN')}
                </span>
                {(conversation.listingArea || conversation.listingDistrict) && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {conversation.listingArea || conversation.listingDistrict}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onViewListing && (
            <button
              onClick={() => onViewListing(conversation.listingId)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <span>{lang === 'bn' ? 'বিজ্ঞাপন দেখুন' : 'View Ad'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* BLOCK NOTICE BANNER */}
        {isBlocked && (
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {isBlockedByMe
                ? (lang === 'bn' ? 'আপনি এই ব্যবহারকারীকে ব্লক করেছেন।' : 'You have blocked this user.')
                : (lang === 'bn' ? 'এই কথোপকথনটি বর্তমানে ব্লক করা রয়েছে।' : 'This conversation is currently blocked.')}
            </span>
            {isBlockedByMe && (
              <button
                onClick={handleToggleBlock}
                className="text-xs font-bold underline hover:text-rose-950 dark:hover:text-rose-200 ml-2"
              >
                {lang === 'bn' ? 'আনব্লক করুন' : 'Unblock'}
              </button>
            )}
          </div>
        )}

        {/* ERROR NOTICE */}
        {errorNotice && (
          <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border-b border-amber-200 dark:border-amber-900/50 flex justify-between items-center">
            <span>{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MESSAGES THREAD */}
        <div className="grow overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
          {/* Welcome note */}
          <div className="text-center my-2">
            <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] text-slate-500 dark:text-slate-400 shadow-2xs">
              {lang === 'bn'
                ? 'কথোপকথন শুরু হয়েছে • নিরাপদ যোগাযোগের জন্য ইশফাদুর চ্যাট ব্যবহার করুন'
                : 'Conversation started • Use Isfadur Chat for secure communication'}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs font-medium">
                {lang === 'bn'
                  ? 'এখনও কোনো বার্তা আদান-প্রদান হয়নি। প্রথম বার্তাটি লিখুন!'
                  : 'No messages yet. Send a greeting to start chatting!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderUid === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-2xs ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {isBlocked ? (
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500">
              {lang === 'bn'
                ? 'ব্লক থাকায় এই কথোপকথনে মেসেজ পাঠানো যাবে না।'
                : 'Messaging is disabled while this conversation is blocked.'}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="grow relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    lang === 'bn'
                      ? 'একটি বার্তা লিখুন... (Enter চাপুন পাঠাতে)'
                      : 'Type a message... (Press Enter to send)'
                  }
                  rows={1}
                  maxLength={1000}
                  className="w-full resize-none py-2.5 pl-3.5 pr-12 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px] max-h-[120px]"
                />
                <span className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-400 pointer-events-none">
                  {inputText.length > 0 ? `${inputText.length}/1000` : ''}
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-all shadow-xs"
                title="Send Message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>

        {/* REPORT MODAL OVERLAY */}
        {isReportOpen && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xs z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'ব্যবহারকারী বা চ্যাট রিপোর্ট করুন' : 'Report Conversation / User'}</span>
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
                      ? 'রিপোর্ট সফলভাবে জমা হয়েছে। আমাদের মডারেশন টিম এটি খতিয়ে দেখবে।'
                      : 'Report submitted successfully. Our safety team will review it.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'bn' ? 'রিপোর্টের কারণ' : 'Reason for report'}
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Spam / Scams">Spam / Scams (প্রতারণা বা স্প্যাম)</option>
                      <option value="Harassment">Harassment / Abusive behavior (হয়রানি বা দুর্ব্যবহার)</option>
                      <option value="Fraudulent Product">Fraudulent or Fake item (ভুয়া পণ্য)</option>
                      <option value="Inappropriate Content">Inappropriate language / content (অশালীন বার্তা)</option>
                      <option value="Other">Other safety concern (অন্যান্য কারণ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'bn' ? 'বিস্তারিত বিবরণ (ঐচ্ছিক)' : 'Additional details (optional)'}
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={3}
                      placeholder={
                        lang === 'bn'
                          ? 'কী ঘটেছে সংক্ষেপে লিখুন...'
                          : 'Provide any additional context for moderators...'
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
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {isSubmittingReport ? 'Submitting...' : (lang === 'bn' ? 'রিপোর্ট পাঠান' : 'Submit Report')}
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
