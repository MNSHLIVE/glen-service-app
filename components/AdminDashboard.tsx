
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import AddTicketModal from './AddTicketModal';
import ViewJobs from './ViewJobs';
import TechnicianRatings from './TechnicianRatings';
import IntelligentAddTicketModal from './IntelligentAddTicketModal';
import SettingsModal from './SettingsModal';
import PerformanceView from './PerformanceView';
import { WebhookStatus } from '../types';

const AdminDashboard: React.FC<{ onViewTicket: (id: string) => void }> = ({ onViewTicket }) => {
  const { user, logout, syncTickets, technicians, webhookStatus, checkWebhookHealth } = useAppContext();
  const [activeView, setActiveView] = useState('jobs');
  const [showManual, setShowManual] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onlineCount = useMemo(() => {
      const fiveMins = 5 * 60 * 1000;
      return technicians.filter(t => t.lastSeen && (Date.now() - new Date(t.lastSeen).getTime() < fiveMins)).length;
  }, [technicians]);

  useEffect(() => {
      syncTickets(true);
      const interval = setInterval(() => syncTickets(true), 60000);
      return () => clearInterval(interval);
  }, [syncTickets]);

  const StatusPill = () => {
    const color = webhookStatus === WebhookStatus.Connected ? 'bg-green-100 text-green-700' : 
                  webhookStatus === WebhookStatus.Checking ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
    return (
        <button onClick={() => checkWebhookHealth()} className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${webhookStatus === WebhookStatus.Connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>n8n: {webhookStatus}</span>
        </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border">
        <div>
          <h2 className="text-xl font-bold">Hello, {user?.name}</h2>
          <div className="flex items-center space-x-2 mt-1">
             <div className="flex items-center space-x-1 border-r pr-2">
                 <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                 <span className="text-xs font-semibold text-gray-500">{onlineCount} Techs Live</span>
             </div>
             <StatusPill />
          </div>
        </div>
        <div className="flex space-x-2">
            <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-100 rounded-lg"><SettingsIcon/></button>
            <button onClick={logout} className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Logout</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Actions</p>
          <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowIntel(true)} className="flex items-center justify-center space-x-2 bg-indigo-500 text-white p-3 rounded-xl font-bold">
                  <span>AI Magic Scan</span>
              </button>
              <button onClick={() => setShowManual(true)} className="flex items-center justify-center space-x-2 bg-glen-blue text-white p-3 rounded-xl font-bold">
                  <span>New Ticket</span>
              </button>
          </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1">
          {['jobs', 'performance', 'ratings'].map(v => (
              <button 
                key={v} 
                onClick={() => setActiveView(v)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-colors ${activeView === v ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500'}`}
              >
                  {v}
              </button>
          ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border min-h-[400px]">
          {activeView === 'jobs' && <ViewJobs onViewTicket={onViewTicket} />}
          {activeView === 'ratings' && <TechnicianRatings />}
          {activeView === 'performance' && <PerformanceView />}
      </div>

      {showManual && <AddTicketModal onClose={() => setShowManual(false)} />}
      {showIntel && <IntelligentAddTicketModal mode="text" onClose={() => setShowIntel(false)} onParsed={() => { setShowIntel(false); setShowManual(true); }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /></svg>;

export default AdminDashboard;
