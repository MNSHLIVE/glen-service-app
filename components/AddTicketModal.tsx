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
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [complaint, setComplaint] = useState(initialData?.complaint || '');
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id || '');
  const [serviceCategory, setServiceCategory] = useState(initialData?.serviceCategory || '');
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
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !phone || !address || !complaint || !technicianId || !serviceCategory) {
      alert('Please fill all fields');
      return;
    }

    // ✅ STEP 1: GENERATE TICKET ID (THIS WAS MISSING)
    const ticket_id = 'TKT-' + Date.now();

    // ✅ STEP 2: ATTACH ticket_id TO DATA
    const newTicketData = {
      ticket_id, // 👈 VERY IMPORTANT
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

    // ✅ STEP 3: SEND TO CONTEXT / BACKEND / n8n
    addTicket(newTicketData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Confirm Ticket Details' : 'Add New Ticket'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Category</label>
              <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} className="mt-1 block w-full rounded-md" required>
                <option value="">Select Category...</option>
                {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
