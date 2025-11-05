import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [masterWebhookUrl, setMasterWebhookUrl] = useState('');

  useEffect(() => {
    const loadedUrl = localStorage.getItem('masterWebhookUrl') || '';
    setMasterWebhookUrl(loadedUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('masterWebhookUrl', masterWebhookUrl);
    alert('Settings saved!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Automation Settings</h3>
                <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border">
                Enter your single, master webhook URL from your automation service (e.g., Make.com). All app events (new tickets, updates, etc.) will be sent to this one URL.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Master Webhook URL</label>
                    <input
                        type="url"
                        name="masterWebhookUrl"
                        value={masterWebhookUrl}
                        onChange={(e) => setMasterWebhookUrl(e.target.value)}
                        placeholder="https://hook.make.com/..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="button" onClick={handleSave} className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Save Settings</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;