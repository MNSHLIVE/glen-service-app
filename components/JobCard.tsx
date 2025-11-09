
import React, { useState } from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { useAppContext } from '../context/AppContext';

interface JobCardProps {
  ticket: Ticket;
  onViewDetails: (ticketId: string) => void;
}

// Update Status Modal for Admin, defined within JobCard component file
const UpdateStatusModal: React.FC<{ ticket: Ticket, onClose: () => void }> = ({ ticket, onClose }) => {
    const { updateTicket } = useAppContext();
    const [status, setStatus] = useState(ticket.status);
    const [comments, setComments] = useState(ticket.comments || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateTicket({ ...ticket, status, comments });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Update Ticket Status</h3>
                        <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as TicketStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Comments</label>
                            <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"></textarea>
                        </div>
                        <div className="pt-2">
                             <button type="submit" className="w-full bg-glen-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors">
                                SUBMIT
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const JobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
  const { user } = useAppContext();
  
  if (user?.role === UserRole.Admin || user?.role === UserRole.Coordinator) {
    return <AdminJobCard ticket={ticket} onViewDetails={onViewDetails} />;
  }
  
  return <TechnicianJobCard ticket={ticket} onViewDetails={onViewDetails} />;
};


// Admin-specific card design
const AdminJobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const { technicians, updateTicket } = useAppContext();
    
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const handleAssign = () => {
        // Mock assignment logic
        const newTechId = technicians.find(t => t.id !== ticket.technicianId)?.id || ticket.technicianId;
        if (window.confirm(`Re-assign this ticket to another technician?`)) {
            updateTicket({ ...ticket, technicianId: newTechId });
        }
    };
    
    return (
         <>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="text-sm font-bold text-gray-800">No: {ticket.id}</p>
                             <p className="text-xs text-gray-500">Assigned to: {technician?.name}</p>
                        </div>
                        <button onClick={() => onViewDetails(ticket.id)} className="text-sm font-bold text-glen-blue">View &gt;</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                       <div>
                            <p className="text-gray-500">Service Booking Date</p>
                            <p className="font-semibold text-gray-800">{new Date(ticket.serviceBookingDate).toLocaleDateString()}</p>
                       </div>
                       <div>
                            <p className="text-gray-500">Preferred Time</p>
                            <p className="font-semibold text-gray-800">{ticket.preferredTime}</p>
                       </div>
                       <div>
                            <p className="text-gray-500">Service Category</p>
                            <p className="font-semibold text-gray-800">{ticket.serviceCategory}</p>
                       </div>
                       <div>
                            <p className="text-gray-500">Customer Name</p>
                            <p className="font-semibold text-gray-800">{ticket.customerName}</p>
                       </div>
                    </div>
                     <div>
                        <p className="text-gray-500 text-sm">Customer Mobile</p>
                        <div className="flex items-center space-x-4">
                            <p className="font-semibold text-gray-800 text-sm">{ticket.phone}</p>
                            <a href={`tel:${ticket.phone}`} className="text-green-500"><PhoneIcon /></a>
                            <a href={`https://wa.me/${ticket.phone}`} target="_blank" rel="noopener noreferrer" className="text-green-500"><WhatsAppIcon/></a>
                            <a href={`sms:${ticket.phone}`} className="text-blue-500"><MessageIcon/></a>
                        </div>
                   </div>
                   <div className="flex space-x-2 pt-2">
                        <button onClick={handleAssign} className="flex-1 bg-glen-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">ASSIGN</button>
                        <button onClick={() => setIsUpdateModalOpen(true)} className="flex-1 bg-glen-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">UPDATE STATUS</button>
                   </div>
                </div>
            </div>
             {isUpdateModalOpen && <UpdateStatusModal ticket={ticket} onClose={() => setIsUpdateModalOpen(false)} />}
         </>
    )
}

// Technician-specific card design
const TechnicianJobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
  const getStatusChip = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.New: return 'bg-blue-100 text-blue-800';
      case TicketStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Completed: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
              <p className="font-bold text-lg text-gray-800">{ticket.customerName}</p>
              <p className="text-sm text-gray-500">{ticket.id}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <p><strong className="text-gray-500">Complaint:</strong> {ticket.complaint}</p>
          <p><strong className="text-gray-500">Address:</strong> {ticket.address}</p>
          <p><strong className="text-gray-500">Time:</strong> {ticket.preferredTime}</p>
           <div className="flex items-center space-x-2">
                <strong className="text-gray-500">Phone:</strong>
                <span>{ticket.phone}</span>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex space-x-2">
             <a href={`tel:${ticket.phone}`} className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                <PhoneIcon />
                <span>Call Customer</span>
            </a>
            <button onClick={() => onViewDetails(ticket.id)} className="flex-1 bg-glen-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                View Details
            </button>
        </div>
      </div>
    </div>
  );
};

const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.521.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>;
const MessageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h6a2 2 0 002-2V5zm-6.414 3.586a.5.5 0 01.707 0l2 2a.5.5 0 010 .707l-2 2a.5.5 0 01-.707-.707L12.586 12l-1-1a.5.5 0 010-.707zM7 9a.5.5 0 010 .707l-2 2a.5.5 0 01-.707 0l-2-2a.5.5 0 01.707-.707L4 9.586l1-1a.5.5 0 01.707 0z" clipRule="evenodd" /></svg>;

export default JobCard;