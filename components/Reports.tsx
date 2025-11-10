import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Ticket, TicketStatus, ServiceChecklist, ReplacedPart, PaymentStatus } from '../types';
import AddPartModal from './UpdateJobModal';

// Redesigned Receipt Modal
const ReceiptModal: React.FC<{ ticket: Ticket, onClose: () => void }> = ({ ticket, onClose }) => {
    const { technicians, sendReceipt, user } = useAppContext();
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
                        <h2 className="text-2xl font-bold text-gray-900">XYZ Glen Service Partner</h2>
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
                            <p>Serviced by: {technician?.name || user?.name}</p>
                            <p>Thank you for choosing XYZ Glen Service Partner!</p>
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

type DetailsTab = 'DETAILS' | 'PART_UPDATE' | 'SERVICE_CHECKLIST' | 'JOB_COMPLETION';

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId, onBack }) => {
    const { tickets, user, updateTicket } = useAppContext();
    const originalTicket = tickets.find(t => t.id === ticketId);

    const [editableTicket, setEditableTicket] = useState<Ticket | null>(originalTicket || null);
    const [activeTab, setActiveTab] = useState<DetailsTab>(user?.role === UserRole.Admin ? 'DETAILS' : 'PART_UPDATE');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);

    useEffect(() => {
        const ticket = tickets.find(t => t.id === ticketId);
        setEditableTicket(ticket ? {...ticket} : null);
    }, [ticketId, tickets]);

    if (!editableTicket) {
        return (
            <div>
                <button onClick={onBack} className="text-glen-blue mb-4">&larr; Back to list</button>
                <p>Ticket not found.</p>
            </div>
        )
    }

    const handleSaveChanges = () => {
        updateTicket(editableTicket);
        // Optionally show a toast message
    }

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        alert("PDF Generation logic would be triggered here via webhook.");
        setIsGeneratingPdf(false);
    }
    
    const handleAddPart = (newPart: ReplacedPart) => {
        setEditableTicket(prev => prev ? ({
            ...prev,
            partsReplaced: [...(prev.partsReplaced || []), newPart]
        }) : null);
    }

    const TABS: { id: DetailsTab; label: string; roles: UserRole[] }[] = [
        { id: 'DETAILS', label: 'Details', roles: [UserRole.Admin] },
        { id: 'PART_UPDATE', label: 'Part Update', roles: [UserRole.Admin, UserRole.Technician] },
        { id: 'SERVICE_CHECKLIST', label: 'Service Checklist', roles: [UserRole.Admin, UserRole.Technician] },
        { id: 'JOB_COMPLETION', label: 'Job Completion', roles: [UserRole.Admin, UserRole.Technician] },
    ];
    
    const availableTabs = TABS.filter(tab => user && tab.roles.includes(user.role));

    const tabClasses = (tab: DetailsTab) => 
        `px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
            activeTab === tab ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500 hover:bg-gray-100'
        }`;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-glen-blue hover:underline">&larr; Back to list</button>
                <div className="space-x-2">
                    {editableTicket.status === TicketStatus.Completed && (
                        <button onClick={() => setIsReceiptModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Generate Receipt
                        </button>
                    )}
                    <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="bg-glen-red text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-gray-400">
                        {isGeneratingPdf ? 'Generating...' : 'PDF'}
                    </button>
                    {activeTab !== 'DETAILS' && (
                        <button onClick={handleSaveChanges} className="bg-glen-blue text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Save Changes
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-800">TICKET DETAILS: {editableTicket.id}</h3>
                <p className="text-sm text-gray-500">{editableTicket.customerName} - {editableTicket.address}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-2 px-4 overflow-x-auto">
                        {availableTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={tabClasses(tab.id)}>{tab.label}</button>
                        ))}
                    </nav>
                </div>

                <div className="p-4">
                    {activeTab === 'DETAILS' && <DetailsTabContent ticket={editableTicket} />}
                    {activeTab === 'PART_UPDATE' && <PartUpdateTab ticket={editableTicket} setTicket={setEditableTicket} onAddPartClick={() => setIsAddPartModalOpen(true)} />}
                    {activeTab === 'SERVICE_CHECKLIST' && <ServiceChecklistTab ticket={editableTicket} setTicket={setEditableTicket} />}
                    {activeTab === 'JOB_COMPLETION' && <JobCompletionTab ticket={editableTicket} setTicket={setEditableTicket} onJobComplete={() => { handleSaveChanges(); onBack(); }} />}
                </div>
            </div>
             {isReceiptModalOpen && <ReceiptModal ticket={editableTicket} onClose={() => setIsReceiptModalOpen(false)} />}
             {isAddPartModalOpen && <AddPartModal onClose={() => setIsAddPartModalOpen(false)} onAddPart={handleAddPart} />}
        </div>
    )
};

