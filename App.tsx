
import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import TechnicianView from './components/TechnicianView';
import TicketDetails from './components/Reports'; // Reports.tsx is repurposed as TicketDetails
import { UserRole } from './types';
import ToastContainer from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import { APP_CONFIG } from './config';

const Logo: React.FC = () => {
    const { BRANDING } = APP_CONFIG;
    return (
      <div className="flex items-center space-x-2">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" fill={BRANDING?.logoColor || "#007aff"}/>
          <path d="M16.5 8.5L10 15L7.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5V2M12 22V19M19 12H22M2 12H5M17.6569 6.34315L19.7782 4.22183M4.22183 19.7782L6.34315 17.6569M17.6569 17.6569L19.7782 19.7782M4.22183 4.22183L6.34315 6.34315" stroke={BRANDING?.logoColor || "#007aff"} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <h1 className="text-xl font-bold" style={{ color: BRANDING?.logoColor || '#007aff' }}>
          {BRANDING?.appNamePrefix || 'Pandit'} <span className="font-light text-gray-700">{BRANDING?.appNameSuffix || 'Glen Service'}</span>
        </h1>
      </div>
    );
};


const App: React.FC = () => {
  const { user, isAppLoading } = useAppContext();
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const handleViewTicket = (ticketId: string) => {
    setViewingTicketId(ticketId);
  };

  const handleBackToList = () => {
    setViewingTicketId(null);
  };
  
  if (isAppLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
             <div className="animate-pulse">
                <Logo />
             </div>
             <p className="mt-4 text-gray-400 text-sm">Starting up...</p>
          </div>
      )
  }

  const renderContent = () => {
    if (!user) {
      return <LoginScreen />;
    }

    if (viewingTicketId) {
      return <TicketDetails ticketId={viewingTicketId} onBack={handleBackToList} />;
    }
    
    if (user.role === UserRole.Admin || user.role === UserRole.Controller || user.role === UserRole.Developer || user.role === UserRole.Coordinator) {
      return <AdminDashboard onViewTicket={handleViewTicket} />;
    }
    
    if (user.role === UserRole.Technician) {
      return <TechnicianView onViewTicket={handleViewTicket} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <ToastContainer />
      <InstallPrompt />
      {/* Header: Sticky with safe-area padding support via standard css */}
      <header className="bg-white/70 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Logo />
        </div>
      </header>
      {/* Main content: Flex grow to fill space, with padding for mobile */}
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 pb-24 sm:pb-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
