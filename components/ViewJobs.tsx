
import React from 'react';
import { useAppContext } from '../context/AppContext';
import JobCard from './JobCard';

interface ViewJobsProps {
    onViewTicket: (ticketId: string) => void;
}

const ViewJobs: React.FC<ViewJobsProps> = ({ onViewTicket }) => {
  const { tickets } = useAppContext();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">All Service Jobs</h3>
        <p className="text-sm text-gray-500">Page: 1/1 | Total Records: {tickets.length}</p>
      </div>
      
      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <JobCard key={ticket.id} ticket={ticket} onViewDetails={onViewTicket} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>No tickets have been created yet.</p>
          <p className="text-sm">Click "Add New Ticket" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ViewJobs;