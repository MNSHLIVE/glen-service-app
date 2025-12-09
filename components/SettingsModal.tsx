
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician, WebhookStatus, UserRole } from '../types';

const PresenceDot: React.FC<{ lastSeen?: Date }> = ({ lastSeen }) => {
    const [isOnline, setIsOnline] = useState(false);
    
    useEffect(() => {
        if (!lastSeen) {
            setIsOnline(false);
            return;
        }
        const check = () => {
            const fiveMinutes = 5 * 60 * 1000;
            setIsOnline(Date.now() - new Date(lastSeen).getTime() < fiveMinutes);
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, [lastSeen]);

    return (
        <div className="relative group">
            <span className={`block w-2.5 h-2.5 rounded-full border border-white ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`}></span>
            <div className="absolute left-0 bottom-full mb-1 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                {isOnline ? 'Online now' : lastSeen ? `Active ${new Date(lastSeen).toLocaleTimeString()}` : 'Never active'}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { technicians, addTechnician, updateTechnician, deleteTechnician, user } = useAppContext();
    const [newTech, setNewTech] = useState({ name: '', password: '' });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">Technician Management</h3>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-3">
                        {technicians.map(tech => (
                            <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                    <PresenceDot lastSeen={tech.lastSeen} />
                                    <div>
                                        <p className="font-semibold text-gray-800">{tech.name}</p>
                                        <p className="text-xs text-gray-500">PIN: {tech.password} | Points: {tech.points}</p>
                                    </div>
                                </div>
                                <button onClick={() => deleteTechnician(tech.id)} className="text-red-500 text-xs font-bold">REMOVE</button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Register New Technician</h4>
                        <div className="flex space-x-2">
                            <input 
                                placeholder="Full Name" 
                                value={newTech.name} 
                                onChange={e => setNewTech({...newTech, name: e.target.value})}
                                className="flex-grow p-2 border rounded-md text-sm"
                            />
                            <input 
                                placeholder="PIN" 
                                value={newTech.password} 
                                onChange={e => setNewTech({...newTech, password: e.target.value})}
                                className="w-20 p-2 border rounded-md text-sm"
                            />
                            <button 
                                onClick={() => { addTechnician(newTech); setNewTech({name: '', password: ''}); }}
                                className="bg-glen-blue text-white px-4 rounded-md text-sm font-bold"
                            >
                                ADD
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t flex justify-end">
                    <button onClick={onClose} className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-bold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
