import React, { useState, useEffect } from 'react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 flex items-center justify-between animate-slide-up">
      <div className="flex items-center space-x-3">
         <div className="bg-glen-blue p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
         </div>
         <div>
            <p className="font-bold text-gray-800">Install App</p>
            <p className="text-xs text-gray-500">Get the best experience</p>
         </div>
      </div>
      <div className="flex items-center space-x-2">
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600 p-2">
            &times;
          </button>
          <button 
            onClick={handleInstallClick}
            className="bg-glen-blue text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Install
          </button>
      </div>
    </div>
  );
};

export default InstallPrompt;