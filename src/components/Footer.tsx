import React from 'react';
import { InfoModalType } from './InfoModals';
import { Shield, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Language, translations } from '../i18n/translations';

interface FooterProps {
  onOpenInfo: (type: InfoModalType) => void;
  onOpenAdmin: () => void;
  lang?: Language;
  isDark?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenInfo,
  onOpenAdmin,
  lang = 'en',
  isDark = true,
}) => {
  const t = translations[lang];

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 text-xs border-t border-slate-800 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-2.5">
            <BrandLogo isDark={true} size="xs" showTagline={true} lang={lang} />
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              {t.footerTagline}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'তথ্য ও নিরাপত্তা' : 'About & Trust'}
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onOpenInfo('about')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.aboutIsfadur}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('safety')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.safetyGuide}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('contact')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.contactSupport}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'শর্ত ও নিয়মাবলী' : 'Legal & Policy'}
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onOpenInfo('terms')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.termsConditions}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('privacy')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.privacyPolicy}
                </button>
              </li>
              <li>
                <span className="text-slate-500">
                  {t.zeroCommission}
                </span>
              </li>
            </ul>
          </div>

          {/* Governance & Admin */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যাডমিন পোর্টাল' : 'Moderation'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'মানসম্মত সেবা নিশ্চিত করতে প্রতিটি বিজ্ঞাপন প্রকাশের পূর্বে অ্যাডমিন দ্বারা যাচাই করা হয়।'
                : 'Every listing is reviewed by moderators to keep the marketplace safe and spam-free.'}
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.adminPortal}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            {t.footerCopyright.replace('{year}', new Date().getFullYear().toString())}
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Isfadur Marketplace • Bangladesh</span>
            <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
