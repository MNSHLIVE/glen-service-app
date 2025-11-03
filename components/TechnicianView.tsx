
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ticket, TicketStatus } from '../types';
import JobCard from './JobCard';

interface TechnicianViewProps {
    onViewTicket: (ticketId: string) => void;
}

const TechnicianView: React.FC<TechnicianViewProps> = ({ onViewTicket }) => {
  const { user, tickets, logout } = useAppContext();
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');

  const technicianTickets = tickets.filter(ticket => ticket.technicianId === user?.id);
  const filteredTickets = filter === 'All' ? technicianTickets : technicianTickets.filter(t => t.status === filter);

  const getFilterClasses = (f: TicketStatus | 'All') => 
    `px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
      filter === f ? 'bg-glen-blue text-white' : 'bg-gray-200 text-gray-700'
    }`;
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <p className="text-sm text-gray-500">Your Assigned Jobs</p>
        </div>
        <button onClick={logout} className="text-sm bg-glen-red text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
          Logout
        </button>
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
          <p>No jobs found for this filter.</p>
        </div>
      )}
    </div>
  );
};

export default TechnicianView;