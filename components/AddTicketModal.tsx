import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ticket } from '../types';
import { SERVICE_CATEGORIES } from '../data/productData';

interface AddTicketModalProps {
  onClose: () => void;
  initialData?: Partial<Ticket> | null;
}

const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, initialData }) => {
  const { technicians, addTicket } = useAppContext();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [complaint, setComplaint] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [preferredTime, setPreferredTime] = useState('10AM-12PM');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || '');
      setPhone(initialData.phone || '');
      setAddress(initialData.address || '');
      setComplaint(initialData.complaint || '');
      setServiceCategory(initialData.serviceCategory || '');
    }
    if (technicians.length > 0) {
      setTechnicianId(technicians[0].id);
    }
  }, [initialData, technicians]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !phone || !address || !complaint || !technicianId || !serviceCategory) {
      alert('Please fill all fields');
      return;
    }

    // ✅ Generate ticket ID
    const ticket_id = 'TKT-' + Date.now();

const newTicketData = {
  // 🔑 REQUIRED BY UI
  id: ticket_id,
  ticket_id: ticket_id,
  status: TicketStatus.New,
  serviceBookingDate: new Date().toISOString(),
  isEscalated: false,

  // 🔑 BUSINESS DATA
  customerName,
  phone,
  address,
  complaint,
  technicianId,
  serviceCategory,
  preferredTime,
  adminNotes,

  productDetails: {
    make: 'Glen',
    segment: '',
    category: serviceCategory,
    subCategory: '',
    product: '',
  },

  symptoms: [],
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Confirm Ticket Details' : 'Add New Ticket'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Category</label>
              <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Select Category</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Complaint</label>
              <input value={complaint} onChange={e => setComplaint(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
              <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="w-full border rounded px-3 py-2">
                <option>10AM-12PM</option>
                <option>12PM-03PM</option>
                <option>03PM-06PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assign Technician</label>
              <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="w-full border rounded px-3 py-2">
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-red-600">Admin Notes</label>
              <input value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full border rounded px-3 py-2 bg-red-50" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="bg-gray-200 px-6 py-2 rounded">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Create Ticket</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AddTicketModal;
