import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';

export function LoadingIntro({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const steps = [
    "Starting delivery truck engines...",
    "Loading route configurations...", 
    "Setting up GPS navigation...",
    "Preparing delivery manifest...",
    "Ready for truck deliveries!"
  ];

  useEffect(() => {
    // Show logo first
    const logoTimeout = setTimeout(() => {
      setShowLogo(true);
    }, 300);

    // Progress animation - faster
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Fade out before completing
          setFadeOut(true);
          setTimeout(onComplete, 600);
          return 100;
        }
        return prev + 3;
      });
    }, 40);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    return () => {
      clearTimeout(logoTimeout);
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center transition-opacity duration-600 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Enhanced blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background to-blue-600/30 dark:from-blue-600/10 dark:to-blue-900/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 dark:from-blue-950/30 via-transparent to-transparent" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
      </div>
      
      {/* Content */}
      <div className="relative flex flex-col items-center space-y-8 max-w-md mx-auto px-6">
        
        {/* Enhanced animated logo area */}
        <div className={`relative transition-all duration-1000 ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="w-32 h-32 relative">
            {/* Glass morphism circle background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 dark:from-blue-600/20 dark:to-blue-800/20 animate-pulse shadow-2xl" />
            <div className="absolute inset-2 rounded-full bg-background/60 dark:bg-background/40 backdrop-blur-xl border border-blue-300/30 dark:border-blue-500/20" />
            
            {/* Enhanced orbital dots */}
            <div className="absolute inset-0">
              <div className="loading-orbit">
                <div className="absolute w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/50 animate-pulse" />
              </div>
              <div className="loading-orbit-reverse">
                <div className="absolute w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50 animate-pulse" />
              </div>
            </div>
            
            {/* Center truck icon with enhanced styling */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center shadow-2xl shadow-blue-500/50 transform hover:scale-110 transition-transform">
                <Truck className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced app title */}
        <div className={`text-center transition-all duration-1000 delay-300 ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
            TruckFlow Pro
          </h1>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Smart delivery routes • Real-time tracking • Fleet management</p>
        </div>

        {/* Enhanced progress section */}
        <div className={`w-full space-y-4 transition-all duration-1000 delay-500 ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Enhanced progress bar */}
          <div className="relative">
            <div className="h-3 bg-blue-950/30 dark:bg-blue-900/20 rounded-full overflow-hidden relative backdrop-blur-sm border border-blue-300/20 dark:border-blue-500/10 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 dark:from-blue-600 dark:via-blue-700 dark:to-cyan-600 transition-all duration-300 ease-out rounded-full relative shadow-lg shadow-blue-500/50"
                style={{ width: `${progress}%` }}
              >
                {/* Enhanced moving indicator */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white dark:bg-blue-100 rounded-full shadow-xl shadow-blue-400/50 animate-pulse" />
              </div>
            </div>
            <div className="text-right mt-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono font-bold">{progress}%</span>
            </div>
          </div>

          {/* Current step with enhanced styling */}
          <div className="text-center min-h-[1.5rem]">
            <p className="text-sm text-blue-700 dark:text-blue-300 transition-all duration-500 font-medium">
              {steps[currentStep]}
            </p>
          </div>

          {/* Enhanced loading animation */}
          <div className="flex justify-center">
            <div className="loading-wave">
              <div className="wave-dot bg-blue-500 dark:bg-blue-400" />
              <div className="wave-dot bg-blue-600 dark:bg-blue-500" />
              <div className="wave-dot bg-blue-700 dark:bg-blue-600" />
              <div className="wave-dot bg-cyan-500 dark:bg-cyan-400" />
              <div className="wave-dot bg-blue-500 dark:bg-blue-400" />
            </div>
          </div>
        </div>

        {/* Success checkmark on completion */}
        {progress === 100 && !fadeOut && (
          <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}