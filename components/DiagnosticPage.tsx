import React, { useState } from 'react';

const DiagnosticPage: React.FC = () => {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testEndpoint = async (action: string) => {
        setLoading(true);
        try {
            const url = `/api/n8n-proxy?action=${action}`;
            console.log('Testing:', url);

            const res = await fetch(url);
            const status = res.status;
            const data = await res.json();

            setResult({
                action,
                status,
                ok: res.ok,
                data,
                dataType: Array.isArray(data) ? `Array(${data.length})` : typeof data,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            setResult({
                action,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">🔍 API Diagnostics</h1>

            <div className="space-y-4 mb-8">
                <button
                    onClick={() => testEndpoint('read-technician')}
                    className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
                    disabled={loading}
                >
                    Test Read Technicians
                </button>

                <button
                    onClick={() => testEndpoint('read-complaint')}
                    className="bg-green-600 text-white px-4 py-2 rounded mr-2"
                    disabled={loading}
                >
                    Test Read Complaints
                </button>
            </div>

            {loading && <p className="text-gray-600">Loading...</p>}

            {result && (
                <div className="bg-gray-100 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Result:</h2>
                    <pre className="bg-white p-4 rounded overflow-auto max-h-96 text-sm">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default DiagnosticPage;
