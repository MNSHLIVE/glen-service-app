import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import JobCard from './JobCard';

interface TechnicianViewProps {
  onViewTicket: (ticketId: string) => void;
}

const TechnicianView: React.FC<TechnicianViewProps> = ({ onViewTicket }) => {
  const { user, tickets, logout, syncTickets, isSyncing } = useAppContext();
  const [filter, setFilter] = useState<'All' | 'New' | 'InProgress' | 'Completed'>('All');

  const technicianTickets = tickets.filter(ticket => ticket.technicianId === user?.id);

  const filteredTickets = technicianTickets.filter(t => {
    if (filter === 'All') return true;
    return t.status.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-b-4 border-blue-600 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <p className="text-xs text-gray-500">You have {technicianTickets.length} jobs assigned.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => syncTickets()} disabled={isSyncing} className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M20 4l-4 4M4 20l4-4" />
            </svg>
          </button>
          <button onClick={logout} className="text-xs bg-red-50 text-red-600 font-bold py-2 px-4 rounded-xl">Logout</button>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
        {['All', 'New', 'InProgress', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-400'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <JobCard key={ticket.id} ticket={ticket} onViewDetails={onViewTicket} />
          ))
        ) : (
          <div className="bg-white p-10 rounded-2xl shadow-md text-center text-gray-400">
            <p>No jobs found in this section.</p>
            <button onClick={() => syncTickets()} className="text-blue-600 text-xs mt-2 underline">Refresh List</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianView;
