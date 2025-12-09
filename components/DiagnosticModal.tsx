import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

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
            addLog('Starting Launch Diagnostics...', 'info');
            
            // Check 1: API Key Presence
            const hasApiKey = !!process.env.API_KEY;
            addLog(`Checking Environment...`, 'info');
            if (hasApiKey) {
                addLog('✅ API_KEY detected in environment.', 'success');
            } else {
                addLog('❌ API_KEY missing. AI features will not launch.', 'error');
            }

            // Check 2: Connection to AI Studio (Check if device is online)
            addLog('Checking network to AI Studio...', 'info');
            try {
                const response = await fetch('https://aistudiocdn.com/', { mode: 'no-cors' });
                addLog('✅ Network reachability: Online', 'success');
            } catch (e) {
                addLog('❌ Network reachability: Offline or Blocked.', 'error');
            }

            // Check 3: Webhook URL
            const url = localStorage.getItem('masterWebhookUrl');
            if (url) {
                addLog(`✅ Automation URL: ${url.substring(0, 15)}...`, 'success');
                addLog(`Current Automation Status: ${webhookStatus}`, 'info');
            } else {
                addLog('⚠️ No Automation URL set in settings.', 'info');
            }

            // Check 4: Memory Check
            const tickets = localStorage.getItem('tickets');
            addLog(`Stored Data: ${tickets ? JSON.parse(tickets).length : 0} local tickets.`, 'info');

            addLog('Diagnostics complete. Scroll to view details.', 'info');
        };

        runDiagnostics();
    }, [webhookStatus]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <h2 className="text-xl font-mono text-white">SYSTEM_DIAGNOSTICS_V1</h2>
                </div>
                <button onClick={onClose} className="text-white text-3xl font-mono">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-black/50 p-4 border border-white/10 rounded-lg font-mono text-sm space-y-2">
                {logs.map((log, i) => (
                    <div key={i} className={`flex ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>
                        <span className="mr-2 opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <span>{log.msg}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs text-white/40 mb-4 font-mono leading-relaxed">
                    Launcher Reason: Use this report to troubleshoot blank screen or sync issues. 
                    Common fix: Ensure n8n uses HTTPS and current API Key is active.
                </p>
                <button onClick={onClose} className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-wider hover:bg-white/80 transition-colors">
                    Return to App
                </button>
            </div>
        </div>
    );
};

export default DiagnosticModal;