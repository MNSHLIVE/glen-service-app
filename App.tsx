
import React, { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import TechnicianView from './components/TechnicianView';
import TicketDetails from './components/Reports'; 
import DiagnosticModal from './components/DiagnosticModal';
import { UserRole } from './types';
import ToastContainer from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import { APP_CONFIG, APP_VERSION } from './config';

const Logo: React.FC<{ onVersionTap?: () => void }> = ({ onVersionTap }) => {
    const { BRANDING } = APP_CONFIG;
    return (
      <div className="flex items-center space-x-2">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" fill={BRANDING?.logoColor || "#007aff"}/>
          <path d="M16.5 8.5L10 15L7.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="text-xl font-bold" style={{ color: BRANDING?.logoColor || '#007aff' }}>
          {BRANDING?.appNamePrefix || 'Pandit'} <span className="font-light text-gray-700">{BRANDING?.appNameSuffix || 'Glen'}</span>
          <span onClick={onVersionTap} className="ml-2 text-[10px] text-gray-300 font-mono cursor-pointer select-none">v{APP_VERSION}</span>
        </h1>
      </div>
    );
};

const App: React.FC = () => {
  const { user, isAppLoading, sendHeartbeat } = useAppContext();
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
  const [diagnosticTaps, setDiagnosticTaps] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // PRESENCE HEARTBEAT INTERVAL
  useEffect(() => {
    if (user && user.role === UserRole.Technician) {
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 120000); // Every 2 mins
        return () => clearInterval(interval);
    }
  }, [user, sendHeartbeat]);

  const handleVersionTap = () => {
      setDiagnosticTaps(prev => prev + 1);
      if (diagnosticTaps >= 4) {
          setShowDiagnostics(true);
          setDiagnosticTaps(0);
      }
  };

  if (isAppLoading) return <div className="min-h-screen flex items-center justify-center font-sans text-glen-blue font-bold">Initializing Pandit Glen...</div>;

  const renderContent = () => {
    if (!user) return <LoginScreen />;
    if (viewingTicketId) return <TicketDetails ticketId={viewingTicketId} onBack={() => setViewingTicketId(null)} />;
    
    if (user.role === UserRole.Technician) {
      return <TechnicianView onViewTicket={setViewingTicketId} />;
    }
    
    return <AdminDashboard onViewTicket={setViewingTicketId} />;
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <ToastContainer />
      <InstallPrompt />
      {showDiagnostics && <DiagnosticModal onClose={() => setShowDiagnostics(false)} />}
      
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Logo onVersionTap={handleVersionTap} />
          {user && (
            <div className="text-xs text-gray-400 font-mono flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                {user.role} online
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full p-4 pb-24">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
