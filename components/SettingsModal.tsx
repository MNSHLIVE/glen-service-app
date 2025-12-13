
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician } from '../types';

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
    const { technicians, addTechnician, deleteTechnician, updateTechnician } = useAppContext();
    const [newTech, setNewTech] = useState({ name: '', password: '' });
    
    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPass, setEditPass] = useState('');

    const handleSave = () => {
        if (!newTech.name || !newTech.password) {
            alert("Please enter Name and PIN");
            return;
        }
        const success = addTechnician(newTech);
        if (success) {
            setNewTech({ name: '', password: '' });
        }
    };

    const handleDeleteClick = (techId: string, name: string) => {
        if (window.confirm(`⚠️ CONFIRM DELETION\n\nAre you sure you want to permanently remove technician "${name}"?\n\nThis action cannot be undone.`)) {
            deleteTechnician(techId);
        }
    };
    
    const startEditing = (tech: Technician) => {
        setEditingId(tech.id);
        setEditName(tech.name);
        setEditPass(tech.password || '');
    };
    
    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditPass('');
    };
    
    const saveEdit = (tech: Technician) => {
        if(!editName || !editPass) {
            alert("Name and PIN cannot be empty.");
            return;
        }
        
        updateTechnician({
            ...tech,
            name: editName,
            password: editPass
        });
        setEditingId(null);
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
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Staff List</h4>
                        {technicians.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">No technicians added.</p>
                        ) : (
                            technicians.map(tech => (
                                <div key={tech.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-glen-blue/30">
                                    {editingId === tech.id ? (
                                        // EDIT MODE
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-grow space-y-2">
                                                <input 
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full p-2 border rounded text-sm font-bold"
                                                    placeholder="Technician Name"
                                                />
                                                <input 
                                                    value={editPass}
                                                    onChange={e => setEditPass(e.target.value)}
                                                    className="w-full p-2 border rounded text-sm font-mono"
                                                    placeholder="PIN"
                                                />
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <button onClick={() => saveEdit(tech)} className="bg-green-500 text-white p-2 rounded text-xs font-bold">Save</button>
                                                <button onClick={cancelEditing} className="bg-gray-300 text-gray-700 p-2 rounded text-xs">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // VIEW MODE
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <PresenceDot lastSeen={tech.lastSeen} />
                                                <div>
                                                    <p className="font-bold text-gray-800 leading-tight">{tech.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">PIN: {tech.password} • PTS: {tech.points}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => startEditing(tech)}
                                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
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
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center">
                            <span className="bg-glen-blue/10 p-1 rounded mr-2">
                                <svg className="w-4 h-4 text-glen-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </span>
                            Register New Technician
                        </h4>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                                    <input 
                                        placeholder="e.g., Arjun Malhotra" 
                                        value={newTech.name} 
                                        onChange={e => setNewTech({...newTech, name: e.target.value})}
                                        className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-glen-blue/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unique Staff PIN</label>
                                    <input 
                                        type="tel"
                                        placeholder="3 or 4 Digit PIN" 
                                        value={newTech.password} 
                                        onChange={e => setNewTech({...newTech, password: e.target.value.replace(/\D/g, '')})}
                                        maxLength={4}
                                        className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-glen-blue/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={handleSave}
                                className="w-full bg-glen-blue text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                <span>Save Technician</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t flex justify-end bg-gray-50">
                    <button type="button" onClick={onClose} className="px-8 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors tracking-wide uppercase">Close</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
