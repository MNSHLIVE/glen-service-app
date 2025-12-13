
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { APP_CONFIG, APP_VERSION } from '../config';

interface DiagnosticModalProps {
    onClose: () => void;
}

const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ onClose }) => {
    const { webhookStatus } = useAppContext();
    const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success' | 'code'}[]>([]);
    const [isSimulating, setIsSimulating] = useState<string | null>(null);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'code' = 'info') => {
        setLogs(prev => [...prev, { msg, type }]);
    };

    useEffect(() => {
        const runDiagnostics = async () => {
            addLog('Initializing Pandit Glen Diagnostics System...', 'info');
            
            // Check 1: API Key Presence
            const hasApiKey = !!process.env.API_KEY;
            if (hasApiKey) addLog('✅ Secure API_KEY context detected.', 'success');
            else addLog('❌ ERROR: API_KEY missing. AI features will fail.', 'error');

            // Check 2: Production Network Reachability
            addLog(`Pinging Hostinger Server: ${APP_CONFIG.MASTER_WEBHOOK_URL.substring(0, 30)}...`, 'info');
            try {
                const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({action: 'HEALTH_CHECK'}),
                    headers: {'Content-Type': 'application/json'}
                });
                if (response.ok) addLog('✅ Production automation server responded.', 'success');
                else addLog(`⚠️ Warning: Server responded with status ${response.status}`, 'error');
            } catch (e) {
                addLog('❌ ERROR: Automation URL unreachable. Check VPN or Firewall.', 'error');
            }

            addLog('System Check Completed.', 'info');
        };

        runDiagnostics();
    }, []);

    const runSimulation = async (action: string, mockPayload: Record<string, any>) => {
        setIsSimulating(action);
        const fullPayload = { action, ...mockPayload, isSimulation: true };
        
        addLog(`Triggering ${action}... Payload below:`, 'info');
        addLog(JSON.stringify(fullPayload, null, 2), 'code');
        
        try {
            const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullPayload)
            });

            if (response.ok) {
                addLog(`✅ Server accepted payload (Status 200).`, 'success');
                addLog(`Check Google Sheet now.`, 'success');
            } else {
                addLog(`❌ Server Rejected: Status ${response.status}`, 'error');
            }
        } catch (e) {
            addLog(`❌ Network Error: Failed to reach n8n.`, 'error');
        } finally {
            setIsSimulating(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-6 animate-fade-in font-mono">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <h2 className="text-xl text-white">PanditGlen_Core_v{APP_VERSION}</h2>
                </div>
                <button onClick={onClose} className="text-white text-3xl">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-black/50 p-4 border border-white/10 rounded-lg text-sm space-y-2 mb-4 font-mono">
                {logs.map((log, i) => (
                    <div key={i} className={`
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'success' ? 'text-green-400' : ''}
                        ${log.type === 'info' ? 'text-blue-300' : ''}
                        ${log.type === 'code' ? 'text-yellow-300 ml-4 whitespace-pre-wrap' : 'flex'}
                    `}>
                        {log.type !== 'code' && <span className="mr-2 opacity-30">[{new Date().toLocaleTimeString()}]</span>}
                        <span>{log.msg}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white/5 p-4 border border-white/10 rounded-lg mb-4">
                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Workflow Simulations</h3>
                
                <div className="space-y-4">
                    {/* JOB WORKFLOWS */}
                    <div>
                        <p className="text-[10px] text-gray-500 mb-2">Job & Alerts</p>
                        <div className="grid grid-cols-2 gap-2">
                             <button 
                                onClick={() => runSimulation('NEW_TICKET', { 
                                    ticket: {
                                        id: `TEST-${Math.floor(Math.random()*1000)}`,
                                        customerName: 'Test Customer',
                                        phone: '9999999999',
                                        address: '123 Test St, Simulation City',
                                        complaint: 'This is a test complaint for workflow verification',
                                        serviceCategory: 'Chimney',
                                        technicianId: 'tech1',
                                        status: 'New',
                                        createdAt: new Date().toISOString(),
                                        serviceBookingDate: new Date().toISOString(),
                                        preferredTime: '10AM-12PM',
                                        productDetails: { make: 'Glen', category: 'Chimney' }
                                    }
                                })}
                                disabled={!!isSimulating}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-3 rounded uppercase disabled:opacity-50"
                            >
                                {isSimulating === 'NEW_TICKET' ? 'Sending...' : '[TEST] New Complaint'}
                            </button>

                            <button 
                                onClick={() => runSimulation('UPDATE_TICKET', { 
                                    ticket: {
                                        id: `TEST-${Math.floor(Math.random()*1000)}`,
                                        customerName: 'Test Customer',
                                        status: 'Completed',
                                        workDone: 'Diagnostic Test Completion',
                                        amountCollected: 1500,
                                        paymentStatus: 'Cash',
                                        completedAt: new Date().toISOString(),
                                        technicianId: 'tech1',
                                        partsReplaced: [] 
                                    }
                                })}
                                disabled={!!isSimulating}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-3 rounded uppercase disabled:opacity-50"
                            >
                                {isSimulating === 'UPDATE_TICKET' ? 'Sending...' : '[TEST] Job Completed'}
                            </button>

                             <button 
                                onClick={() => runSimulation('ATTENDANCE', { technicianId: 'TEST-001', technicianName: 'Simulated User', status: 'Clock In', timestamp: new Date().toISOString() })}
                                disabled={!!isSimulating}
                                className="bg-gray-600 hover:bg-gray-500 text-white text-[10px] font-bold py-3 rounded uppercase disabled:opacity-50 col-span-2"
                            >
                                {isSimulating === 'ATTENDANCE' ? 'Sending...' : '[TEST] Attendance Clock-In'}
                            </button>
                        </div>
                    </div>

                    {/* STAFF MANAGEMENT */}
                    <div>
                        <p className="text-[10px] text-gray-500 mb-2">Staff Management (Requires 'Staff' Tab)</p>
                        <div className="grid grid-cols-2 gap-2">
                             <button 
                                onClick={() => runSimulation('ADD_TECHNICIAN', { technician: { id: 'TEST-TECH-01', name: 'Simulated Tech', password: '999', points: 0 } })}
                                disabled={!!isSimulating}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-3 rounded uppercase disabled:opacity-50"
                            >
                                {isSimulating === 'ADD_TECHNICIAN' ? 'Adding...' : '[TEST] Add Staff'}
                            </button>
                            <button 
                                onClick={() => runSimulation('REMOVE_TECHNICIAN', { technicianId: 'TEST-TECH-01' })}
                                disabled={!!isSimulating}
                                className="bg-red-900 hover:bg-red-800 text-white text-[10px] font-bold py-3 rounded uppercase disabled:opacity-50"
                            >
                                {isSimulating === 'REMOVE_TECHNICIAN' ? 'Deleting...' : '[TEST] Delete Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={onClose} className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-widest hover:bg-gray-200">
                Exit Diagnostics
            </button>
        </div>
    );
};

export default DiagnosticModal;
