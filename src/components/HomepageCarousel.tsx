import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../i18n/translations';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  MapPin,
  Sparkles,
  PlusCircle,
  Eye,
  Lock
} from 'lucide-react';

interface CarouselSlide {
  id: string;
  badgeEn: string;
  badgeBn: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  ctaTextEn: string;
  ctaTextBn: string;
  ctaAction: 'postAd' | 'location' | 'inbox' | 'browse';
  gradient: string;
  icon: React.ReactNode;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'p2p-trade',
    badgeEn: 'Zero Commission Marketplace',
    badgeBn: 'জিরো কমিশন মার্কেটপ্লেস',
    titleEn: 'Discover. Connect. Trade across Bangladesh',
    titleBn: 'সরাসরি লেনদেন • বাংলাদেশের নির্ভরযোগ্য মার্কেটপ্লেস',
    descEn: 'Connect directly with local buyers and sellers across 64 districts with zero middleman fees.',
    descBn: '৬৪ জেলার ক্রেতা ও বিক্রেতার সাথে সরাসরি যুক্ত হোন কোনো মধ্যস্বত্বভোগী বা ফি ছাড়াই।',
    ctaTextEn: '+ Post Free Ad',
    ctaTextBn: '+ ফ্রি বিজ্ঞাপন দিন',
    ctaAction: 'postAd',
    gradient: 'from-emerald-950 via-slate-900 to-slate-950',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'in-app-chat',
    badgeEn: 'In-App Instant Messaging',
    badgeBn: 'ইন-অ্যাপ রিয়েল-টাইম চ্যাট',
    titleEn: 'Message Sellers Directly in Real-Time',
    titleBn: 'বিজ্ঞাপনের ভেতর থেকেই বিক্রেতার সাথে সরাসরি চ্যাট করুন',
    descEn: 'Inquire about products, negotiate prices, and communicate securely without exposing private phone numbers.',
    descBn: 'ফোন নম্বর প্রকাশ না করেই নিরাপদ ইন-অ্যাপ চ্যাটের মাধ্যমে দামাদামি ও তথ্য আদান-প্রদান করুন।',
    ctaTextEn: 'Open Messages',
    ctaTextBn: 'মেসেজ দেখুন',
    ctaAction: 'inbox',
    gradient: 'from-blue-950 via-slate-900 to-slate-950',
    icon: <MessageSquare className="w-4 h-4 text-blue-400" />
  },
  {
    id: 'location-filter',
    badgeEn: 'Hyperlocal Discovery',
    badgeBn: 'নিকটবর্তী স্থানীয় সন্ধান',
    titleEn: 'Find Great Deals in Your District & Thana',
    titleBn: 'আপনার জেলা ও থানার পছন্দের পণ্য খুঁজুন সহজে',
    descEn: 'Select your district or detect your location to browse authentic ads right in your neighborhood.',
    descBn: 'লোকেশন নির্বাচন করে আপনার আশেপাশের এলাকার খাঁটি বিজ্ঞাপন ও সেবা খুঁজে নিন।',
    ctaTextEn: 'Select Location',
    ctaTextBn: 'লোকেশন নির্বাচন',
    ctaAction: 'location',
    gradient: 'from-teal-950 via-slate-900 to-slate-950',
    icon: <MapPin className="w-4 h-4 text-teal-400" />
  },
  {
    id: 'privacy-first',
    badgeEn: 'Seller Privacy by Design',
    badgeBn: 'বিক্রেতার গোপনীয়তা সুরক্ষা',
    titleEn: 'Control Phone Visibility & Call Preferences',
    titleBn: 'ফোন নম্বর প্রদর্শন ও কল অপশন নিয়ন্ত্রণ করুন নিজের মতো',
    descEn: 'Choose whether to show your phone number or keep it hidden and receive inquiries via chat only.',
    descBn: 'বিজ্ঞাপনে ফোন নম্বর প্রদর্শন করবেন কি না তা পুরোপুরি আপনার হাতে, থাকছে সম্পূর্ণ গোপনীয়তা।',
    ctaTextEn: 'Post Ad Now',
    ctaTextBn: 'বিজ্ঞাপন দিন',
    ctaAction: 'postAd',
    gradient: 'from-amber-950 via-slate-900 to-slate-950',
    icon: <Lock className="w-4 h-4 text-amber-400" />
  }
];

interface HomepageCarouselProps {
  onPostAd: () => void;
  onOpenLocation: () => void;
  onOpenInbox: () => void;
  onBrowse: () => void;
  lang?: Language;
}

export const HomepageCarousel: React.FC<HomepageCarouselProps> = ({
  onPostAd,
  onOpenLocation,
  onOpenInbox,
  onBrowse,
  lang = 'en'
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    autoPlayRef.current = setInterval(nextSlide, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, currentIndex]);

  const currentSlide = CAROUSEL_SLIDES[currentIndex];

  const handleCtaClick = (action: CarouselSlide['ctaAction']) => {
    switch (action) {
      case 'postAd':
        onPostAd();
        break;
      case 'location':
        onOpenLocation();
        break;
      case 'inbox':
        onOpenInbox();
        break;
      case 'browse':
        onBrowse();
        break;
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-900 text-white mb-4 sm:mb-6 transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role="region"
      aria-label="Marketplace highlights carousel"
    >
      {/* Background slide with subtle visual gradient */}
      <div
        className={`w-full bg-gradient-to-r ${currentSlide.gradient} px-4 py-4 sm:px-8 sm:py-5 min-h-[140px] sm:min-h-[160px] flex flex-col justify-between transition-colors duration-500`}
      >
        {/* Top: Badge & slide index */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] font-semibold text-emerald-300">
            {currentSlide.icon}
            <span>{lang === 'bn' ? currentSlide.badgeBn : currentSlide.badgeEn}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{CAROUSEL_SLIDES.length}</span>
          </div>
        </div>

        {/* Center: Title & Description */}
        <div className="my-2 sm:my-2.5 max-w-2xl">
          <h2 className="text-sm sm:text-lg font-black text-white tracking-tight line-clamp-1">
            {lang === 'bn' ? currentSlide.titleBn : currentSlide.titleEn}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
            {lang === 'bn' ? currentSlide.descBn : currentSlide.descEn}
          </p>
        </div>

        {/* Bottom: Action CTA & Navigation */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleCtaClick(currentSlide.ctaAction)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            {currentSlide.ctaAction === 'postAd' && <PlusCircle className="w-3.5 h-3.5" />}
            {currentSlide.ctaAction === 'location' && <MapPin className="w-3.5 h-3.5" />}
            {currentSlide.ctaAction === 'inbox' && <MessageSquare className="w-3.5 h-3.5" />}
            {currentSlide.ctaAction === 'browse' && <Eye className="w-3.5 h-3.5" />}
            <span>{lang === 'bn' ? currentSlide.ctaTextBn : currentSlide.ctaTextEn}</span>
          </button>

          {/* Dots Indicator & Arrow Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {CAROUSEL_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-5 bg-emerald-400'
                      : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={prevSlide}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
