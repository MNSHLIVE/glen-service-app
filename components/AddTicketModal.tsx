import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data/productData';
import { TicketStatus } from '../types';

interface AddTicketModalProps {
  onClose: () => void;
  initialData?: any;
}

const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, initialData }) => {
  const { technicians, addTicket } = useAppContext();

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [complaint, setComplaint] = useState(initialData?.complaint || '');
  const [technicianId, setTechnicianId] = useState('');
  const [serviceCategory, setServiceCategory] = useState(initialData?.serviceCategory || '');
  const [preferredTime, setPreferredTime] = useState('10AM-12PM');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (technicians.length > 0 && !technicianId) {
      setTechnicianId(technicians[0].id);
    }
  }, [technicians]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !technicianId) {
      alert('Please fill at least Name, Phone, and Assign a Technician');
      return;
    }

    const ticket_id = 'TKT-' + Date.now();
    const selectedTech = technicians.find(t => t.id === technicianId);

    const newTicketData = {
      id: ticket_id,
      ticket_id,
      status: TicketStatus.New,
      serviceBookingDate: new Date().toISOString(),
      customerName,
      phone,
      address,
      complaint,
      technicianId,
      technicianName: selectedTech?.name || 'Unassigned',
      serviceCategory,
      preferredTime,
      adminNotes,
    };

    addTicket(newTicketData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">New Service Ticket</h3>
            <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Customer Detail</label>
              <input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" />
            </div>
            <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <textarea placeholder="Complete Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded-xl px-4 py-3" rows={2} />

            <div className="grid grid-cols-2 gap-3">
              <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white">
                <option value="">Category</option>
                {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white">
                <option>10AM-12PM</option>
                <option>12PM-03PM</option>
                <option>03PM-06PM</option>
              </select>
            </div>

            <input placeholder="Complaint Details" value={complaint} onChange={e => setComplaint(e.target.value)} className="w-full border rounded-xl px-4 py-3" />

            <div>
              <label className="text-[10px] font-bold text-blue-600 uppercase ml-1">Assign Service Staff</label>
              <select
                value={technicianId}
                onChange={e => setTechnicianId(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 mt-1 bg-blue-50 font-bold ${technicians.length === 0 ? 'text-red-500' : 'text-blue-800'}`}
              >
                {technicians.length === 0 ? (
                  <option value="">⚠️ No technicians found</option>
                ) : (
                  technicians.map(t => <option key={t.id} value={t.id}>{t.name} (PIN: {t.pin})</option>)
                )}
              </select>
            </div>

            <input placeholder="Special Admin Notes" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-red-50 text-red-800" />

            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Cancel</button>
              <button type="submit" className="flex-2 bg-blue-600 px-10 py-3 rounded-xl font-bold text-white shadow-lg">Create Job</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTicketModal;
