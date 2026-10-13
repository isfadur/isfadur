import React from 'react';
import { Language } from '../i18n/translations';

interface BrandLogoProps {
  className?: string;
  isDark?: boolean;
  showTagline?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  lang?: Language;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  isDark = true,
  showTagline = true,
  size = 'md',
  lang = 'en'
}) => {
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const taglineColor = isDark ? 'text-slate-400' : 'text-slate-500';

  const titleSizes = {
    xs: 'text-lg sm:text-xl tracking-tight',
    sm: 'text-xl sm:text-2xl tracking-tight',
    md: 'text-2xl sm:text-3xl tracking-tight',
    lg: 'text-3xl sm:text-4xl tracking-tight'
  };

  const taglineSizes = {
    xs: 'text-[8px] sm:text-[9px] tracking-widest',
    sm: 'text-[9px] sm:text-[10px] tracking-widest',
    md: 'text-[10px] sm:text-[11px] tracking-widest',
    lg: 'text-xs tracking-widest'
  };

  const taglineText = 'Discover. Connect. Trade.';

  return (
    <div className={`flex flex-col select-none leading-none ${className}`}>
      {/* Pure distinctive text logo: Isfadur with emerald highlight on 'A' */}
      <div className="flex items-baseline">
        <span className={`font-black uppercase font-sans ${titleSizes[size]} ${textColor} tracking-tight transition-colors`}>
          ISF<span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>A</span>DUR
        </span>
      </div>

      {showTagline && (
        <span className={`font-bold uppercase mt-0.5 ${taglineSizes[size]} ${taglineColor}`}>
          {taglineText}
        </span>
      )}
    </div>
  );
};
