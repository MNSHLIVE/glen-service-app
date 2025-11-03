
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ticket, PaymentStatus, TicketStatus, ServiceChecklist } from '../types';

interface ServiceUpdateProps {
  ticket: Ticket;
  onUpdate: () => void;
}

const ServiceUpdate: React.FC<ServiceUpdateProps> = ({ ticket, onUpdate }) => {
  const { updateTicket, uploadDamagedPart } = useAppContext();
  
  const [workDone, setWorkDone] = useState(ticket.workDone || '');
  const [cause, setCause] = useState(ticket.cause || '');
  const [reason, setReason] = useState(ticket.reason || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(ticket.paymentStatus || PaymentStatus.Pending);
  const [remarks, setRemarks] = useState(ticket.remarks || '');
  const [photo, setPhoto] = useState<string | null>(ticket.photoUrl || null);
  const [damagedPartPhoto, setDamagedPartPhoto] = useState<string | null>(null);

  const [checklist, setChecklist] = useState<ServiceChecklist>(ticket.serviceChecklist || {
    concernInformed: false,
    replacedPartsShown: false,
    taggingDone: false,
    siteCleaned: false,
    amcDiscussion: false,
    partsGivenToCustomer: false,
    cashReceiptHanded: false,
  });

  const handleChecklistChange = (field: keyof ServiceChecklist) => {
      setChecklist(prev => ({ ...prev, [field]: !prev[field] }));
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'completion' | 'damaged') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'completion') {
            setPhoto(result);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDone) {
        alert('Please describe the work done.');
        return;
    }
    const updatedTicket: Ticket = {
      ...ticket,
      status: TicketStatus.Completed,
      completedAt: new Date(),
      workDone,
      cause,
      reason,
      paymentStatus,
      remarks,
      photoUrl: photo || undefined,
      serviceChecklist: checklist,
    };
    updateTicket(updatedTicket);
    onUpdate();
  };

  const checklistItems: {key: keyof ServiceChecklist, label: string}[] = [
      { key: 'concernInformed', label: 'Concern informed to Customer' },
      { key: 'replacedPartsShown', label: 'Replaced Parts Shown to Customer' },
      { key: 'taggingDone', label: 'Tagging done on Replaced part' },
      { key: 'siteCleaned', label: 'Site Cleaned Post Service' },
      { key: 'amcDiscussion', label: 'AMC discussion, if any' },
      { key: 'partsGivenToCustomer', label: 'Parts given to customer if Charged' },
      { key: 'cashReceiptHanded', label: 'Cash Receipt handed over, if any' },
  ];

  return (
    <div className="bg-white rounded-lg w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* New Damaged Part Section */}
            <div className="p-4 border rounded-lg bg-gray-50">
                 <h4 className="text-lg font-semibold text-gray-700 mb-2">Inventory Request</h4>
                 <label className="block text-sm font-medium text-gray-700">Upload Damaged Part Photo</label>
                 <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'damaged')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-glen-light-blue file:text-glen-blue hover:file:bg-blue-100"/>
                 {damagedPartPhoto && !ticket.damagedPartImageUrl && <img src={damagedPartPhoto} alt="Damaged part preview" className="mt-2 rounded-lg max-h-40" />}
                 
                 {ticket.damagedPartImageUrl ? (
                    <div className="mt-2 text-sm text-green-700 bg-green-100 p-2 rounded-md">
                        <p>Image uploaded successfully. <a href={ticket.damagedPartImageUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">View Image</a></p>
                    </div>
                 ) : (
                    <button type="button" onClick={handleDamagedPartUpload} className="mt-3 w-full bg-glen-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                        Send Inventory Request
                    </button>
                 )}
            </div>


            <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Service Checklist</h4>
                <div className="space-y-2">
                    {checklistItems.map(item => (
                         <label key={item.key} className="flex items-center text-sm text-gray-800">
                            <input type="checkbox" checked={checklist[item.key]} onChange={() => handleChecklistChange(item.key)} className="h-4 w-4 text-glen-blue focus:ring-glen-blue border-gray-300 rounded" />
                            <span className="ml-3">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700">Cause of Issue</label>
                <textarea value={cause} onChange={e => setCause(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"></textarea>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Action</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"></textarea>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Work Done (Action)</label>
                <textarea value={workDone} onChange={e => setWorkDone(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue" required></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Payment Collected</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                    {Object.values(PaymentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Upload Completion Photo (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'completion')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-glen-light-blue file:text-glen-blue hover:file:bg-blue-100"/>
                {photo && <img src={photo} alt="Upload preview" className="mt-2 rounded-lg max-h-40" />}
            </div>
            <div className="pt-4">
                <button type="submit" className="w-full bg-glen-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors text-lg">
                    {ticket.status === TicketStatus.Completed ? 'Update Job' : 'Complete Job'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ServiceUpdate;