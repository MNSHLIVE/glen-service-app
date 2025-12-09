import React, { useState, useEffect } from 'react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      // Show manually if not in standalone mode
      if (!(window.navigator as any).standalone) {
        setIsVisible(true);
      }
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt' as any, handler);

    return () => window.removeEventListener('beforeinstallprompt' as any, handler);
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      alert("Tap the Share icon (box with arrow) and scroll down to select 'Add to Home Screen'.");
      setIsVisible(false);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] p-4 flex items-center justify-between border border-gray-100 max-w-lg mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-glen-blue p-2.5 rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Pandit Glen Service</p>
            <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">Save as Mobile App</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsVisible(false)} className="text-gray-400 font-bold p-2 text-xl">
            &times;
          </button>
          <button 
            onClick={handleInstallClick}
            className="bg-glen-blue text-white font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-md"
          >
            {platform === 'ios' ? 'How to Add' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;