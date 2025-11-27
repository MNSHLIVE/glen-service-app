
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import AddTicketModal from './AddTicketModal';
import ViewJobs from './ViewJobs';
import TechnicianRatings from './TechnicianRatings';
import IntelligentAddTicketModal from './IntelligentAddTicketModal';
import SettingsModal from './SettingsModal';
import PerformanceView from './PerformanceView';
import { Ticket, WebhookStatus, UserRole } from '../types';

interface AdminDashboardProps {
    onViewTicket: (ticketId: string) => void;
}

type AdminView = 'jobs' | 'ratings' | 'performance';

const WebhookStatusIndicator: React.FC = () => {
    const { webhookStatus } = useAppContext();

    const getStatusDetails = () => {
        switch (webhookStatus) {
            case WebhookStatus.Connected:
                return { color: 'bg-green-500', tooltip: 'Automation Connected', pulse: false };
            case WebhookStatus.Error:
                return { color: 'bg-red-500', tooltip: 'Connection Error', pulse: false };
            case WebhookStatus.Checking:
                return { color: 'bg-yellow-500', tooltip: 'Checking Connection...', pulse: true };
            case WebhookStatus.Simulating:
                return { color: 'bg-yellow-500', tooltip: 'Simulation Mode', pulse: false };
            case WebhookStatus.Unknown:
            default:
                return { color: 'bg-gray-400', tooltip: 'Automation Status Unknown', pulse: false };
        }
    };

    const { color, tooltip, pulse } = getStatusDetails();

    return (
        <div className="relative group flex items-center" title={tooltip}>
            <span className={`block w-4 h-4 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`}></span>
            <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                {tooltip}
            </div>
        </div>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewTicket }) => {
  const { user, logout, syncTickets, isSyncing, lastSyncTime } = useAppContext();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isIntelligentModalOpen, setIsIntelligentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [intelligentMode, setIntelligentMode] = useState<'text' | 'image'>('text');
  const [parsedTicketData, setParsedTicketData] = useState<Partial<Ticket> | null>(null);
  const [activeView, setActiveView] = useState<AdminView>('jobs');

  const isDeveloper = user?.role === UserRole.Developer;
  const isAdmin = user?.role === UserRole.Admin;
  // Allow both Developers and Admins to access settings
  const canConfigure = isDeveloper || isAdmin;

  // AUTO-SYNC
  useEffect(() => {
      syncTickets(true);
      const intervalId = setInterval(() => {
          syncTickets(true);
      }, 60000);
      return () => clearInterval(intervalId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenIntelligentModal = (mode: 'text' | 'image') => {
    setIntelligentMode(mode);
    setIsIntelligentModalOpen(true);
  };

  const handleParsedData = (data: Partial<Ticket>) => {
    setParsedTicketData(data);
    setIsIntelligentModalOpen(false);
    setIsManualModalOpen(true);
  };
  
  const handleCloseManualModal = () => {
      setIsManualModalOpen(false);
      setParsedTicketData(null);
  }

  const navButtonClasses = (view: AdminView) =>
    `flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-300 ${
      activeView === view
        ? 'bg-glen-blue text-white rounded-lg shadow'
        : 'text-gray-600 hover:bg-glen-light-blue rounded-lg'
    }`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">
                  {isDeveloper ? 'Developer Mode' : 'Admin Dashboard'}
              </p>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">v3.12</span>
              {lastSyncTime && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Updated: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
            <WebhookStatusIndicator />
            <button onClick={() => syncTickets()} disabled={isSyncing} title="Fetch New Jobs" className="text-sm bg-blue-500 text-white font-semibold p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
                {isSyncing ? <SpinnerIcon /> : <RefreshIcon />}
            </button>
            
            {/* Developer and Admin can see Settings */}
            {canConfigure && (
                <button onClick={() => setIsSettingsModalOpen(true)} className="text-sm bg-gray-600 text-white font-semibold p-2 rounded-lg hover:bg-gray-700 transition-colors" title="Settings">
                    <SettingsIcon />
                </button>
            )}

            <button onClick={logout} className="text-sm bg-glen-red text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
              Logout
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">Create New Service Ticket</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => setIsManualModalOpen(true)} className="w-full bg-glen-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                <PencilIcon/>
                <span>Manual Entry</span>
            </button>
            <button onClick={() => handleOpenIntelligentModal('text')} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                <TextIcon/>
                <span>From Text</span>
            </button>
            <button onClick={() => handleOpenIntelligentModal('image')} className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2">
                <CameraIcon/>
                <span>From Photo</span>
            </button>
        </div>
      </div>


      <div className="bg-white p-2 rounded-lg shadow-md">
        <nav className="flex space-x-2">
          <button onClick={() => setActiveView('jobs')} className={navButtonClasses('jobs')}>
            View Jobs
          </button>
          <button onClick={() => setActiveView('ratings')} className={navButtonClasses('ratings')}>
            Ratings
          </button>
          <button onClick={() => setActiveView('performance')} className={navButtonClasses('performance')}>
            Performance
          </button>
        </nav>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md min-h-[400px]">
        {activeView === 'jobs' && <ViewJobs onViewTicket={onViewTicket} />}
        {activeView === 'ratings' && <TechnicianRatings />}
        {activeView === 'performance' && <PerformanceView />}
      </div>

      {isManualModalOpen && <AddTicketModal onClose={handleCloseManualModal} initialData={parsedTicketData} />}
      {isIntelligentModalOpen && <IntelligentAddTicketModal mode={intelligentMode} onClose={() => setIsIntelligentModalOpen(false)} onParsed={handleParsedData} />}
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
    </div>
  );
};

// Icons
const PencilIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);
const TextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);
const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4l-4 4M4 20l4-4M1 12h5M18 12h5" />
    </svg>
);
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default AdminDashboard;
