import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const PresenceDot: React.FC<{ lastSeen?: string }> = ({ lastSeen }) => {
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
    const { technicians, addTechnician, deleteTechnician, isSyncing, syncTickets } = useAppContext();
    const [newTech, setNewTech] = useState({ name: '', pin: '', phone: '' });

    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSave = async () => {
        if (!newTech.name || !newTech.pin) {
            alert("Please enter Name and PIN");
            return;
        }
        await addTechnician({
            name: newTech.name,
            pin: newTech.pin,
            phone: newTech.phone,
            role: 'Technician'
        });
        setNewTech({ name: '', pin: '', phone: '' });
    };

    const handleDeleteClick = (techId: string, name: string) => {
        if (window.confirm(`⚠️ CONFIRM DELETION\n\nAre you sure you want to permanently remove technician "${name}"?\n\nThis action cannot be undone.`)) {
            deleteTechnician(techId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Technician Management</h3>
                        <p className="text-xs text-gray-500">Manage PINs, Edit Details, or Remove Staff</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 bg-white">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Staff List</h4>
                        <button onClick={syncTickets} disabled={isSyncing} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">
                            {isSyncing ? 'Syncing...' : '🔄 Refresh List'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {technicians.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">No technicians found.</p>
                        ) : (
                            technicians.map(tech => (
                                <div key={tech.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-glen-blue/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <PresenceDot lastSeen={tech.lastSeen} />
                                            <div>
                                                <p className="font-bold text-gray-800 leading-tight">{tech.name}</p>
                                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">PIN: {tech.pin} • ID: {tech.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(tech.id, tech.name)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove Technician"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center">
                            Register New Technician
                        </h4>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                                    <input
                                        placeholder="Full Name"
                                        value={newTech.name}
                                        onChange={e => setNewTech({ ...newTech, name: e.target.value })}
                                        className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Staff PIN</label>
                                    <input
                                        type="tel"
                                        placeholder="PIN"
                                        value={newTech.pin}
                                        onChange={e => setNewTech({ ...newTech, pin: e.target.value.replace(/\D/g, '') })}
                                        maxLength={4}
                                        className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                Save Technician
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end bg-gray-50">
                    <button type="button" onClick={onClose} className="px-8 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase">Close</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
