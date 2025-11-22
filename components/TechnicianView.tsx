
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ticket, TicketStatus } from '../types';
import JobCard from './JobCard';

interface TechnicianViewProps {
    onViewTicket: (ticketId: string) => void;
}

const TechnicianView: React.FC<TechnicianViewProps> = ({ onViewTicket }) => {
  const { user, tickets, logout, technicians, syncTickets, isSyncing, lastSyncTime, markAttendance } = useAppContext();
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');
  const [isOnDuty, setIsOnDuty] = useState(false);

  const currentTechnician = technicians.find(t => t.id === user?.id);
  const technicianTickets = tickets.filter(ticket => ticket.technicianId === user?.id);
  const filteredTickets = filter === 'All' ? technicianTickets : technicianTickets.filter(t => t.status === filter);

  const getFilterClasses = (f: TicketStatus | 'All') => 
    `px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
      filter === f ? 'bg-glen-blue text-white' : 'bg-gray-200 text-gray-700'
    }`;
    
  useEffect(() => {
      const savedDutyStatus = localStorage.getItem(`dutyStatus_${user?.id}`);
      if (savedDutyStatus === 'true') {
          setIsOnDuty(true);
      }
  }, [user?.id]);

  // AUTO-SYNC
  useEffect(() => {
      syncTickets(true);
      const intervalId = setInterval(() => {
          syncTickets(true);
      }, 60000);
      return () => clearInterval(intervalId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAttendanceToggle = () => {
      const newStatus = !isOnDuty;
      setIsOnDuty(newStatus);
      localStorage.setItem(`dutyStatus_${user?.id}`, String(newStatus));
      
      const action = newStatus ? 'Clock In' : 'Clock Out';
      markAttendance(action);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">Your Assigned Jobs</p>
              {lastSyncTime && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Updated: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <button onClick={() => syncTickets(false)} disabled={isSyncing} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50" title="Fetch New Jobs">
                {isSyncing ? <SpinnerIcon /> : <RefreshIcon />}
            </button>
            <button onClick={logout} className="text-sm bg-glen-red text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
              Logout
            </button>
        </div>
      </div>

      {/* ATTENDANCE CARD */}
      <div className={`p-4 rounded-lg shadow-md transition-colors duration-300 ${isOnDuty ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center">
              <div>
                  <h3 className="font-bold text-gray-800 flex items-center">
                      {isOnDuty ? (
                          <>
                            <span className="mr-2 text-green-500 text-xl">✅</span>
                            <span>On Duty</span>
                          </>
                      ) : (
                          <span>Off Duty</span>
                      )}
                  </h3>
                  <p className="text-xs text-gray-500">
                      {isOnDuty ? 'You are tracking time.' : 'Click start when hitting the road.'}
                  </p>
              </div>
              <button 
                onClick={handleAttendanceToggle}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${isOnDuty ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                  {isOnDuty ? 'End Day 🛑' : 'Start Day ▶️'}
              </button>
          </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Monthly Points</h3>
        <p className="text-4xl font-bold text-glen-blue mt-1">{currentTechnician?.points || 0}</p>
        <p className="text-xs text-gray-400 mt-1">Keep up the great work!</p>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-md">
        <div className="flex space-x-2 overflow-x-auto pb-2">
            <button className={getFilterClasses('All')} onClick={() => setFilter('All')}>All</button>
            <button className={getFilterClasses(TicketStatus.New)} onClick={() => setFilter(TicketStatus.New)}>New</button>
            <button className={getFilterClasses(TicketStatus.InProgress)} onClick={() => setFilter(TicketStatus.InProgress)}>In Progress</button>
            <button className={getFilterClasses(TicketStatus.Completed)} onClick={() => setFilter(TicketStatus.Completed)}>Completed</button>
        </div>
      </div>

      {filteredTickets.length > 0 ? (
        <div className="space-y-4">
          {filteredTickets.map(ticket => (
            <JobCard key={ticket.id} ticket={ticket} onViewDetails={onViewTicket} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
          <p>No jobs found.</p>
          <p className="text-xs mt-2 text-gray-400">The list updates automatically.</p>
        </div>
      )}
    </div>
  );
};

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4l-4 4M4 20l4-4M1 12h5M18 12h5" />
    </svg>
);
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default TechnicianView;
