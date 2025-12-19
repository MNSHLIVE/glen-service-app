
import React, { useState } from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { useAppContext } from '../context/AppContext';

interface JobCardProps {
  ticket: Ticket;
  onViewDetails: (ticketId: string) => void;
}

const getStatusChip = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.New: return 'bg-blue-100 text-blue-800';
      case TicketStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Completed: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

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

const EscalateModal: React.FC<{ ticket: Ticket, onClose: () => void }> = ({ ticket, onClose }) => {
    const { technicians, reopenTicket } = useAppContext();
    const [techId, setTechId] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!techId) { alert("Please select a senior technician"); return; }
        reopenTicket(ticket.id, techId, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-500 animate-fade-in">
                <div className="bg-red-500 p-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold">Escalate to Senior Technician</h3>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 p-3 rounded-lg text-red-800 text-xs font-medium">
                        ⚠️ Re-opening this job will reset its status to 'New' and flag it as escalated for all staff to see.
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Assign Senior Staff</label>
                        <select 
                            value={techId} 
                            onChange={e => setTechId(e.target.value)} 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">Select Senior Tech...</option>
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Reason for Escalation</label>
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="e.g. Customer not satisfied with cooling, noisy even after repair."
                            rows={3} 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm"
                        ></textarea>
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all shadow-lg"
                    >
                        CONFIRM ESCALATION
                    </button>
                </div>
            </div>
        </div>
    );
};

const JobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
  const { user } = useAppContext();
  
  if (user?.role === UserRole.Admin || user?.role === UserRole.Controller) {
    return <AdminJobCard ticket={ticket} onViewDetails={onViewDetails} />;
  }
  
  return <TechnicianJobCard ticket={ticket} onViewDetails={onViewDetails} />;
};

const AdminJobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
    const { technicians, updateTicket } = useAppContext();
    
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const handleAssign = () => {
        const newTechId = technicians.find(t => t.id !== ticket.technicianId)?.id || ticket.technicianId;
        if (window.confirm(`Re-assign this ticket to another technician?`)) {
            updateTicket({ ...ticket, technicianId: newTechId });
        }
    };
    
    return (
         <>
            <div className={`bg-white rounded-lg shadow-md border overflow-hidden transition-all ${ticket.isEscalated ? 'border-red-500 border-2' : 'border-gray-200'}`}>
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="text-sm font-bold text-gray-800 flex items-center">
                                No: {ticket.id}
                                {ticket.isEscalated && (
                                    <span className="ml-2 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">ESCALATED</span>
                                )}
                             </p>
                             <p className="text-xs text-gray-500">Assigned to: {technician?.name}</p>
                        </div>
                        <div className="text-right">
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(ticket.status)}`}>
                                {ticket.status}
                            </span>
                            <button onClick={() => onViewDetails(ticket.id)} className="text-sm font-bold text-glen-blue mt-1 block">View &gt;</button>
                        </div>
                    </div>
                    
                    {ticket.adminNotes && (
                        <div className={`p-2 rounded text-xs font-medium ${ticket.isEscalated ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                            ⚠️ Note: {ticket.adminNotes}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                       <div>
                            <p className="text-gray-500">Booking Date</p>
                            <p className="font-semibold text-gray-800">{new Date(ticket.serviceBookingDate).toLocaleDateString()}</p>
                       </div>
                       <div>
                            <p className="text-gray-500">Customer Name</p>
                            <p className="font-semibold text-gray-800">{ticket.customerName}</p>
                       </div>
                    </div>
                   <div className="flex space-x-2 pt-2">
                        <button onClick={handleAssign} className="flex-1 bg-glen-blue text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs uppercase">Re-Assign</button>
                        <button onClick={() => setIsUpdateModalOpen(true)} className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-black transition-colors text-xs uppercase">Status</button>
                        <button onClick={() => setIsEscalateModalOpen(true)} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors text-xs uppercase">Escalate</button>
                   </div>
                </div>
            </div>
             {isUpdateModalOpen && <UpdateStatusModal ticket={ticket} onClose={() => setIsUpdateModalOpen(false)} />}
             {isEscalateModalOpen && <EscalateModal ticket={ticket} onClose={() => setIsEscalateModalOpen(false)} />}
         </>
    )
}

const TechnicianJobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border overflow-hidden relative transition-all ${ticket.isEscalated ? 'border-red-500 border-2 bg-red-50/20' : 'border-gray-200'}`}>
      {ticket.isEscalated && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm animate-pulse uppercase tracking-wider">
              ⚠️ Escalated Work
          </div>
      )}
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

        {ticket.adminNotes && (
            <div className={`mt-3 p-2 rounded-r shadow-sm border-l-4 ${ticket.isEscalated ? 'bg-red-100 border-red-600' : 'bg-red-50 border-red-500'}`}>
                <p className={`text-[10px] font-bold uppercase ${ticket.isEscalated ? 'text-red-700' : 'text-red-700'}`}>Special Instruction:</p>
                <p className={`text-sm font-medium ${ticket.isEscalated ? 'text-red-900' : 'text-red-900'}`}>{ticket.adminNotes}</p>
            </div>
        )}

        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <p><strong className="text-gray-500">Complaint:</strong> {ticket.complaint}</p>
          <p><strong className="text-gray-500">Address:</strong> {ticket.address}</p>
          <p><strong className="text-gray-500">Phone:</strong> {ticket.phone}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t flex space-x-2">
             <a href={`tel:${ticket.phone}`} className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                <PhoneIcon />
                <span>Call</span>
            </a>
            <button onClick={() => onViewDetails(ticket.id)} className="flex-1 bg-glen-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors">
                Details
            </button>
        </div>
      </div>
    </div>
  );
};

const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;

export default JobCard;
