import React from 'react';
import { DNWELL_LOGO_BASE64 } from '../assets/dnwellLogoBase64';

export const CojLogo: React.FC<{ className?: string; variant?: 'dark' | 'light' | 'mono' }> = ({
  className = 'h-12',
  variant = 'dark',
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#0F172A';
  const frameColor = isLight ? '#FFFFFF' : '#0F172A';
  const yellowColor = '#F59E0B'; // COJ Gold/Yellow

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 280 160"
        className="h-full w-auto max-h-16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* City of Joburg Arch Frame */}
        <path
          d="M 12 148 L 12 55 Q 140 18 268 8 L 268 148 Z"
          stroke={frameColor}
          strokeWidth="6"
          fill="none"
        />

        {/* 'j' Spire / Hillbrow Tower abstraction */}
        <g transform="translate(42, 45)">
          {/* Spire needle */}
          <line x1="66" y1="0" x2="66" y2="18" stroke={textColor} strokeWidth="3" strokeLinecap="round" />
          {/* Spire tower head */}
          <path
            d="M 54 20 Q 66 16 78 20 L 71 58 L 61 58 Z"
            fill={textColor}
          />
          {/* Stem of j */}
          <path
            d="M 62 58 L 70 58 L 70 82 Q 70 98 48 98 Q 40 98 34 94 L 38 84 Q 44 87 49 87 Q 59 87 59 78 L 59 58 Z"
            fill={textColor}
          />
          {/* Yellow sun sphere in the curve of Joburg j */}
          <circle cx="66" cy="94" r="8" fill={yellowColor} />
        </g>

        {/* 'oburg' lettering */}
        <text
          x="126"
          y="126"
          fontFamily="'Public Sans', sans-serif"
          fontWeight="700"
          fontSize="48"
          fill={textColor}
          letterSpacing="-1.5"
        >
          oburg
        </text>
      </svg>
      <div className="flex flex-col justify-center text-left leading-tight">
        <span className={`text-[11px] font-bold tracking-wider uppercase ${isLight ? 'text-amber-400' : 'text-amber-600'}`}>
          City of Johannesburg
        </span>
        <span className={`text-[10px] font-medium ${isLight ? 'text-slate-300' : 'text-slate-500'}`}>
          Health & Social Development
        </span>
      </div>
    </div>
  );
};

export const DnwellLogo: React.FC<{
  className?: string;
  variant?: 'dark' | 'light';
  layout?: 'stacked' | 'horizontal';
  useImage?: boolean;
}> = ({
  className = 'h-12',
  variant = 'dark',
  layout = 'horizontal',
  useImage = false,
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#1A1E22';
  const subtitleColor = isLight ? '#A3E635' : '#5A8325';
  const regColor = isLight ? '#94A3B8' : '#26292E';

  // If exact image is requested or stacked layout on white/light background, use the exact attached brand logo asset
  if (useImage || (layout === 'stacked' && !isLight)) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={DNWELL_LOGO_BASE64}
          alt="Dnwell Executive Wellness and Health"
          className="h-full w-auto max-h-full object-contain rounded-xs"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Stacked layout matches the exact square/vertical orientation of the original brand mark
  if (layout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Brand Figure & Trademark */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Center Head Circle */}
            <circle cx="100" cy="45" r="22" fill="#7DAA26" />

            {/* Right upper arm & Left lower leg arch ribbon */}
            <path
              d="M 152 40 C 148 65 130 92 100 115 C 80 130 65 155 60 178 C 65 168 76 150 92 136 C 118 114 138 90 144 68 C 148 54 150 46 152 40 Z"
              fill="#84BA26"
            />

            {/* Left upper arm & Right lower leg arch ribbon (intersecting) */}
            <path
              d="M 48 40 C 52 65 70 92 100 115 C 120 130 135 155 140 178 C 135 168 124 150 108 136 C 82 114 62 90 56 68 C 52 54 50 46 48 40 Z"
              fill="#7DAA26"
            />
          </svg>

          {/* Registered Trademark ® Top-Right */}
          <span
            className="absolute top-1 right-0 text-[10px] sm:text-xs font-black"
            style={{ color: regColor }}
          >
            ®
          </span>
        </div>

        {/* Wordmark "Dnwell" */}
        <div
          className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans leading-none mt-1"
          style={{ color: textColor }}
        >
          Dnwell
        </div>

        {/* Subtitle "Executive Wellness and Health" */}
        <div
          className="text-[9px] sm:text-[11px] font-bold tracking-wide mt-1 uppercase"
          style={{ color: subtitleColor }}
        >
          Executive Wellness and Health
        </div>
      </div>
    );
  }

  // Horizontal layout for headers, navbars and report banners
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon with Registered symbol */}
      <div className="relative h-full flex-shrink-0 flex items-center">
        <svg
          viewBox="0 0 200 200"
          className="h-full w-auto max-h-14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head Circle */}
          <circle cx="100" cy="45" r="22" fill="#7DAA26" />

          {/* Right upper arm & Left lower leg arch */}
          <path
            d="M 152 40 C 148 65 130 92 100 115 C 80 130 65 155 60 178 C 65 168 76 150 92 136 C 118 114 138 90 144 68 C 148 54 150 46 152 40 Z"
            fill="#84BA26"
          />

          {/* Left upper arm & Right lower leg arch */}
          <path
            d="M 48 40 C 52 65 70 92 100 115 C 120 130 135 155 140 178 C 135 168 124 150 108 136 C 82 114 62 90 56 68 C 52 54 50 46 48 40 Z"
            fill="#7DAA26"
          />
        </svg>
        <span
          className="text-[8px] font-black absolute top-0 -right-1"
          style={{ color: regColor }}
        >
          ®
        </span>
      </div>

      {/* Typography: Wordmark + Subtitle */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1">
          <span
            className="text-xl sm:text-2xl font-black tracking-tight font-sans"
            style={{ color: textColor }}
          >
            Dnwell
          </span>
          <span
            className="text-[9px] font-bold align-super"
            style={{ color: regColor }}
          >
            ®
          </span>
        </div>
        <span
          className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase mt-0.5 whitespace-nowrap"
          style={{ color: subtitleColor }}
        >
          Executive Wellness and Health
        </span>
      </div>
    </div>
  );
};

export const JointOutreachBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 bg-slate-900/90 text-white px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-md ${className}`}>
      <CojLogo className="h-8" variant="light" />
      <div className="h-6 w-px bg-slate-700" />
      <DnwellLogo className="h-8" variant="light" />
    </div>
  );
};
