
import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import TechnicianView from './components/TechnicianView';
import TicketDetails from './components/Reports'; // Reports.tsx is repurposed as TicketDetails
import { UserRole } from './types';

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
    <div className="bg-glen-gray min-h-screen font-sans">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-glen-blue">
            XYZ Glen Service Partner
          </h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;