
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician, WebhookStatus, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import { COMPLAINT_SHEET_HEADERS, TECHNICIAN_UPDATE_HEADERS } from '../data/sheetHeaders';

type SettingsTab = 'automation' | 'technicians';

// --- Reusable Payload Manager Component ---
const PayloadManager: React.FC<{
    title: string;
    action: 'NEW_TICKET' | 'JOB_COMPLETED' | 'ATTENDANCE';
    defaultHeaders: string[];
}> = ({ title, action, defaultHeaders }) => {
    const { sendCustomWebhookPayload } = useAppContext();
    const [payload, setPayload] = useState<Array<{ id: number; key: string; value: any }>>([]);
    const nextId = React.useRef(0);

    const generateDefaultPayload = useCallback(() => {
        const now = new Date();
        const defaultData: Record<string, any> = {
            'Ticket ID': `SB-TEST-${Date.now()}`,
            'Created At': now.toISOString(),
            'Customer Name': 'Test Customer',
            'Phone': '9876543210',
            'Address': '123 Test Street, Automation City',
            'Service Category': 'Chimney',
            'Complaint': 'Test complaint for automation setup.',
            'Assigned Technician': 'Test Technician',
            'Status': 'New',
            'Service Booking Date': now.toISOString(),
            'Preferred Time': '12PM-03PM',
        };

        if (action === 'JOB_COMPLETED') {
            Object.assign(defaultData, {
                'Status': 'Completed',
                'Completed At': now.toISOString(),
                'Technician Name': 'Test Technician',
                'Work Done Summary': 'Completed test job successfully.',
                'Amount Collected': 500,
                'Payment Status': 'UPI',
                'Points Awarded': 250,
                'Parts Replaced (Name | Price | Warranty)': 'Main Filter | 350 | 6 Months',
                'AMC Discussion': true,
                'Free Service': false,
            });
        }

        if (action === 'ATTENDANCE') {
             return [
                 { id: 1, key: 'technicianId', value: 'tech-test' },
                 { id: 2, key: 'technicianName', value: 'Test Technician' },
                 { id: 3, key: 'status', value: 'Clock In' },
                 { id: 4, key: 'timestamp', value: now.toLocaleString() },
                 { id: 5, key: 'timestampISO', value: now.toISOString() },
             ];
        }
        
        const finalPayload = defaultHeaders.map((header) => {
             const id = nextId.current++;
             return {
                id: id,
                key: header,
                value: defaultData[header] ?? '',
            };
        });

        return finalPayload;
    }, [action, defaultHeaders]);

    useEffect(() => {
        setPayload(generateDefaultPayload());
    }, [generateDefaultPayload]);

    const handleValueChange = (id: number, value: string) => {
        setPayload(prev => prev.map(item => item.id === id ? { ...item, value } : item));
    };

    const handleKeyChange = (id: number, newKey: string) => {
        setPayload(prev => prev.map(item => item.id === id ? { ...item, key: newKey } : item));
    };
    
    const handleAddField = () => {
        const newField = {
            id: nextId.current++,
            key: `newField_${nextId.current}`,
            value: 'sample value'
        };
        setPayload(prev => [...prev, newField]);
    };
    
    const handleDeleteField = (id: number) => {
        if (window.confirm(`Are you sure you want to delete this field?`)){
            setPayload(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleSendTest = () => {
        const objectPayload = payload.reduce((acc, item) => {
            if (item.key) {
                acc[item.key] = item.value;
            }
            return acc;
        }, {} as Record<string, any>);

        sendCustomWebhookPayload(action, objectPayload);
    };

    const handleReset = () => {
        setPayload(generateDefaultPayload());
    };

    return (
         <div className="border p-4 rounded-lg bg-gray-50">
            <h5 className="font-bold text-gray-700 mb-2">{title}</h5>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {payload.map((item) => (
                    <div key={item.id} className="grid grid-cols-[30%_1fr_auto] gap-2 items-center">
                        <input type="text" value={item.key} onChange={e => handleKeyChange(item.id, e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm font-mono"/>
                        <input type="text" value={String(item.value)} onChange={e => handleValueChange(item.id, e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm font-mono"/>
                        <button onClick={() => handleDeleteField(item.id)} className="text-red-500 hover:text-red-700 p-1 justify-self-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t space-y-2">
                 <div className="flex items-center space-x-2">
                     <button onClick={handleAddField} className="text-sm bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Amend (Add Field)</button>
                     <button onClick={handleReset} className="text-sm bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600">Reset to Default</button>
                 </div>
                 <button onClick={handleSendTest} className="text-sm bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
                    Send Test '{title}' Data
                </button>
            </div>
        </div>
    );
};


const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('automation');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const { technicians: contextTechnicians, addTechnician, updateTechnician, deleteTechnician, user, webhookStatus, checkWebhookHealth } = useAppContext();
  const { addToast } = useToast();

  const isDeveloper = user?.role === UserRole.Developer;
  const isAdmin = user?.role === UserRole.Admin;
  const hasFullAccess = isDeveloper || isAdmin;

  useEffect(() => {
    setWebhookUrl(localStorage.getItem('masterWebhookUrl') || '');
    setGoogleSheetUrl(localStorage.getItem('googleSheetUrl') || '');
    setTechnicians(contextTechnicians);
    
    // Default to technicians tab if not allowed full access
    if (!hasFullAccess) {
        setActiveTab('technicians');
    }
  }, [contextTechnicians, hasFullAccess]);

  const handleSaveAndClose = () => {
    if (hasFullAccess) {
        localStorage.setItem('masterWebhookUrl', webhookUrl);
        localStorage.setItem('googleSheetUrl', googleSheetUrl);
    }
    addToast('Settings saved successfully!', 'success');
    onClose();
  };

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
                    {hasFullAccess && (
                        <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'automation' ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500'}`}>Automation</button>
                    )}
                    <button onClick={() => setActiveTab('technicians')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'technicians' ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500'}`}>Technicians</button>
                </div>
            </div>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
            {activeTab === 'automation' && hasFullAccess && <AutomationSettings 
                webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
                googleSheetUrl={googleSheetUrl} setGoogleSheetUrl={setGoogleSheetUrl}
             />}
            {activeTab === 'technicians' && <TechnicianManagement />}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3 sticky bottom-0">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button type="button" onClick={handleSaveAndClose} className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

interface AutomationSettingsProps {
    webhookUrl: string;
    setWebhookUrl: (url: string) => void;
    googleSheetUrl: string;
    setGoogleSheetUrl: (url: string) => void;
}

const AutomationSettings: React.FC<AutomationSettingsProps> = ({ 
    webhookUrl, setWebhookUrl,
    googleSheetUrl, setGoogleSheetUrl
}) => {
   const { addToast } = useToast();
   const { webhookStatus, checkWebhookHealth } = useAppContext();
   const isChecking = webhookStatus === WebhookStatus.Checking;

   const handleHealthCheck = useCallback(async () => {
       await checkWebhookHealth(webhookUrl);
   }, [webhookUrl, checkWebhookHealth]);

   const handleExport = () => {
       const settings = {
           masterWebhookUrl: webhookUrl,
           googleSheetUrl: googleSheetUrl,
       };
       const settingsString = JSON.stringify(settings, null, 2);
       navigator.clipboard.writeText(settingsString)
           .then(() => {
               addToast('Settings copied to clipboard!', 'success');
           })
           .catch(err => {
               console.error('Failed to copy settings: ', err);
               addToast('Could not copy settings.', 'error');
           });
   };

   const handleImport = () => {
       const pastedSettings = window.prompt("Paste your exported settings configuration here:");
       if (pastedSettings) {
           try {
               const parsedSettings = JSON.parse(pastedSettings);
               if (parsedSettings.masterWebhookUrl !== undefined && 
                   parsedSettings.googleSheetUrl !== undefined) {
                   
                   setWebhookUrl(parsedSettings.masterWebhookUrl);
                   setGoogleSheetUrl(parsedSettings.googleSheetUrl);
                   addToast('Settings imported successfully!', 'success');
               } else {
                   throw new Error("Missing required keys in settings object.");
               }
           } catch (error) {
               console.error("Failed to parse settings:", error);
               addToast('Invalid settings format. Please paste the exact text you exported.', 'error');
           }
       }
   };

   return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-semibold text-gray-800">Webhook & Sheet Configuration</h4>
            <div className="flex space-x-2">
                <button onClick={handleImport} className="text-sm bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Import</button>
                <button onClick={handleExport} className="text-sm bg-glen-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Export</button>
            </div>
        </div>
         <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Master Webhook URL (n8n/Make)</label>
              <div className="flex items-center space-x-2">
                 <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://n8n.your-domain.com/webhook/..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue disabled:bg-gray-100"
                      disabled={isChecking}
                  />
                  <button onClick={handleHealthCheck} disabled={isChecking} className="bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-400 flex items-center whitespace-nowrap">
                      {isChecking ? <SpinnerIcon/> : <HealthCheckIcon/>}
                      <span className="ml-2">{isChecking ? 'Checking...' : 'Test Connection'}</span>
                  </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Master Google Sheet URL</label>
              <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"
              />
              <p className="text-xs text-gray-500 mt-1">Ensure this sheet has 'Complaints' and 'Updates' tabs.</p>
            </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Automation Payload Manager</h4>
        <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-bold text-blue-800">Instructions:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Put your n8n/Make workflow in "Listen for Test Event" mode.</li>
                <li>Click the appropriate "Send Test Data" button below to teach it the data structure.</li>
                <li>The placeholders will now appear in your automation tool.</li>
                <li>Use the "Amend" or "Delete" buttons to customize the data payload for future needs.</li>
            </ol>
        </div>
        <div className="space-y-4">
            <PayloadManager title="New Ticket" action="NEW_TICKET" defaultHeaders={COMPLAINT_SHEET_HEADERS} />
            <PayloadManager title="Job Completed" action="JOB_COMPLETED" defaultHeaders={TECHNICIAN_UPDATE_HEADERS} />
            <PayloadManager title="Attendance" action="ATTENDANCE" defaultHeaders={[]} />
        </div>
      </div>
    </div>
   )
}

const TechnicianManagement: React.FC = () => {
    const { technicians, addTechnician, updateTechnician, deleteTechnician, resetTechniciansToDefaults } = useAppContext();
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
    
    const handleResetDefaults = () => {
        if(window.confirm('Are you sure? This will delete any technicians you added manually and restore the original list from the code file.')) {
            resetTechniciansToDefaults();
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
                                        <p className="text-sm text-gray-500">PIN: {tech.password} | Points: {tech.points}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => setEditingTech(tech)} className="text-sm bg-gray-200 py-1 px-3 rounded-lg">Edit</button>
                                        {tech.id !== 'tech-test' && <button onClick={() => handleDelete(tech.id)} className="text-sm bg-red-500 text-white py-1 px-3 rounded-lg">Delete</button>}
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
            
            <div className="border-t pt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-red-800 mb-1">Danger Zone</h4>
                    <p className="text-xs text-red-600 mb-3">If your code updates aren't showing, click this to force a reset.</p>
                    <button onClick={handleResetDefaults} className="text-sm bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 w-full">Reset to Code Defaults</button>
                </div>
            </div>
        </div>
    )
}

// Icons
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const HealthCheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a2 2 0 100-4 2 2 0 000 4zm0 14a2 2 0 100-4 2 2 0 000 4zm6-8a2 2 0 100-4 2 2 0 000 4zm-12 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);


export default SettingsModal;
