import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import TechnicianView from './components/TechnicianView';
import TicketDetails from './components/Reports'; // Reports.tsx is repurposed as TicketDetails
import { UserRole } from './types';
import ToastContainer from './components/Toast';

const Logo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" fill="#007aff"/>
      <path d="M16.5 8.5L10 15L7.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5V2M12 22V19M19 12H22M2 12H5M17.6569 6.34315L19.7782 4.22183M4.22183 19.7782L6.34315 17.6569M17.6569 17.6569L19.7782 19.7782M4.22183 4.22183L6.34315 6.34315" stroke="#007aff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    <h1 className="text-xl font-bold text-glen-blue">
      Pandit <span className="font-light text-gray-700">Glen Service</span>
    </h1>
  </div>
);


const App: React.FC = () => {
  const { user } = useAppContext();
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const handleViewTicket = (ticketId: string) => {
    setViewingTicketId(ticketId);
  };

  const handleBackToList = () => {
    setViewingTicketId(null);
  };

  const renderContent = () => {
    if (!user) {
      return <LoginScreen />;
    }

    if (viewingTicketId) {
      return <TicketDetails ticketId={viewingTicketId} onBack={handleBackToList} />;
    }
    
    if (user.role === UserRole.Admin) {
      return <AdminDashboard onViewTicket={handleViewTicket} />;
    }
    
    if (user.role === UserRole.Technician) {
      return <TechnicianView onViewTicket={handleViewTicket} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen font-sans">
      <ToastContainer />
      <header className="bg-white/70 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Logo />
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;