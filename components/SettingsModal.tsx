import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician } from '../types';
import { useToast } from '../context/ToastContext';

type SettingsTab = 'automation' | 'technicians';

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('automation');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Settings</h3>
                <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div className="mt-4">
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'automation' ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500'}`}>Automation</button>
                    <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'technicians' ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500'}`}>Technicians</button>
                </div>
            </div>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
            {activeTab === 'automation' && <AutomationSettings />}
            {activeTab === 'technicians' && <TechnicianManagement />}
        </div>
      </div>
    </div>
  );
};


const AutomationSettings: React.FC = () => {
  const { initializeSheets } = useAppContext();
  const [masterWebhookUrl, setMasterWebhookUrl] = useState('');
  const [complaintSheetUrl, setComplaintSheetUrl] = useState('');
  const [updateSheetUrl, setUpdateSheetUrl] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const defaultWebhookUrl = 'https://hook.eu2.make.com/ohvxcesvh1dwr7ejl1f2c7v4ed5sxovn';
    setMasterWebhookUrl(localStorage.getItem('masterWebhookUrl') || defaultWebhookUrl);
    setComplaintSheetUrl(localStorage.getItem('complaintSheetUrl') || '');
    setUpdateSheetUrl(localStorage.getItem('updateSheetUrl') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('masterWebhookUrl', masterWebhookUrl);
    localStorage.setItem('complaintSheetUrl', complaintSheetUrl);
    localStorage.setItem('updateSheetUrl', updateSheetUrl);
    addToast('Settings saved!', 'success');
  };
  
  const handleInitialize = () => {
    if (!complaintSheetUrl || !updateSheetUrl) {
        addToast('Please provide URLs for both sheets before initializing.', 'error');
        return;
    }
    handleSave(); // Save URLs before initializing
    initializeSheets();
  }

   return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Webhook Configuration</h4>
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border">
            Enter your single, master webhook URL from your automation service (e.g., Make.com). All app events will be sent to this one URL.
        </p>
        <div className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Master Webhook URL</label>
            <input
                type="url"
                value={masterWebhookUrl}
                onChange={(e) => setMasterWebhookUrl(e.target.value)}
                placeholder="https://hook.make.com/..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"
            />
            </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Google Sheets Setup</h4>
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border">
            Create two blank Google Sheets. Paste their URLs below and click "Initialize". This will automatically add all the necessary columns to your sheets.
        </p>
         <div>
            <label className="block text-sm font-medium text-gray-700">Sheet 1: Complaint Sheet URL</label>
            <input
                type="url"
                value={complaintSheetUrl}
                onChange={(e) => setComplaintSheetUrl(e.target.value)}
                placeholder="URL for the sheet where new tickets are logged"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Sheet 2: Technician Update Sheet URL</label>
            <input
                type="url"
                value={updateSheetUrl}
                onChange={(e) => setUpdateSheetUrl(e.target.value)}
                placeholder="URL for the sheet where final job updates are logged"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div className="flex justify-end pt-6 items-center space-x-4">
            <button type="button" onClick={handleInitialize} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">Initialize Sheets</button>
            <button type="button" onClick={handleSave} className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Save Settings</button>
        </div>
      </div>
    </div>
   )
}

const TechnicianManagement: React.FC = () => {
    const { technicians, addTechnician, updateTechnician, deleteTechnician } = useAppContext();
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [newTechName, setNewTechName] = useState('');
    const [newTechPin, setNewTechPin] = useState('');

    const handleSave = () => {
        if (editingTech) {
            updateTechnician(editingTech);
            setEditingTech(null);
        } else if(newTechName && newTechPin) {
            if (technicians.some(t => t.password === newTechPin)) {
                alert('This PIN is already in use. Please choose a unique PIN.');
                return;
            }
            addTechnician({ name: newTechName, password: newTechPin });
            setNewTechName('');
            setNewTechPin('');
        }
    }
    
    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to remove this technician?')) {
            deleteTechnician(id);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Technician List</h4>
                <div className="space-y-2">
                    {technicians.map(tech => (
                        <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            {editingTech?.id === tech.id ? (
                                <>
                                    <input type="text" value={editingTech.name} onChange={e => setEditingTech({...editingTech, name: e.target.value})} className="px-2 py-1 border rounded-md"/>
                                    <input type="text" value={editingTech.password} onChange={e => setEditingTech({...editingTech, password: e.target.value})} className="w-24 px-2 py-1 border rounded-md"/>
                                    <button onClick={handleSave} className="text-sm bg-green-500 text-white font-semibold py-1 px-3 rounded-lg">Save</button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="font-semibold">{tech.name}</p>
                                        <p className="text-sm text-gray-500">PIN: {tech.password}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => setEditingTech(tech)} className="text-sm bg-gray-200 py-1 px-3 rounded-lg">Edit</button>
                                        <button onClick={() => handleDelete(tech.id)} className="text-sm bg-red-500 text-white py-1 px-3 rounded-lg">Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t pt-4">
                 <h4 className="text-lg font-semibold text-gray-800 mb-2">Add New Technician</h4>
                 <div className="flex items-center space-x-3">
                     <input type="text" placeholder="Technician Name" value={newTechName} onChange={e => setNewTechName(e.target.value)} className="flex-grow px-3 py-2 border rounded-md"/>
                     <input type="number" placeholder="PIN" value={newTechPin} onChange={e => setNewTechPin(e.target.value)} className="w-28 px-3 py-2 border rounded-md"/>
                     <button onClick={handleSave} className="bg-glen-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">Add</button>
                 </div>
            </div>
        </div>
    )
}

export default SettingsModal;