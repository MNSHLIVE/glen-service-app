
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import AddTicketModal from './AddTicketModal';
import ViewJobs from './ViewJobs';
import TechnicianRatings from './TechnicianRatings';
import IntelligentAddTicketModal from './IntelligentAddTicketModal';
import SettingsModal from './SettingsModal';
import PerformanceView from './PerformanceView';
import { WebhookStatus, TicketStatus } from '../types';
import { triggerDataSync } from '../utils/dataSync';

const AdminDashboard: React.FC<{ onViewTicket: (id: string) => void }> = ({ onViewTicket }) => {
  const { user, logout, syncTickets, technicians, tickets, webhookStatus, checkWebhookHealth, isSyncing } = useAppContext();
  const [activeView, setActiveView] = useState('jobs');
  const [showManual, setShowManual] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onlineCount = useMemo(() => {
      const fiveMins = 5 * 60 * 1000;
      return technicians.filter(t => t.lastSeen && (Date.now() - new Date(t.lastSeen).getTime() < fiveMins)).length;
  }, [technicians]);

  // AUTO-SYNC REMOVED - Visibility change in AppContext.tsx handles background sync
  // Manual refresh button triggers explicit sync


  const counts = useMemo(() => {
      return {
          new: tickets.filter(t => t.status === TicketStatus.New).length,
          pending: tickets.filter(t => t.status === TicketStatus.InProgress).length,
          completed: tickets.filter(t => t.status === TicketStatus.Completed).length,
      };
  }, [tickets]);

  const StatusBadge = () => {
    const color = webhookStatus === WebhookStatus.Connected ? 'bg-green-100 text-green-700' : 
                  webhookStatus === WebhookStatus.Checking ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
    return (
        <button onClick={() => checkWebhookHealth()} className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-white/20 ${color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${webhookStatus === WebhookStatus.Connected ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-red-500'}`}></span>
            <span>n8n {webhookStatus}</span>
        </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-b-4 border-glen-blue flex justify-between items-center transition-all">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Admin Dashboard</h2>
          <div className="flex items-center space-x-2 mt-1">
             <div className="flex items-center space-x-1 border-r pr-2">
                 <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{onlineCount} Live Now</span>
             </div>
             <StatusBadge />
          </div>
        </div>
        <div className="flex space-x-3">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-gray-100 rounded-2xl text-gray-700 hover:bg-glen-light-blue hover:text-glen-blue transition-colors"><SettingsIcon/></button>
            <button onClick={logout} className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100">Logout</button>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-50 text-center transition-transform hover:scale-105">
              <p className="text-[10px] font-bold text-blue-400 uppercase">New</p>
              <p className="text-2xl font-bold text-blue-600">{counts.new}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-yellow-50 text-center transition-transform hover:scale-105">
              <p className="text-[10px] font-bold text-yellow-500 uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-50 text-center transition-transform hover:scale-105">
              <p className="text-[10px] font-bold text-green-500 uppercase">Done</p>
              <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
          </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-indigo-500 space-y-4">
          <div className="flex justify-between items-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Center</p>
             <button 
                onClick={() => {
                    syncTickets(false);
                    // Notify all other tabs to refresh their data
                    triggerDataSync('general_refresh');
                }} 
                disabled={isSyncing} 
                className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold flex items-center space-x-1 disabled:opacity-50"
            >
                {isSyncing && <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isSyncing ? 'Syncing Staff & Jobs...' : 'Refresh Server Data'}
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowIntel(true)} className="flex flex-col items-center justify-center bg-indigo-500 text-white p-4 rounded-3xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                  <span className="text-sm mb-1">AI Magic Scan</span>
                  <span className="text-[10px] opacity-70">Paste from WhatsApp</span>
              </button>
              <button onClick={() => setShowManual(true)} className="flex flex-col items-center justify-center bg-glen-blue text-white p-4 rounded-3xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">
                  <span className="text-sm mb-1">New Ticket</span>
                  <span className="text-[10px] opacity-70">Manual Entry</span>
              </button>
          </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {['jobs', 'performance', 'ratings'].map(v => (
              <button 
                key={v} 
                onClick={() => setActiveView(v)}
                className={`px-6 py-2 rounded-2xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeView === v ? 'bg-gray-800 text-white shadow-lg' : 'bg-white border text-gray-400 hover:text-gray-800'}`}
              >
                  {v}
              </button>
          ))}
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-xl border min-h-[400px]">
          {activeView === 'jobs' && <ViewJobs onViewTicket={onViewTicket} />}
          {activeView === 'ratings' && <TechnicianRatings />}
          {activeView === 'performance' && <PerformanceView />}
      </div>

      {showManual && <AddTicketModal onClose={() => setShowManual(false)} />}
      {showIntel && <IntelligentAddTicketModal mode="text" onClose={() => setShowIntel(false)} onParsed={(data) => { setShowIntel(false); setShowManual(true); }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /></svg>;

export default AdminDashboard;
