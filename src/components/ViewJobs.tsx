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
  const groupedTickets = tickets.reduce<Record<string, Ticket[]>>(
    (groups, ticket) => {
      const date = new Date(ticket.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });

      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(ticket);
      return groups;
    },
    {}
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          Service Pipeline
        </h3>
        <p className="text-[10px] bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-500 uppercase tracking-widest">
          {tickets.length} Total Jobs
        </p>
      </div>

      {tickets.length > 0 ? (
        <div className="space-y-8">
          {(Object.entries(groupedTickets) as [string, Ticket[]][]).map(
            ([date, jobs]) => (
              <div key={date}>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">
                  {date}
                </h4>

                <div className="space-y-4">
                  {jobs.map((ticket) => (
                    <JobCard
                      key={ticket.id}
                      ticket={ticket}
                      onViewTicket={onViewTicket}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No jobs available
        </p>
      )}
    </div>
  );
};

export default ViewJobs;
