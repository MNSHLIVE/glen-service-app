
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { APP_CONFIG } from '../config';

interface DiagnosticModalProps {
    onClose: () => void;
}

const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ onClose }) => {
    const { webhookStatus } = useAppContext();
    const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success'}[]>([]);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
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
                    body: JSON.stringify({action: 'PING'}),
                    headers: {'Content-Type': 'application/json'}
                });
                if (response.ok) addLog('✅ Production automation server responded.', 'success');
                else addLog(`⚠️ Warning: Server responded with status ${response.status}`, 'error');
            } catch (e) {
                addLog('❌ ERROR: Automation URL unreachable. Check VPN or Firewall.', 'error');
            }

            // Check 3: Browser Features
            const storage = !!window.localStorage;
            addLog(`Storage Health: ${storage ? 'Active' : 'Missing'}`, storage ? 'success' : 'error');

            addLog('System Check Completed.', 'info');
        };

        runDiagnostics();
    }, [webhookStatus]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-6 animate-fade-in font-mono">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <h2 className="text-xl text-white">PanditGlen_Core_v4</h2>
                </div>
                <button onClick={onClose} className="text-white text-3xl">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-black/50 p-4 border border-white/10 rounded-lg text-sm space-y-2">
                {logs.map((log, i) => (
                    <div key={i} className={`flex ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>
                        <span className="mr-2 opacity-30">[{new Date().toLocaleTimeString()}]</span>
                        <span>{log.msg}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button onClick={onClose} className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-widest hover:bg-gray-200">
                    Exit Terminal
                </button>
            </div>
        </div>
    );
};

export default DiagnosticModal;
