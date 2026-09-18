import React from 'react';

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

export const DnwellLogo: React.FC<{ className?: string; variant?: 'dark' | 'light' }> = ({
  className = 'h-12',
  variant = 'dark',
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#0B192C';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dnwell Green Ribbon Human Figure */}
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto max-h-12 flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head circle */}
        <circle cx="50" cy="22" r="12" fill="#70A82C" />
        {/* Upper arms reaching up in joy & vitality */}
        <path
          d="M 32 30 C 34 45 42 55 50 62 C 58 55 66 45 68 30 C 74 36 78 48 68 62 C 58 76 54 84 50 92 C 46 84 42 76 32 62 C 22 48 26 36 32 30 Z"
          fill="#70A82C"
        />
        {/* Lower flowing legs forming the ribbon */}
        <path
          d="M 40 68 C 30 78 28 88 28 92 C 32 90 40 82 48 72 Z"
          fill="#84CC16"
        />
        <path
          d="M 60 68 C 70 78 72 88 72 92 C 68 90 60 82 52 72 Z"
          fill="#84CC16"
        />
      </svg>

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1">
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: textColor }}
          >
            Dnwell
          </span>
          <span className="text-[10px] font-bold text-slate-400 align-super">®</span>
        </div>
        <span className="text-[9px] font-semibold tracking-wide text-emerald-600 uppercase mt-0.5">
          Youth Priority Clinic
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
