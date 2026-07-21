import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SetupForm from './components/SetupForm';
import RecommendationCard from './components/RecommendationCard';
import FloorPlanVisualizer from './components/FloorPlanVisualizer';
import SavedProjectsList from './components/SavedProjectsList';
import GenerationProgress from './components/GenerationProgress';
import SplashScreen from './components/SplashScreen';
import AuxPages from './components/AuxPages';
import { NaqshaLayout, NaqshaSummary, SavedProject } from './types';
import { generateProceduralLayout } from './utils/layoutGenerator';
import { Sparkles, Sliders, CheckCircle2, AlertTriangle, RefreshCw, Home, ArrowLeft, ArrowRight, Ruler, ClipboardList, Layout, Check } from 'lucide-react';
import SmartHomeNaqshaLogo from './components/SmartHomeNaqshaLogo';

export default function App() {
  // Splash Screen State
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);

  // App navigation state
  const [step, setStep] = useState<'setup' | 'recommendations' | 'visualizer'>('setup');
  const [auxTab, setAuxTab] = useState<'about' | 'privacy' | 'terms' | 'contact' | null>(null);

  // Input states
  const [width, setWidth] = useState<number>(30);
  const [length, setLength] = useState<number>(50);
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');
  const [plotType, setPlotType] = useState<'corner' | 'corner-left' | 'corner-right' | 'standard'>('standard');
  const [facing, setFacing] = useState<'north' | 'south' | 'east' | 'west'>('east');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCinematicLoading, setIsCinematicLoading] = useState<boolean>(false);
  const [cinematicDuration, setCinematicDuration] = useState<number>(12000);
  const [pendingNextStep, setPendingNextStep] = useState<'recommendations' | 'visualizer' | null>(null);

  // Layout & Summary states
  const [initialSummary, setInitialSummary] = useState<NaqshaSummary | null>(null);
  const [activeLayout, setActiveLayout] = useState<NaqshaLayout | null>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // Saved Projects states
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Internet connection state
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Monitor internet connectivity
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dynamic App Version Update & Cache clearing states
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Monitor application backend version for dynamic hot updates
  useEffect(() => {
    // Initial fetch to capture current build timestamp
    fetch('/api/app-version')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.version) {
          setCurrentVersion(data.version);
        }
      })
      .catch((err) => console.log('Failed to fetch initial version:', err));

    // Polling interval of 8 seconds to instantly detect code edits
    const interval = setInterval(() => {
      fetch('/api/app-version')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.version) {
            setCurrentVersion((prev) => {
              if (prev && prev !== data.version) {
                setNewVersionAvailable(true);
              }
              return prev || data.version;
            });
          }
        })
        .catch((err) => console.log('Error polling version:', err));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    try {
      // 1. Clear all service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      
      // 2. Unregister any service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      // 3. Clear localStorage cache specifically related to layout configurations if needed, but we keep projects safe
      // Let's add a dynamic parameter to force bypass any server or browser routing cache
      window.location.href = window.location.origin + window.location.pathname + '?update=' + Date.now();
    } catch (e) {
      console.error('Error during clearing caches:', e);
      window.location.href = window.location.origin + window.location.pathname + '?update=' + Date.now();
    }
  };

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Manage PWA install events and trigger modal
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (checkStandalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      setShowInstallModal(false);
    });

    // Custom event to allow header or other buttons to open the install modal
    const handleOpenInstallModal = () => {
      setShowInstallModal(true);
    };
    window.addEventListener('open-install-modal', handleOpenInstallModal);

    // UNCONDITIONAL Auto-trigger the beautiful center modal if not in standalone and not dismissed in this session
    if (!checkStandalone && sessionStorage.getItem('naqsha_pwa_dismissed') !== 'true') {
      const timer = setTimeout(() => {
        setShowInstallModal(true);
      }, 3000); // 3 seconds delay for clean, professional feel
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('open-install-modal', handleOpenInstallModal);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open-install-modal', handleOpenInstallModal);
    };
  }, []);

  const handlePwaInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install: ${outcome}`);
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowInstallModal(false);
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        // Only if inside an iframe, open in a new tab so they escape the sandboxed container to install directly
        window.open(window.location.href, '_blank');
        setShowInstallModal(false);
      }
    }
  };

  // Lock scroll while splash screen is active
  useEffect(() => {
    if (showSplashScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSplashScreen]);

  // Initialize: Load projects and Dark mode settings from LocalStorage
  useEffect(() => {
    // Dark mode setting
    const savedTheme = localStorage.getItem('theme');
    const initialThemeIsDark = savedTheme ? savedTheme === 'dark' : true;
    
    setIsDarkMode(initialThemeIsDark);
    if (initialThemeIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Projects list
    const projectsRaw = localStorage.getItem('naqsha_projects');
    if (projectsRaw) {
      try {
        setSavedProjects(JSON.parse(projectsRaw));
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
  }, []);

  // Update dark mode class on change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Step 1: Handle initial analysis submit
  const handleInitialGenerate = async (
    w: number,
    l: number,
    selectedUnit: 'ft' | 'm',
    pType: 'corner' | 'corner-left' | 'corner-right' | 'standard',
    fDir: 'north' | 'south' | 'east' | 'west'
  ) => {
    setWidth(w);
    setLength(l);
    setUnit(selectedUnit);
    setPlotType(pType);
    setFacing(fDir);
    setIsLoading(true);
    setAiWarning(null);

    try {
      const response = await fetch('/api/generate-naqsha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: w,
          length: l,
          unit: selectedUnit,
          plotType: pType,
          facing: fDir,
        }),
      });

      const data = await response.json();
      if (data.layout) {
        setActiveLayout(data.layout);
        setInitialSummary(data.layout.summary);
        if (data.fallback) {
          setAiWarning(data.message || 'Generated using architectural offline engine.');
        }
        setPendingNextStep('recommendations');
        setCinematicDuration(3500);
        setIsCinematicLoading(true);
      } else {
        throw new Error('Invalid server layout payload');
      }
    } catch (err) {
      console.warn('Network error or server API is unavailable. Using client procedural engine fallback.');
      // Direct offline fallback
      const fallbackLayout = generateProceduralLayout(w, l, selectedUnit, {
        plotType: pType,
        facing: fDir,
      });
      setActiveLayout(fallbackLayout);
      setInitialSummary(fallbackLayout.summary);
      setAiWarning('Direct generation via local template engine (Offline Fallback).');
      setPendingNextStep('recommendations');
      setCinematicDuration(3500);
      setIsCinematicLoading(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle confirmation of recommendations & generation of customized plan
  const handleConfirmSummary = async (customSummary: NaqshaSummary) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-naqsha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width,
          length,
          unit,
          plotType,
          facing,
          preferences: {
            bedrooms: customSummary.recommendedBedrooms,
            bathrooms: customSummary.bathrooms,
            kitchenType: customSummary.kitchen.includes('Open') ? 'Open' : 'Closed',
            garage: customSummary.garage !== 'No' ? 'Yes' : 'No',
            drawingRoom: customSummary.drawingRoom,
            lawn: customSummary.lawn,
          },
        }),
      });

      const data = await response.json();
      if (data.layout) {
        setActiveLayout(data.layout);
        setPendingNextStep('visualizer');
        setCinematicDuration(12000);
        setIsCinematicLoading(true);
      } else {
        throw new Error('Failed to generate customized blueprint');
      }
    } catch (err) {
      console.log('Custom layout server call failed. Generating customized blueprint instantly on client.');
      const clientCustomizedLayout = generateProceduralLayout(width, length, unit, {
        bedrooms: customSummary.recommendedBedrooms,
        bathrooms: customSummary.bathrooms,
        kitchenType: customSummary.kitchen.includes('Open') ? 'Open' : 'Closed',
        garage: customSummary.garage !== 'No' ? 'Yes' : 'No',
        drawingRoom: customSummary.drawingRoom as 'Yes' | 'No',
        lawn: customSummary.lawn as 'Yes' | 'No',
        plotType,
        facing,
      });
      setActiveLayout(clientCustomizedLayout);
      setPendingNextStep('visualizer');
      setCinematicDuration(12000);
      setIsCinematicLoading(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Handle project local save (Triggers popup name modal)
  const handleTriggerSave = () => {
    setNewProjectName(`Plot Layout ${width}x${length} ${unit}`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (!activeLayout) return;
    const projName = newProjectName.trim() || `Plot Layout ${width}x${length} ${unit}`;
    
    const newProject: SavedProject = {
      id: `project_${Date.now()}`,
      name: projName,
      createdAt: new Date().toISOString(),
      layout: activeLayout,
    };

    const updatedProjects = [newProject, ...savedProjects];
    setSavedProjects(updatedProjects);
    localStorage.setItem('naqsha_projects', JSON.stringify(updatedProjects));
    setIsSaveModalOpen(false);
  };

  // Handle direct layout change from the visualizer
  const handleVisualizerLayoutUpdate = (updatedLayout: NaqshaLayout) => {
    setActiveLayout(updatedLayout);
  };

  // Saved Projects Actions
  const handleLoadProject = (project: SavedProject) => {
    setWidth(project.layout.width);
    setLength(project.layout.length);
    setUnit(project.layout.unit);
    setActiveLayout(project.layout);
    setInitialSummary(project.layout.summary);
    setStep('visualizer');
  };

  const handleDeleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('naqsha_projects', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {newVersionAvailable && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30 flex items-center justify-center mx-auto shadow-sm">
              <RefreshCw className={`w-7 h-7 text-blue-600 dark:text-blue-400 ${isUpdating ? 'animate-spin' : 'animate-pulse'}`} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                App Update Available!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Smart Home Naqsha has been updated with sleek responsive layouts, controls, and canvas enhancements. To maintain interface stability and load new features, please refresh the app.
              </p>
            </div>

            <button
              onClick={handleUpdateApp}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Clearing Cache & Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Update & Restart Now</span>
                </>
              )}
            </button>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              This updates the application instantly and is 100% free of charge.
            </p>
          </div>
        </div>
      )}

      {showSplashScreen && (
        <SplashScreen onComplete={() => setShowSplashScreen(false)} />
      )}
      <GenerationProgress 
        isOpen={isCinematicLoading} 
        durationMs={cinematicDuration}
        onComplete={() => {
          if (pendingNextStep) {
            setStep(pendingNextStep);
            setPendingNextStep(null);
          }
          setIsCinematicLoading(false);
        }}
      />
      
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[110] bg-rose-600 dark:bg-rose-950 text-white text-xs sm:text-sm py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-4 h-4 text-white animate-pulse shrink-0" />
          <span>Please check your internet connection. Some layout generators and real-time mapping services might be temporarily limited.</span>
        </div>
      )}

      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main className="py-8">
        {auxTab ? (
          <AuxPages initialTab={auxTab} onClose={() => setAuxTab(null)} />
        ) : (
          <>
            {/* Persistent Stepper & Navigation Hub */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-2xl py-1.5 px-3 flex items-center justify-between shadow-sm transition-all">
                
                {/* Brand / Home Quick Return */}
                <button
                  onClick={() => setStep('setup')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                    step === 'setup'
                      ? 'bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/30 font-black shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350'
                  }`}
                  title="Return to Sizing Input setup"
                >
                  <Home className="w-4 h-4 text-blue-500" />
                  <span className="hidden md:inline">Home Setup</span>
                </button>

                {/* Centered Step Indicator Timeline (Ultra-Slim & Aesthetic) */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {/* Step 1: Dimensions */}
                  <button
                    onClick={() => setStep('setup')}
                    className={`flex items-center gap-2 py-1 px-2 rounded-xl transition-all duration-300 cursor-pointer text-xs ${
                      step === 'setup' 
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/40 dark:bg-blue-950/20' 
                        : initialSummary 
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/30' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      step === 'setup' 
                        ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-500/10' 
                        : initialSummary 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border border-slate-200/40 dark:border-slate-800/40'
                    }`}>
                      {initialSummary ? <Check className="w-3 h-3 stroke-[3]" /> : <Ruler className="w-3 h-3" />}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left leading-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Dimensions</span>
                    </div>
                  </button>

                  {/* Connect Bridge 1 */}
                  <div className={`w-3 sm:w-6 h-0.5 rounded ${
                    initialSummary ? 'bg-emerald-500/55' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />

                  {/* Step 2: Recommendations */}
                  <button
                    onClick={() => initialSummary && setStep('recommendations')}
                    disabled={!initialSummary}
                    className={`flex items-center gap-2 py-1 px-2 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs ${
                      step === 'recommendations' 
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/40 dark:bg-blue-950/20' 
                        : activeLayout 
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/30' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      step === 'recommendations' 
                        ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-500/10' 
                        : activeLayout 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200/40 dark:border-slate-800/40'
                    }`}>
                      {activeLayout ? <Check className="w-3 h-3 stroke-[3]" /> : <ClipboardList className="w-3.5 h-3.5" />}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left leading-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Recommendations</span>
                    </div>
                  </button>

                  {/* Connect Bridge 2 */}
                  <div className={`w-3 sm:w-6 h-0.5 rounded ${
                    activeLayout ? 'bg-emerald-500/55' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />

                  {/* Step 3: Studio Canvas */}
                  <button
                    onClick={() => activeLayout && setStep('visualizer')}
                    disabled={!activeLayout}
                    className={`flex items-center gap-2 py-1 px-2 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs ${
                      step === 'visualizer' 
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/40 dark:bg-blue-950/20' 
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      step === 'visualizer' 
                        ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-500/10' 
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200/40 dark:border-slate-800/40'
                    }`}>
                      <Layout className="w-3 h-3" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left leading-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Studio Canvas</span>
                    </div>
                  </button>
                </div>

              </div>
            </div>

            {step === 'setup' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
                {/* Hero / Introduction */}
                <div className="text-center max-w-2xl mx-auto space-y-6">
                  {/* Centered Professional Logo Badge */}
                  <div className="flex justify-center transform hover:scale-[1.01] transition-transform duration-300">
                    <SmartHomeNaqshaLogo size="lg" showText={true} />
                  </div>
                  
                  <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                    Design Your Dream Home Layout
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    Enter your plot dimensions below. Our intelligent architect analyzes your space constraints to propose a tailored structural layout, windows for natural light, and custom room layouts.
                  </p>
                </div>

                {/* Inputs & Analytics Form */}
                <div className="max-w-2xl mx-auto">
                  <SetupForm onGenerate={handleInitialGenerate} isLoading={isLoading} />
                </div>

                {/* Local Storage projects gallery */}
                <div className="pt-6">
                  <SavedProjectsList
                    projects={savedProjects}
                    onLoad={handleLoadProject}
                    onDelete={handleDeleteProject}
                  />
                </div>
              </div>
            )}

            {step === 'recommendations' && initialSummary && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center space-y-2">
                  <h2 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                    Confirm Layout Summary
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ensure the suggested number of bedrooms, bathrooms, and features matches your needs
                  </p>
                </div>



                <RecommendationCard
                  initialSummary={initialSummary}
                  onConfirm={handleConfirmSummary}
                  onCancel={() => setStep('setup')}
                  width={width}
                  length={length}
                  unit={unit}
                />
              </div>
            )}

            {step === 'visualizer' && activeLayout && (
              <div className="animate-in fade-in duration-200">
                <FloorPlanVisualizer
                  layout={activeLayout}
                  onSave={handleTriggerSave}
                  onBackToSize={() => setStep('setup')}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Save Project Name Dialogue Modal (Polished Custom UI - No native alert window) */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                Save Blueprint to Vault
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Give your house design a friendly label to find it easily in your local offline bank.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={`e.g. Dream ${width}x${length} Villa`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3 justify-end pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Centered PWA Installation Hub Modal */}
      {showInstallModal && !isStandalone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
            {/* Top decorative accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

            {/* Close Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('naqsha_pwa_dismissed', 'true');
                setShowInstallModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Centralized Squircle Brand Icon */}
            <div className="flex flex-col items-center text-center space-y-3 mt-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl animate-pulse" />
                <img
                  src="/icon.jpg"
                  alt="Smart Home Naqsha Icon"
                  className="w-16 h-16 rounded-2xl border-2 border-blue-500/40 shadow-xl relative z-10 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight uppercase">
                  Smart Home <span className="text-blue-600 dark:text-blue-400 font-extrabold">Naqsha</span>
                </h3>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Enterprise-Grade App Setup
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Add Smart Home Naqsha directly to your home screen for rapid offline launching, full-screen viewport, and professional file export.
              </p>
            </div>

            {/* Pro Spec bullets list */}
            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 text-[10px]">✓</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant 1-Click Startup</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Pins to your taskbar/homescreen. Loads under 1 second.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 text-[10px]">✓</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Offline Functionality</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Design blueprints and navigate 3D plans without active internet.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 text-[10px]">✓</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">True Edge-to-Edge Canvas</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Bypasses browser bars for maximum structural design layout space.</p>
                </div>
              </div>
            </div>

            {/* Direct Action Hub */}
            <div className="space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={handlePwaInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  🚀 Instant Install (1-Click Auto)
                </button>
              ) : (
                window.self !== window.top ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      🔗 Launch App in Top-Level Tab
                    </button>
                    <div className="bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 text-center leading-normal font-semibold">
                        💡 Browsers block native installation inside preview iFrames. Launching in a top-level tab unlocks instant 1-click home screen installation.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* User is viewing directly but deferredPrompt hasn't fired yet or they are on iOS */
                  /iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                    <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-150 dark:border-amber-900/30 text-left space-y-2.5">
                      <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        📱 iOS / Safari Quick Install Guide
                      </h4>
                      <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-4 leading-relaxed font-medium">
                        <li>Tap the <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm text-[10px]">Share button 📤</span> at the bottom of Safari.</li>
                        <li>Scroll down and select <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm text-[10px]">Add to Home Screen ➕</span>.</li>
                        <li>Tap <span className="font-bold text-blue-600 dark:text-blue-400">Add</span> in the top-right to pin Smart Home Naqsha!</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-150 dark:border-blue-900/30 text-left space-y-2.5">
                      <h4 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                        📲 Android / Chrome Quick Install Guide
                      </h4>
                      <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-4 leading-relaxed font-medium">
                        <li>Tap the <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm text-[10px]">Chrome Menu (3-dots ⋮)</span> at the top-right.</li>
                        <li>Select <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm text-[10px]">Install app</span> or <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm text-[10px]">Add to Home screen</span>.</li>
                        <li>Confirm the dialog to complete instant native home screen setup.</li>
                      </ol>
                    </div>
                  )
                )
              )}
            </div>

            {/* Footer action */}
            <div className="flex items-center justify-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <button
                onClick={() => {
                  sessionStorage.setItem('naqsha_pwa_dismissed', 'true');
                  setShowInstallModal(false);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all uppercase tracking-wider"
              >
                Keep Viewing in Browser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-center text-xs text-slate-400 dark:text-slate-600 mt-auto">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-450">
            <button onClick={() => setAuxTab('about')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">About Us</button>
            <button onClick={() => setAuxTab('privacy')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Privacy Policy</button>
            <button onClick={() => setAuxTab('terms')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Terms of Service</button>
            <button onClick={() => setAuxTab('contact')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Contact Us</button>
          </div>
          <p className="max-w-3xl mx-auto text-[11px] leading-relaxed">
            Smart Home Naqsha is an open-source tool. Created using secure, local client-side offline storage mechanisms. No personal data is sent to external trackers.
          </p>
        </div>
      </footer>
    </div>
  );
}
