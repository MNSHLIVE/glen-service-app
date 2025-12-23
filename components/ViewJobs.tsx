
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
          {/* Fix: Explicitly cast Object.entries result to ensure 'jobs' is correctly inferred as Ticket[] */}
          {(Object.entries(groupedTickets) as Array<[string, Ticket[