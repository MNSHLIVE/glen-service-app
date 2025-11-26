
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

    const newTicketData = {
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

    addTicket(newTicketData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{initialData ? 'Confirm Ticket Details' : 'Add New Ticket'}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue" required></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Service Category</label>
                     <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md" required>
                        <option value="">Select Category...</option>
                        {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Complaint</label>
                    <input type="text" value={complaint} onChange={e => setComplaint(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                    <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                       <option>10AM-12PM</option>
                       <option>12PM-03PM</option>
                       <option>03PM-06PM</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Assign Technician</label>
                    <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                        {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-red-600">Admin Notes / Special Instructions</label>
                    <input 
                        type="text" 
                        value={adminNotes} 
                        onChange={e => setAdminNotes(e.target.value)} 
                        placeholder="e.g. Collect Pending Payment of 500rs"
                        className="mt-1 block w-full px-3 py-2 border border-red-200 bg-red-50 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" 
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button type="submit" className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Create Ticket</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddTicketModal;
