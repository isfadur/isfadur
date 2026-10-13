import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Facebook,
  Send,
  Smartphone
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url?: string;
  lang?: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  url,
  lang = 'en'
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  if (!isOpen) return null;

  const defaultText = lang === 'bn' ? 'ইশফাদুর বাংলাদেশ মার্কেটপ্লেস' : 'Check this out on Isfadur Marketplace Bangladesh';
  const shareText = text || defaultText;
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title}\n${shareText}\n${shareUrl}`);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (err) {
        // User cancelled
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'bn' ? 'বন্ধুদের সাথে শেয়ার করুন' : 'Share with Friends & Family'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Item preview info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold line-clamp-1">{title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{shareText}</p>
          </div>

          {/* Social share channels */}
          <div className="grid grid-cols-4 gap-2.5 text-center">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-all border border-emerald-200 dark:border-emerald-800 group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 transition-all border border-blue-200 dark:border-blue-800 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <Facebook className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">Facebook</span>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-300 transition-all border border-sky-200 dark:border-sky-800 group"
            >
              <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">Telegram</span>
            </a>

            {/* Device Share (if available) */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">{lang === 'bn' ? 'অন্যান্য' : 'More Apps'}</span>
            </button>
          </div>

          {/* Copy link box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {lang === 'bn' ? 'ডিরেক্ট লিংক কপি করুন' : 'Copy Direct Link'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="grow text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all shrink-0 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
