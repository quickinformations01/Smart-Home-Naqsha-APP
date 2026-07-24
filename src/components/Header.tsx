import React, { useEffect, useState } from 'react';
import { Home, Sun, Moon, Info, Download, Smartphone, ExternalLink } from 'lucide-react';
import SmartHomeNaqshaLogo from './SmartHomeNaqshaLogo';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function Header({ isDarkMode, setIsDarkMode }: HeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIframeTip, setShowIframeTip] = useState<boolean>(false);

  useEffect(() => {
    // Detect if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      console.log('Smart Home Naqsha was successfully installed.');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    window.dispatchEvent(new CustomEvent('open-install-modal'));
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 px-6 h-16 shrink-0 flex items-center transition-all duration-200 shadow-sm">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <SmartHomeNaqshaLogo size="sm" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Custom Install Button */}
          {!isStandalone ? (
            <div className="relative">
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1.5 text-[11px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white py-2 px-4 rounded-full shadow-lg shadow-blue-500/15 border border-blue-400/25 transition-all duration-150 cursor-pointer animate-pulse"
                id="pwa-install-button"
                title="Install Smart Home Naqsha as an offline app"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>

              {/* Professional PWA Guide Dropdown */}
              {showIframeTip && (
                <div className="absolute right-0 mt-3 w-72 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                        Install Smart Naqsha
                      </h4>
                      <p className="text-[9px] text-slate-500">Run as standalone application</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    PWA installations are blocked inside frames. Open in a dedicated tab to install immediately with 1-click:
                  </p>

                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mb-3.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setShowIframeTip(false)}
                  >
                    <span>Open in New Tab & Install</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="space-y-2 text-[9px] border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="text-slate-500 font-semibold uppercase tracking-wider text-[8px]">Alternative Instructions</p>
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 rounded font-bold">A</span>
                      <span>In standard Chrome/Edge, click the **Install icon** in the address bar.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 rounded font-bold">B</span>
                      <span>On iOS Safari, tap **Share** and select **"Add to Home Screen"**.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIframeTip(false)}
                    className="w-full mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] py-1.5 rounded-xl transition"
                  >
                    Close Guide
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 py-1.5 px-3.5 rounded-full uppercase tracking-wider">
              <span>✓ Standalone PWA</span>
            </div>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700/60 items-center">
            <button
              onClick={() => setIsDarkMode(false)}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isDarkMode
                  ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              id="toggle-light-btn"
              title="Switch to Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-700 text-blue-400 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              id="toggle-dark-btn"
              title="Switch to Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700/50">
            <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>100% Client-Vault Saved</span>
          </div>
        </div>
      </div>
    </header>
  );
}
