
import React from 'react';
import { useAppContext } from '../context/AppContext';
import JobCard from './JobCard';
import { Ticket } from '../types';

interface ViewJobsProps {
    onViewTicket: (ticketId: string) => void;
}

const ViewJobs: React.FC<ViewJobsProps> = ({ onViewTicket }) => {
  const { tickets } = useAppContext();

  // Group tickets by date
  // Fix: Explicitly type the reduce accumulator to ensure groupedTickets is correctly typed for Object.entries
  const groupedTickets = tickets.reduce<{ [key: string]: Ticket[] }>((groups, ticket) => {
    const date = new Date(ticket.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let key = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(ticket);
    return groups;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Service Pipeline</h3>
        <p className="text-[10px] bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-500 uppercase tracking-widest">
            {tickets.length} Total Jobs
        </p>
      </div>
      
      {tickets.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedTickets).map(([date, jobs]) => (
            <div key={date} className="space-y-4">
              <h4 className="text-[11px] font-bold text-glen-blue uppercase tracking-[0.2em] border-b border-glen-blue/10 pb-2 ml-1">
                {date}
              </h4>
              <div className="space-y-4">
                {/* Fix: jobs is now correctly typed as Ticket[] through the typed groupedTickets object */}
                {jobs.map(ticket => (
                  <JobCard key={ticket.id} ticket={ticket} onViewDetails={onViewTicket} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-gray-500 font-bold">No active tickets</p>
          <p className="text-xs text-gray-400 mt-1">Assignments from n8n will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default ViewJobs;
