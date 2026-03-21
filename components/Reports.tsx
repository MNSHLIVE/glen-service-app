
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Ticket, TicketStatus, ServiceChecklist, ReplacedPart, PaymentStatus } from '../types';
import AddPartModal from './UpdateJobModal';
import { APP_CONFIG } from '../config';

// Receipt Modal
const ReceiptModal: React.FC<{ ticket: Ticket, onClose: () => void }> = ({ ticket, onClose }) => {
    const { technicians, sendReceipt } = useAppContext();
    const [isSending, setIsSending] = useState(false);

    const technician = technicians.find(t => t.id === ticket.technicianId);
    const { BRANDING } = APP_CONFIG;

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
                        <h2 className="text-2xl font-bold text-gray-900">{BRANDING?.companyName || 'Pandit Glen Service'}</h2>
                        <p className="text-sm text-gray-500">{BRANDING?.tagline || 'Your Trusted Appliance Experts'}</p>
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
                            <p className="text-gray-500">Service Remarks:</p>
                            <p className="font-semibold text-gray-800 p-2 bg-gray-50 rounded-md">{ticket.remarks || ticket.workDone}</p>
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
                            <p>Thank you for choosing {BRANDING?.companyName || 'Pandit Glen Service'}!</p>
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
    const [previewUrl, setPreviewUrl] = useState<string | null>(ticket.billImageUrl || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, you'd upload this to Supabase Storage
            // For now, we'll simulate with a fake URL or base64 if needed, 
            // but the requirement is to store it. 
            // I'll set a placeholder URL to represent the upload.
            const fakeUrl = `https://storage.glen.com/bills/${ticket.id}_${Date.now()}.jpg`;
            handleFieldChange('billImageUrl', fakeUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

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
        if (window.confirm('Are you sure you want to remove this part?')) {
            setEditableTicket(prev => {
                const newParts = [...(prev.partsReplaced || [])];
                newParts.splice(index, 1);
                return { ...prev, partsReplaced: newParts };
            });
        }
    };

    const handleCompleteJob = () => {
        if (!editableTicket.remarks || editableTicket.remarks.trim() === '') {
            alert('Please add remarks/work summary before completing.');
            return;
        }
        const finalTicket = {
            id: editableTicket.id,
            status: TicketStatus.Completed,
            remarks: editableTicket.remarks,
            paymentStatus: editableTicket.paymentStatus,
            amountCollected: editableTicket.amountCollected,
            partsReplaced: editableTicket.partsReplaced,
            manualWarrantyStatus: editableTicket.manualWarrantyStatus,
            serialNumber: editableTicket.serialNumber,
            purchaseDate: editableTicket.purchaseDate,
            productName: editableTicket.productName,
            productUpdatedBy: 'Technician',
            productUpdatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
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
                    <label className="block text-sm font-medium text-gray-700">Remarks / Action Taken*</label>
                    <textarea value={editableTicket.remarks || ''} onChange={e => handleFieldChange('remarks', e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g. Gas valve replaced" required></textarea>
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
                        <input type="number" value={editableTicket.amountCollected || ''} onChange={e => handleFieldChange('amountCollected', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="e.g., 500" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
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
                            <span className="ml-3 font-bold text-glen-red">FREE VISIT</span>
                        </label>
                    </div>
                </div>

                {/* --- Manual Warranty & Bill Section --- */}
                <div className="border-t pt-4 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Warranty Verification (Bill)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Actual Warranty Status</label>
                            <div className="flex mt-2 p-1 bg-gray-100 rounded-lg">
                                <button 
                                    onClick={() => handleFieldChange('manualWarrantyStatus', 'Under')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${editableTicket.manualWarrantyStatus === 'Under' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    UNDER
                                </button>
                                <button 
                                    onClick={() => handleFieldChange('manualWarrantyStatus', 'Over')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${editableTicket.manualWarrantyStatus === 'Over' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    OVER
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Purchase Date (Manual)</label>
                            <input 
                                type="date" 
                                value={editableTicket.purchaseDate ? String(editableTicket.purchaseDate).split('T')[0] : ''} 
                                onChange={e => handleFieldChange('purchaseDate', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product / Serial No</label>
                        <input 
                            type="text" 
                            value={editableTicket.serialNumber || ''} 
                            onChange={e => handleFieldChange('serialNumber', e.target.value)}
                            placeholder="Enter Serial Number from Bill"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Upload/Capture Bill Image</label>
                        <div className="flex items-center space-x-4">
                            <label className="flex-1 cursor-pointer bg-blue-50 border-2 border-dashed border-blue-200 p-4 rounded-xl flex flex-col items-center justify-center hover:bg-blue-100 transition-all">
                                <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Click to Capture Bill</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                            </label>
                            {previewUrl && (
                                <div className="w-20 h-20 rounded-lg border overflow-hidden shadow-sm">
                                    <img src={previewUrl} alt="Bill Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
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

// --- Reusable Detail Components for Admin View ---
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null | boolean; children?: React.ReactNode; }> = ({ label, value, children }) => (
    <div className="grid grid-cols-3 gap-4 text-sm">
        <p className="text-gray-600 col-span-1">{label}</p>
        <div className="text-gray-900 font-medium col-span-2">
            {children || (value === true ? 'Yes' : value === false ? 'No' : value || 'N/A')}
        </div>
    </div>
);

// --- OVERHAULED Admin/Controller detailed view ---
const AdminTicketDetails: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const { technicians } = useAppContext();
    const assignedTechnician = technicians.find(t => t.id === ticket.technicianId);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <DetailSection title="Customer & Job Info">
                <DetailItem label="Customer" value={ticket.customerName} />
                <DetailItem label="Phone">
                    <div className="flex items-center space-x-2">
                        <span>{ticket.phone}</span>
                        <a
                            href={`https://wa.me/91${ticket.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </a>
                    </div>
                </DetailItem>
                <DetailItem label="Address" value={ticket.address} />
                <DetailItem label="Booking Date" value={new Date(ticket.serviceBookingDate).toLocaleString()} />
                <DetailItem label="Preferred Time" value={ticket.preferredTime} />
                <DetailItem label="Complaint" value={ticket.complaint} />
                <DetailItem label="Assigned To" value={assignedTechnician?.name} />
            </DetailSection>

            {ticket.status === TicketStatus.Completed && (
                <DetailSection title="Completion Summary">
                    <DetailItem label="Completed At" value={ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : 'N/A'} />
                    <DetailItem label="Service Remarks" value={ticket.remarks || ticket.workDone} />
                    <DetailItem label="Payment Mode" value={ticket.paymentStatus} />
                    <DetailItem label="Amount Paid">
                        <span className="font-bold text-glen-blue">₹{ticket.amountCollected?.toFixed(2) || '0.00'}</span>
                    </DetailItem>
                    <DetailItem label="AMC Discussed" value={ticket.serviceChecklist?.amcDiscussion} />
                    <DetailItem label="FREE VISIT" value={ticket.freeService} />
                    {ticket.manualWarrantyStatus && (
                        <DetailItem label="Warranty (Verified)">
                            <span className={`font-bold ${ticket.manualWarrantyStatus === 'Under' ? 'text-green-600' : 'text-red-600'}`}>
                                {ticket.manualWarrantyStatus.toUpperCase()} WARRANTY
                            </span>
                        </DetailItem>
                    )}
                    {ticket.billImageUrl && (
                        <DetailItem label="Bill Copy">
                            <a href={ticket.billImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View Bill Image</a>
                        </DetailItem>
                    )}
                </DetailSection>
            )}

            {ticket.partsReplaced && ticket.partsReplaced.length > 0 && (
                <DetailSection title="Parts Replaced">
                    <div className="space-y-2">
                        {ticket.partsReplaced.map((part, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                                <p className="font-semibold">{part.name}</p>
                                <p className="text-xs text-gray-600">
                                    Price: ₹{part.price} | Warranty: {part.warrantyDuration} | Category: {part.category}
                                </p>
                            </div>
                        ))}
                    </div>
                </DetailSection>
            )}

            {ticket.status === TicketStatus.Completed && (
                <div className="mt-4 pt-4 border-t">
                    <button onClick={() => setIsReceiptModalOpen(true)} className="w-full bg-glen-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">
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
