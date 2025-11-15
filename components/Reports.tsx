import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Ticket, TicketStatus, ServiceChecklist, ReplacedPart, PaymentStatus } from '../types';
import AddPartModal from './UpdateJobModal';

// Receipt Modal (No Changes)
const ReceiptModal: React.FC<{ ticket: Ticket, onClose: () => void }> = ({ ticket, onClose }) => {
    const { technicians, sendReceipt } = useAppContext();
    const [isSending, setIsSending] = useState(false);
    
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const handleSend = () => {
        setIsSending(true);
        sendReceipt(ticket.id);
        setTimeout(() => {
            setIsSending(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Pandit Glen Service</h2>
                        <p className="text-sm text-gray-500">Your Trusted Appliance Experts</p>
                    </div>
                    <div className="text-center border-b border-t py-2 mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 uppercase">Payment Receipt</h3>
                    </div>

                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ticket No:</span>
                            <span className="font-semibold text-gray-800">{ticket.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-semibold text-gray-800">{new Date(ticket.completedAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <p className="text-gray-500">Customer:</p>
                            <p className="font-semibold text-gray-800">{ticket.customerName}</p>
                            <p className="text-gray-700">{ticket.address}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Work Done:</p>
                            <p className="font-semibold text-gray-800 p-2 bg-gray-50 rounded-md">{ticket.workDone}</p>
                        </div>
                        {ticket.partsReplaced && ticket.partsReplaced.length > 0 && (
                             <div>
                                <p className="text-gray-500 mb-1">Parts Replaced:</p>
                                <div className="border rounded-md">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-xs text-gray-600">
                                                <th className="p-2">Part Name</th>
                                                <th className="p-2">Warranty</th>
                                                <th className="p-2 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {ticket.partsReplaced.map((part, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2 font-medium">{part.name}</td>
                                                <td className="p-2">{part.warrantyDuration}</td>
                                                <td className="p-2 text-right">₹{part.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        <div className="border-t pt-4 mt-4 space-y-2">
                             <div className="flex justify-between font-semibold">
                                <span className="text-gray-600">Payment Mode:</span>
                                <span>{ticket.paymentStatus}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-gray-800">Amount Paid:</span>
                                <span className="text-glen-blue">₹{ticket.amountCollected?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                         <div className="text-center text-xs text-gray-500 pt-4">
                            <p>Serviced by: {technician?.name}</p>
                            <p>Thank you for choosing Pandit Glen Service!</p>
                        </div>
                    </div>
                     <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} disabled={isSending} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSend} disabled={isSending} className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
                            {isSending ? 'Sending...' : 'Send Receipt'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface TicketDetailsProps {
    ticketId: string;
    onBack: () => void;
}

// NEW: Single, streamlined view for Technicians
const TechnicianUpdateView: React.FC<{ ticket: Ticket, onBack: () => void }> = ({ ticket, onBack }) => {
    const { updateTicket } = useAppContext();
    const [editableTicket, setEditableTicket] = useState<Ticket>(ticket);
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);

    const handleFieldChange = (field: keyof Ticket, value: any) => {
        setEditableTicket(prev => ({ ...prev, [field]: value }));
    };

    const handleChecklistChange = (field: keyof ServiceChecklist) => {
        setEditableTicket(prev => {
            const currentChecklist = prev.serviceChecklist || { amcDiscussion: false };
            return {
                ...prev,
                serviceChecklist: {
                    ...currentChecklist,
                    [field]: !currentChecklist[field],
                }
            };
        });
    };
    
    const handleAddPart = (newPart: ReplacedPart) => {
        setEditableTicket(prev => ({
            ...prev,
            partsReplaced: [...(prev.partsReplaced || []), newPart]
        }));
    };
    
    const handleRemovePart = (index: number) => {
        if(window.confirm('Are you sure you want to remove this part?')){
            setEditableTicket(prev => {
                const newParts = [...(prev.partsReplaced || [])];
                newParts.splice(index, 1);
                return { ...prev, partsReplaced: newParts };
            });
        }
    };

    const handleCompleteJob = () => {
        if (!editableTicket.workDone || editableTicket.workDone.trim() === '') {
            alert('Please describe the work done before completing the job.');
            return;
        }
        const finalTicket = {
            ...editableTicket,
            status: TicketStatus.Completed,
            completedAt: new Date()
        };
        updateTicket(finalTicket);
        onBack();
    };
    
    return (
      <div className="space-y-6">
          {/* --- Parts Update Section --- */}
          <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Parts Details</h4>
                  <button onClick={() => setIsAddPartModalOpen(true)} className="bg-glen-blue text-white font-bold py-2 px-4 rounded-lg text-sm">+ Add Part</button>
              </div>
              {(!editableTicket.partsReplaced || editableTicket.partsReplaced.length === 0) ? (
                   <p className="text-center text-gray-500 py-4">No parts have been added yet.</p>
              ) : (
                  <div className="space-y-3">
                      {editableTicket.partsReplaced.map((part, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                  <p className="font-semibold">{part.name} ({part.category})</p>
                                  <p className="text-sm text-gray-600">Price: ₹{part.price} | Warranty: {part.warrantyDuration}</p>
                              </div>
                              <button onClick={() => handleRemovePart(index)} className="text-red-500 hover:text-red-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          
          {/* --- Job Completion Section --- */}
          <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
               <h4 className="text-lg font-semibold text-gray-800">Work Summary</h4>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Work Done (Action)*</label>
                  <textarea value={editableTicket.workDone || ''} onChange={e => handleFieldChange('workDone', e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Collected</label>
                      <select value={editableTicket.paymentStatus || PaymentStatus.Pending} onChange={e => handleFieldChange('paymentStatus', e.target.value as PaymentStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                          {Object.values(PaymentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input type="number" value={editableTicket.amountCollected || ''} onChange={e => handleFieldChange('amountCollected', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="e.g., 500" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
              </div>
               {/* --- Final Checklist --- */}
              <div>
                 <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Final Checklist</h4>
                 <div className="space-y-2">
                     <label className="flex items-center text-sm text-gray-800 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={editableTicket.serviceChecklist?.amcDiscussion || false} onChange={() => handleChecklistChange('amcDiscussion')} className="h-4 w-4 text-glen-blue focus:ring-glen-blue border-gray-300 rounded" />
                          <span className="ml-3">AMC discussion, if any</span>
                      </label>
                      <label className="flex items-center text-sm text-gray-800 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={editableTicket.freeService || false} onChange={e => handleFieldChange('freeService', e.target.checked)} className="h-4 w-4 text-glen-blue focus:ring-glen-blue border-gray-300 rounded" />
                          <span className="ml-3 font-medium">Mark as Free Service</span>
                      </label>
                 </div>
              </div>
          </div>
          
          <div className="pt-4">
              <button type="button" onClick={handleCompleteJob} className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg shadow-lg">
                  Complete Job & Save
              </button>
          </div>

          {isAddPartModalOpen && <AddPartModal onClose={() => setIsAddPartModalOpen(false)} onAddPart={handleAddPart} />}
      </div>
    );
};


// Admin/Controller detailed view (existing multi-tab view)
const AdminTicketDetails: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800">Ticket Details</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                {JSON.stringify(ticket, (key, value) => {
                    if (value instanceof Date) {
                        return value.toLocaleString();
                    }
                    return value;
                }, 2)}
            </pre>
            {ticket.status === TicketStatus.Completed && (
                 <div className="mt-4">
                    <button onClick={() => setIsReceiptModalOpen(true)} className="w-full bg-glen-blue text-white font-bold py-3 px-4 rounded-lg">
                        Generate & Send Receipt
                    </button>
                 </div>
            )}
            {isReceiptModalOpen && <ReceiptModal ticket={ticket} onClose={() => setIsReceiptModalOpen(false)} />}
        </div>
    );
};


const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId, onBack }) => {
  const { tickets, user } = useAppContext();
  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p className="text-gray-600 mt-2">Ticket not found. It might have been deleted or there was a sync error.</p>
        <button onClick={onBack} className="mt-4 bg-glen-blue text-white font-bold py-2 px-4 rounded-lg">
          &larr; Back to List
        </button>
      </div>
    );
  }

  const isTechnician = user?.role === UserRole.Technician;
  
  const getStatusChip = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.New: return 'bg-blue-100 text-blue-800';
      case TicketStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Completed: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{ticket.customerName}</h2>
                    <p className="text-sm text-gray-500">{ticket.id}</p>
                </div>
                 <button onClick={onBack} className="text-sm text-glen-blue font-semibold">&larr; Back to List</button>
            </div>
            <div className="mt-2">
                 <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(ticket.status)}`}>
                    Status: {ticket.status}
                </span>
            </div>
        </div>
        
        {isTechnician ? (
            <TechnicianUpdateView ticket={ticket} onBack={onBack} />
        ) : (
            <AdminTicketDetails ticket={ticket} />
        )}

    </div>
  );
};

export default TicketDetails;
