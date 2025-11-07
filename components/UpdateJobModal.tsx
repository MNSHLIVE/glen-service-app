import React, { useState } from 'react';
import { ReplacedPart, PartType, PartWarrantyStatus } from '../types';
import { PART_CATEGORIES } from '../data/productData';

interface AddPartModalProps {
  onClose: () => void;
  onAddPart: (part: ReplacedPart) => void;
}

const AddPartModal: React.FC<AddPartModalProps> = ({ onClose, onAddPart }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [type, setType] = useState<PartType>(PartType.Repair);
    const [warrantyStatus, setWarrantyStatus] = useState<PartWarrantyStatus>(PartWarrantyStatus.OutOfWarranty);
    const [category, setCategory] = useState(PART_CATEGORIES[0]);
    const [warrantyDuration, setWarrantyDuration] = useState('N/A');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || price === '' || !category) {
            alert('Please fill all required fields.');
            return;
        }

        onAddPart({
            name,
            price: Number(price),
            type,
            warrantyStatus,
            category,
            warrantyDuration,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Add Part Details</h3>
                        <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Type*</label>
                            <select value={type} onChange={e => setType(e.target.value as PartType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                                {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Warranty Status*</label>
                            <select value={warrantyStatus} onChange={e => setWarrantyStatus(e.target.value as PartWarrantyStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                                {Object.values(PartWarrantyStatus).map(ws => <option key={ws} value={ws}>{ws}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Category*</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-glen-blue focus:border-glen-blue sm:text-sm rounded-md">
                                {PART_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700">Part Name*</label>
                               <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                             <div>
                               <label className="block text-sm font-medium text-gray-700">Price*</label>
                               <input type="number" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                        </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700">Warranty Duration</label>
                           <input type="text" value={warrantyDuration} onChange={e => setWarrantyDuration(e.target.value)} placeholder="e.g., 6 Months" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg">Cancel</button>
                            <button type="submit" className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg">ADD</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPartModal;