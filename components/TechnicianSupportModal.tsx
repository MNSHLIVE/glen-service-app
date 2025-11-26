
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UrgentAlertType } from '../types';

interface TechnicianSupportModalProps {
    onClose: () => void;
}

const TechnicianSupportModal: React.FC<TechnicianSupportModalProps> = ({ onClose }) => {
    const { sendUrgentAlert } = useAppContext();
    const [selectedType, setSelectedType] = useState<UrgentAlertType>(UrgentAlertType.Other);
    const [comments, setComments] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = () => {
        setIsSending(true);
        sendUrgentAlert(selectedType, comments);
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
            setTimeout(onClose, 2000);
        }, 1500);
    };

    if (sent) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-lg shadow-xl p-8 text-center animate-bounce-in">
                     <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Alert Sent!</h3>
                    <p className="text-gray-500 mt-2">Admin has been notified.</p>
                 </div>
             </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-2">
                             <div className="bg-red-100 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                             </div>
                             <h3 className="text-xl font-bold text-gray-800">Urgent Alert</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">What's the emergency?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(UrgentAlertType).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`text-xs p-2 rounded-lg border ${selectedType === type ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quick Note (Optional)</label>
                            <textarea 
                                value={comments} 
                                onChange={(e) => setComments(e.target.value)} 
                                rows={2} 
                                placeholder="e.g. Tyre punctured at MG Road"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                            />
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={isSending}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-red-700 transition-colors flex justify-center items-center"
                        >
                            {isSending ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'SEND ALERT NOW'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianSupportModal;
