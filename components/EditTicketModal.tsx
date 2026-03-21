import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ticket } from '../types';
import { SERVICE_CATEGORIES } from '../data/productData';

interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, onClose }) => {
  const { updateTicket } = useAppContext();

  const [customerName, setCustomerName] = useState(ticket.customerName);
  const [phone, setPhone] = useState(ticket.phone);
  const [address, setAddress] = useState(ticket.address);
  const [serviceCategory, setServiceCategory] = useState(ticket.serviceCategory || '');
  
  const [warrantyApplicable, setWarrantyApplicable] = useState<boolean>(ticket.warrantyApplicable || false);
  const [purchaseDate, setPurchaseDate] = useState(ticket.purchaseDate ? String(ticket.purchaseDate).split('T')[0] : '');
  const [productName, setProductName] = useState(ticket.productName || '');
  const [serialNumber, setSerialNumber] = useState(ticket.serialNumber || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      alert('Please fill out Name, Phone, and Address.');
      return;
    }

    if (warrantyApplicable) {
      if (!purchaseDate || !productName || !serialNumber) {
        alert('Please fill Date of Purchase, Product Name, and Serial Number for warranty claims.');
        return;
      }
    }

    const updatedData: Partial<Ticket> = {
      customerName,
      phone,
      address,
      serviceCategory,
      warrantyApplicable,
      ...(warrantyApplicable ? {
        purchaseDate,
        productName,
        serialNumber
      } : {
        purchaseDate: undefined,
        productName: undefined,
        serialNumber: undefined
      })
    };

    updateTicket({ ...ticket, ...updatedData });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Edit Ticket {ticket.id}</h3>
            <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Customer Name</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" rows={2} />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Service Category</label>
              <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-white mt-1">
                <option value="">Select Category</option>
                {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={warrantyApplicable} 
                  onChange={e => setWarrantyApplicable(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-gray-700">Product Under Warranty</span>
              </label>

              {warrantyApplicable && (
                <div className="mt-4 grid grid-cols-1 gap-3 animate-fade-in">
                  <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Date of Purchase *</label>
                     <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" required={warrantyApplicable} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Product Name *</label>
                     <input type="text" placeholder="e.g. 60cm Auto Clean Chimney" value={productName} onChange={e => setProductName(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" required={warrantyApplicable} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Serial Number *</label>
                     <input type="text" placeholder="e.g. GLEN-CH-XYZ123" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-1" required={warrantyApplicable} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-6">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Cancel</button>
              <button type="submit" className="flex-2 bg-blue-600 px-10 py-3 rounded-xl font-bold text-white shadow-lg">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTicketModal;
