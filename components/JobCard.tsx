
import React, { useState } from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { useAppContext } from '../context/AppContext';
import EditTicketModal from './EditTicketModal';

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
        if (!techId) { alert("Please select a senior technician"); return; }
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { technicians, updateTicket, feedback, sendReceipt } = useAppContext();

    const technician = technicians.find(t => t.id === ticket.technicianId);
    const ticketFeedback = feedback.find(fb => fb.ticketId === ticket.id);

    const handleReschedule = () => {
        const newDate = window.prompt("Enter new scheduled date (YYYY-MM-DD):", String(ticket.serviceBookingDate).split('T')[0]);
        if (newDate) {
            updateTicket({ ...ticket, serviceBookingDate: newDate });
        }
    };


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
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-bold text-gray-800">No: {ticket.id}</p>
                                {ticketFeedback && <StarRating rating={ticketFeedback.rating} />}
                                {ticket.isEscalated && (
                                    <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse uppercase">ESCALATED</span>
                                )}
                            </div>
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

                    {ticketFeedback?.comment && (
                        <div className="bg-blue-50 p-2 rounded text-[11px] border-l-4 border-blue-400 text-blue-800 italic">
                            " {ticketFeedback.comment} "
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-gray-500">Customer</p>
                            <p className="font-semibold text-gray-800 flex items-center">
                                {ticket.customerName}
                                <a
                                    href={`https://wa.me/91${ticket.phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </a>
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-semibold text-gray-800">{ticket.phone}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button onClick={handleAssign} className="flex-1 min-w-[80px] bg-glen-blue text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors text-[10px] uppercase">Re-Assign</button>
                        <button onClick={() => setIsUpdateModalOpen(true)} className="flex-1 min-w-[80px] bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-black transition-colors text-[10px] uppercase">Status</button>
                        <button onClick={() => setIsEditModalOpen(true)} className="flex-1 min-w-[80px] bg-blue-100 text-blue-800 font-bold py-2 rounded-lg hover:bg-blue-200 transition-colors text-[10px] uppercase">Edit</button>
                        <button onClick={handleReschedule} className="flex-1 min-w-[80px] bg-orange-100 text-orange-800 font-bold py-2 rounded-lg hover:bg-orange-200 transition-colors text-[10px] uppercase">Reschedule</button>
                        {ticket.status === TicketStatus.Completed && (
                            <button onClick={() => sendReceipt(ticket.id)} className="flex-1 min-w-[80px] bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors text-[10px] uppercase flex items-center justify-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                Thank You
                            </button>
                        )}
                        <button onClick={() => setIsEscalateModalOpen(true)} className="flex-1 min-w-[80px] bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors text-[10px] uppercase">Escalate</button>
                    </div>
                </div>
            </div>
            {isUpdateModalOpen && <UpdateStatusModal ticket={ticket} onClose={() => setIsUpdateModalOpen(false)} />}
            {isEscalateModalOpen && <EscalateModal ticket={ticket} onClose={() => setIsEscalateModalOpen(false)} />}
            {isEditModalOpen && <EditTicketModal ticket={ticket} onClose={() => setIsEditModalOpen(false)} />}
        </>
    )
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);
const TechnicianJobCard: React.FC<JobCardProps> = ({ ticket, onViewDetails }) => {
    const { updateTicket, user } = useAppContext();
    const [localTicket, setLocalTicket] = useState(ticket);
    const [isSaving, setIsSaving] = useState(false);

    const handleFieldChange = (field: keyof Ticket, value: any) => {
        setLocalTicket(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckIn = async () => {
        try {
            setIsSaving(true);
            await updateTicket({
                ...ticket,
                status: TicketStatus.InProgress,
                jobStartedAt: new Date().toISOString()
            });
            alert("✅ Checked into job! Status: IN PROGRESS");
        } catch (err) {
            alert("❌ Failed to check in");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateDetails = async (newStatus?: TicketStatus) => {
        try {
            setIsSaving(true);
            const updatePayload: Partial<Ticket> = {
                id: ticket.id,
                status: newStatus || ticket.status,
                productName: localTicket.productName,
                serialNumber: localTicket.serialNumber,
                purchaseDate: localTicket.purchaseDate,
                manualWarrantyStatus: localTicket.manualWarrantyStatus,
                remarks: localTicket.remarks,
                productUpdatedBy: 'Technician',
                productUpdatedAt: new Date().toISOString(),
                technicianId: ticket.technicianId
            };

            if (newStatus === TicketStatus.Completed) {
                // Ensure remarks are added
                if (!localTicket.remarks) {
                    alert("Please add remarks/work summary before completing.");
                    setIsSaving(false);
                    return;
                }
            }

            await updateTicket(updatePayload);
            alert(newStatus === TicketStatus.Completed ? "✅ Job Completed!" : "✅ Details Updated Successfully!");
        } catch (err) {
            alert("❌ Update failed");
        } finally {
            setIsSaving(false);
        }
    };

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
                        <p className="text-xs text-gray-400 font-bold uppercase">Ticket ID: {ticket.id}</p>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${getStatusChip(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>

                {ticket.adminNotes && (
                    <div className={`mt-3 p-2 rounded-r shadow-sm border-l-4 ${ticket.isEscalated ? 'bg-red-100 border-red-600' : 'bg-red-50 border-red-500'}`}>
                        <p className="text-[10px] font-bold uppercase text-red-700">Special Instruction:</p>
                        <p className="text-sm font-medium text-red-900">{ticket.adminNotes}</p>
                    </div>
                )}

                <div className="mt-4 space-y-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-xs">Category:</span>
                        <span className="font-bold">{ticket.serviceCategory}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs block">Address:</span>
                        <span className="font-medium">{ticket.address}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-500 text-xs">Phone:</span>
                        <span className="font-bold text-blue-600">{ticket.phone}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs block">Complaint:</span>
                        <span className="text-gray-800 italic">"{ticket.complaint}"</span>
                    </div>
                </div>

                {/* --- JOB LIFECYCLE CONTROLS --- */}
                {ticket.status === TicketStatus.New ? (
                    <div className="mt-6">
                        <button 
                            onClick={handleCheckIn}
                            disabled={isSaving}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>CHECK-IN TO JOB</span>
                        </button>
                    </div>
                ) : ticket.status === TicketStatus.InProgress ? (
                    <div className="mt-6 border-t pt-4 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Update Product & Job Details</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ticket.warrantyApplicable ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                {ticket.warrantyApplicable ? 'WARRANTY' : 'OUT-OF-WARRANTY'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Product Name</label>
                                <input 
                                    value={localTicket.productName || ''} 
                                    onChange={(e) => handleFieldChange('productName', e.target.value)}
                                    placeholder="Enter verified product name"
                                    className="mt-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Serial No</label>
                                    <input 
                                        value={localTicket.serialNumber || ''} 
                                        onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
                                        placeholder="Serial #"
                                        className="mt-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Purchase Date</label>
                                    <input 
                                        type="date"
                                        value={localTicket.purchaseDate ? String(localTicket.purchaseDate).split('T')[0] : ''} 
                                        onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
                                        className="mt-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Work Done / Remarks *</label>
                                <textarea 
                                    value={localTicket.remarks || ''} 
                                    onChange={(e) => handleFieldChange('remarks', e.target.value)}
                                    placeholder="Describe what you did (Required for completion)..."
                                    rows={3}
                                    className="mt-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            </div>

                            <div className="flex space-x-2 pt-2">
                                <button 
                                    onClick={() => handleUpdateDetails()}
                                    disabled={isSaving}
                                    className="flex-1 bg-gray-800 text-white text-xs font-bold py-4 rounded-xl shadow hover:bg-black transition-all"
                                >
                                    SAVE DETAILS
                                </button>
                                <button 
                                    onClick={() => handleUpdateDetails(TicketStatus.Completed)}
                                    disabled={isSaving}
                                    className="flex-1 bg-green-600 text-white text-xs font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-95"
                                >
                                    COMPLETE JOB
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 border-t pt-4">
                        <div className="bg-green-50 p-3 rounded-xl flex items-center space-x-3 text-green-800">
                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                           <span className="text-xs font-bold uppercase">This job is already completed.</span>
                        </div>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t flex space-x-2">
                    <a href={`tel:${ticket.phone}`} className="flex-1 bg-green-50 text-green-600 font-bold py-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-2 border border-green-200">
                        <PhoneIcon />
                        <span className="text-xs uppercase">Call</span>
                    </a>
                    <button onClick={() => onViewDetails(ticket.id)} className="flex-1 bg-blue-50 text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-100 transition-colors text-xs uppercase border border-blue-200">
                        Details
                    </button>
                    {ticket.status === TicketStatus.Completed && (
                        <button
                            onClick={() => useAppContext().sendReceipt(ticket.id)}
                            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-xs uppercase"
                        >
                            WhatsApp
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;

export default JobCard;