const DetailsTabContent: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <div className="space-y-4">
        <DetailItem label="Ticket No" value={ticket.id} />
        <DetailItem label="Make" value={ticket.productDetails.make} />
        <DetailItem label="Segment" value={ticket.productDetails.segment} />
        <DetailItem label="Category" value={ticket.productDetails.category} />
        <DetailItem label="Product" value={ticket.productDetails.product} />
        <div>
            <label className="block text-sm font-medium text-gray-500">Ticket Symptoms</label>
            <div className="mt-1 flex flex-wrap gap-2">
                {ticket.symptoms.map((symptom: string) => (
                    <span key={symptom} className="inline-block bg-glen-light-blue text-glen-blue text-sm font-semibold px-2.5 py-0.5 rounded-full">
                        {symptom}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

const PartUpdateTab: React.FC<{ ticket: Ticket, setTicket: (fn: (prev: Ticket | null) => Ticket | null) => void, onAddPartClick: () => void }> = ({ ticket, setTicket, onAddPartClick }) => {
    
    const handleRemovePart = (index: number) => {
        setTicket(prev => {
            if (!prev) return null;
            const newParts = [...(prev.partsReplaced || [])];
            newParts.splice(index, 1);
            return { ...prev, partsReplaced: newParts };
        });
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Parts Details</h4>
                <button onClick={onAddPartClick} className="bg-glen-blue text-white font-bold py-2 px-4 rounded-lg text-sm">+ Add Part</button>
            </div>
            {(!ticket.partsReplaced || ticket.partsReplaced.length === 0) ? (
                 <p className="text-center text-gray-500 py-4">No parts have been added yet.</p>
            ) : (
                <div className="space-y-3">
                    {ticket.partsReplaced.map((part, index) => (
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
    );
};

const ServiceChecklistTab: React.FC<{ ticket: Ticket, setTicket: (fn: (prev: Ticket | null) => Ticket | null) => void }> = ({ ticket, setTicket }) => {
    const checklistItems: {key: keyof ServiceChecklist, label: string}[] = [
      { key: 'concernInformed', label: 'Concern informed to Customer' },
      { key: 'replacedPartsShown', label: 'Replaced Parts Shown to Customer' },
      { key: 'taggingDone', label: 'Tagging done on Replaced part' },
      { key: 'siteCleaned', label: 'Site Cleaned Post Service' },
      { key: 'amcDiscussion', label: 'AMC discussion, if any' },
      { key: 'partsGivenToCustomer', label: 'Parts given to customer if Charged' },
      { key: 'cashReceiptHanded', label: 'Cash Receipt handed over, if any' },
    ];
    
    const handleChecklistChange = (field: keyof ServiceChecklist) => {
        setTicket(prev => {
            if (!prev) return null;
            const currentChecklist = prev.serviceChecklist || {
                concernInformed: false, replacedPartsShown: false, taggingDone: false, siteCleaned: false, amcDiscussion: false, partsGivenToCustomer: false, cashReceiptHanded: false
            };
            return {
                ...prev,
                serviceChecklist: {
                    ...currentChecklist,
                    [field]: !currentChecklist[field],
                }
            }
        });
    };

    return (
        <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Service Checklist</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {checklistItems.map(item => (
                     <label key={item.key} className="flex items-center text-sm text-gray-800 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={ticket.serviceChecklist?.[item.key] || false} onChange={() => handleChecklistChange(item.key)} className="h-4 w-4 text-glen-blue focus:ring-glen-blue border-gray-300 rounded" />
                        <span className="ml-3">{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

const JobCompletionTab: React.FC<{ ticket: Ticket, setTicket: (fn: (prev: Ticket | null) => Ticket | null) => void, onJobComplete: () => void }> = ({ ticket, setTicket, onJobComplete }) => {
    const { uploadDamagedPart } = useAppContext();
    const [damagedPartPhoto, setDamagedPartPhoto] = useState<string | null>(null);

    const handleChange = (field: keyof Ticket, value: any) => {
        setTicket(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'completion' | 'damaged') => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (type === 'completion') {
                handleChange('photoUrl', result);
            } else {
                setDamagedPartPhoto(result);
            }
          };
          reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleDamagedPartUpload = () => {
        if (damagedPartPhoto) {
            uploadDamagedPart(ticket.id, damagedPartPhoto);
        } else {
            alert('Please select a photo of the damaged part first.');
        }
    };

    const handleCompleteJob = () => {
        if (!ticket.workDone) {
            alert('Please describe the work done before completing the job.');
            return;
        }
        setTicket(prev => prev ? ({ ...prev, status: TicketStatus.Completed, completedAt: new Date() }) : null);
        // Timeout to allow state to update before saving and navigating back
        setTimeout(onJobComplete, 100);
    }
    
    const handleQuickAddAmount = (amount: number) => {
        const currentAmount = ticket.amountCollected || 0;
        handleChange('amountCollected', currentAmount + amount);
    };

    return (
        <div className="space-y-4">
             <div className="p-4 border rounded-lg bg-gray-50">
                 <h4 className="text-lg font-semibold text-gray-700 mb-2">Inventory Request</h4>
                 <label className="block text-sm font-medium text-gray-700">Upload Damaged Part Photo</label>
                 <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'damaged')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-glen-light-blue file:text-glen-blue hover:file:bg-blue-100"/>
                 {damagedPartPhoto && !ticket.damagedPartImageUrl && <img src={damagedPartPhoto} alt="Damaged part preview" className="mt-2 rounded-lg max-h-40" />}
                 {ticket.damagedPartImageUrl ? (
                    <div className="mt-2 text-sm text-green-700 bg-green-100 p-2 rounded-md">
                        <p>Image uploaded. <a href={ticket.damagedPartImageUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">View Image</a></p>
                    </div>
                 ) : (
                    <button type="button" onClick={handleDamagedPartUpload} disabled={!damagedPartPhoto} className="mt-3 w-full bg-glen-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
                        Send Inventory Request
                    </button>
                 )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Work Done (Action)</label>
                <textarea value={ticket.workDone || ''} onChange={e => handleChange('workDone', e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Collected</label>
                    <select value={ticket.paymentStatus || PaymentStatus.Pending} onChange={e => handleChange('paymentStatus', e.target.value as PaymentStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                        {Object.values(PaymentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input type="number" value={ticket.amountCollected || ''} onChange={e => handleChange('amountCollected', e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 500" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                     <div className="flex space-x-2 mt-2">
                        <button onClick={() => handleQuickAddAmount(50)} className="flex-1 text-xs bg-gray-200 text-gray-700 font-semibold py-1 rounded-md hover:bg-gray-300">+₹50</button>
                        <button onClick={() => handleQuickAddAmount(100)} className="flex-1 text-xs bg-gray-200 text-gray-700 font-semibold py-1 rounded-md hover:bg-gray-300">+₹100</button>
                        <button onClick={() => handleQuickAddAmount(500)} className="flex-1 text-xs bg-gray-200 text-gray-700 font-semibold py-1 rounded-md hover:bg-gray-300">+₹500</button>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Upload Completion Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'completion')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-glen-light-blue file:text-glen-blue hover:file:bg-blue-100"/>
                {ticket.photoUrl && <img src={ticket.photoUrl} alt="Upload preview" className="mt-2 rounded-lg max-h-40" />}
            </div>
            <div className="pt-4">
                <button type="button" onClick={handleCompleteJob} className="w-full bg-glen-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-lg">
                    {ticket.status === TicketStatus.Completed ? 'Update Job Details' : 'Complete Job'}
                </button>
            </div>
        </div>
    );
}

const DetailItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || '-'}</p>
    </div>
);


export default TicketDetails;