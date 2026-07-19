import React from 'react';

interface SmartHomeNaqshaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function SmartHomeNaqshaLogo({ 
  className = '', 
  size = 'md', 
  showText = true 
}: SmartHomeNaqshaLogoProps) {
  // Dimension mappings
  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-lg' },
    lg: { icon: 'w-20 h-20', text: 'text-3xl' },
  };

  const activeDim = dimensions[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Animated Architectural Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${activeDim.icon}`}>
        {/* Glow backdrop ring */}
        <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl blur-md" />
        
        {/* Vector SVG Icon */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_4px_6px_rgba(37,99,235,0.15)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Linear and Radial Gradients for Premium look */}
            <linearGradient id="logo-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            
            <linearGradient id="logo-accent-gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            
            <clipPath id="squircle-clip">
              <rect x="5" y="5" width="90" height="90" rx="22" ry="22" />
            </clipPath>
          </defs>

          {/* Squircle bounding shield background with subtle blueprint blueprint grid lines */}
          <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#logo-blue-grad)" />
          
          {/* Internal tech-grid pattern inside logo squircle */}
          <g opacity="0.15" stroke="#FFFFFF" strokeWidth="1" clipPath="url(#squircle-clip)">
            <line x1="25" y1="0" x2="25" y2="100" />
            <line x1="50" y1="0" x2="50" y2="100" />
            <line x1="75" y1="0" x2="75" y2="100" />
            <line x1="0" y1="25" x2="100" y2="25" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="75" x2="100" y2="75" />
          </g>

          {/* Golden Blueprint Compass / Divider Symbol overlay */}
          <path 
            d="M50 20 L28 78 C28 78 40 70 50 78 C60 70 72 78 72 78 Z" 
            fill="none" 
            stroke="url(#logo-accent-gold)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.85"
          />

          {/* High-Contrast Crisp House Blueprint wireframe */}
          <path 
            d="M24 52 L50 28 L76 52" 
            stroke="#FFFFFF" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M32 48 V80 H68 V48" 
            stroke="#FFFFFF" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Center Smart Node (Representing AI and IoT Smart Naqsha) */}
          <circle cx="50" cy="56" r="8" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="50" y1="48" x2="50" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2,2" />
        </svg>
      </div>

      {/* Brand Typography Text */}
      {showText && (
        <div className="flex flex-col select-none leading-none">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white uppercase ${
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-sm'
          }`}>
            Smart Home
          </span>
          <span className={`font-black text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 ${
            size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-xs'
          }`}>
            <span>NAQSHA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </span>
        </div>
      )}
    </div>
  );
}
