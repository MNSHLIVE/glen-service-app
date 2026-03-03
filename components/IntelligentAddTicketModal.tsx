import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Ticket } from '../types';

interface IntelligentAddTicketModalProps {
    mode: 'text' | 'image';
    onClose: () => void;
    onParsed: (data: Partial<Ticket>) => void;
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

const IntelligentAddTicketModal: React.FC<IntelligentAddTicketModalProps> = ({ mode: initialMode, onClose, onParsed }) => {
    const [mode, setMode] = useState<'text' | 'image'>(initialMode);
    const [inputText, setInputText] = useState('');
    const [inputFile, setInputFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInputFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Improved Simple Parser for structured formats (WhatsApp, PDF text, and Screenshot OCR)
    const simpleParser = (text: string): Partial<Ticket> => {
        console.log("🛠️ Running Enhanced Simple Parser Fallback...");
        const result: Partial<Ticket> = {
            customerName: '',
            phone: '',
            address: '',
            complaint: '',
            serviceCategory: 'Other'
        };

        // 1. Search for labels (Key: Value) with flexible spacing and capitalization
        const nameMatch = text.match(/(?:Customer Name|Name):\s*([^\n\r,]+)/i);
        const phoneMatch = text.match(/(?:Customer Mobile|Mobile|Phone|Ph):\s*(\d{10,12})/i) || text.match(/\b(?:\+?91)?[6-9]\d{9}\b/);
        const addressMatch = text.match(/(?:Customer Address|Address):\s*([^\n\r,]+(?:,\s*[^\n\r,]+)*)/i);
        const complaintMatch = text.match(/(?:Complaint|Issue|Problem|Ticket Symptoms):\s*([^\n\r]+)/i);
        const categoryMatch = text.match(/(?:Ticket Category|Category|Product):\s*([^\n\r]+)/i);

        if (nameMatch) result.customerName = nameMatch[1].trim();
        if (phoneMatch) result.phone = (phoneMatch[1] || phoneMatch[0]).replace('+91', '').trim();
        if (addressMatch) result.address = addressMatch[1].trim();

        // Extract complaint from Symptoms or direct label
        if (complaintMatch) {
            result.complaint = complaintMatch[1].trim();
        } else {
            // Try to find "Ticket Symptoms" block as fallback
            const symptomsBlock = text.split(/Ticket Symptoms\s*:/i)[1]?.split('\n')[0];
            if (symptomsBlock) result.complaint = symptomsBlock.trim();
        }

        if (categoryMatch) result.serviceCategory = categoryMatch[1].trim() as any;

        // Warranty detection for simple parser
        // Look for "Warranty", "2026", "2025" or "Applicability Yes"
        const isWarranty = /warranty|under warranty|new product/i.test(text) ||
            /Warranty Applicability\s*Yes/i.test(text) ||
            /\/2026\//.test(text) ||
            /\/2025\//.test(text);

        const warrantyTag = "(Under Warranty)";
        if (isWarranty) {
            if (result.complaint) {
                if (!result.complaint.toLowerCase().includes('warranty')) {
                    result.complaint += ` ${warrantyTag}`;
                }
            } else {
                result.complaint = warrantyTag;
            }
        }

        // 2. Category normalization
        const cats = ['Chimney', 'Cooktop', 'Hob', 'Kettle', 'Dishwasher', 'Microwave', 'Oven', 'OTG', 'Griller'];
        const foundCat = cats.find(c => text.toLowerCase().includes(c.toLowerCase()));
        if (foundCat) {
            if (foundCat === 'OTG' || foundCat === 'Griller') result.serviceCategory = 'Oven' as any;
            else result.serviceCategory = foundCat as any;
        }

        // 3. Fallback logic if labels failed (for unstructured text)
        if (!result.customerName || !result.address) {
            const parts = text.split(/[,\n]/).map(p => p.trim()).filter(p => p.length > 2);

            if (!result.customerName && parts.length >= 1) {
                // Find a line that looks like a name (short, no numbers, no colons)
                const candidate = parts.find(p => !p.includes('/') && !p.includes(':') && p.length > 3 && p.length < 30 && !/\d/.test(p));
                if (candidate) result.customerName = candidate;
            }

            if (!result.address) {
                const addrKeys = ['Adarsh', 'Appartment', 'Sector', 'Phase', 'Street', 'Lane', 'Plot', 'Flat', 'House', 'Floor', 'Delhi', 'Gurgaon', 'Noida', 'Block', 'Pocket', 'Complex'];
                const addressSegments = parts.filter(p => addrKeys.some(k => p.toLowerCase().includes(k.toLowerCase())));
                if (addressSegments.length > 0) {
                    result.address = addressSegments.join(', ');
                }
            }
        }

        // 4. If complaint is still empty, grab last non-empty line (usually the issue)
        if (!result.complaint || result.complaint === warrantyTag) {
            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const lastLine = lines[lines.length - 1];
            if (lastLine && !lastLine.includes(':') && lastLine.length > 5) {
                result.complaint = (lastLine + (isWarranty && !lastLine.includes('Warranty') ? ` ${warrantyTag}` : "")).trim();
            }
        }

        return result;
    };

    const handleParse = async () => {
        if (mode === 'text' && !inputText) {
            setError('Please paste the text to analyze.');
            return;
        }
        if (mode === 'image' && !inputFile) {
            setError('Please upload an image to analyze.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log("🚀 Starting AI Magic Scan...");
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                console.error("❌ Missing VITE_GEMINI_API_KEY");
                setError("Configuration error: API Key missing.");
                setIsLoading(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });

            const prompt = `Extract ticket information from the provided text/image.
            Rules:
            1. Return ONLY a JSON object with: customerName, phone (10 digits only), address, complaint, serviceCategory (Chimney, Cooktop, Hob, Kettle, Dishwasher, Microwave, Oven, Other).
            2. VERY IMPORTANT: If the ticket is for a new product or mentions warranty, append "(Under Warranty)" to the complaint.
            3. If a value is unknown, use an empty string.`;

            const parts: any[] = [];
            if (mode === 'text') {
                parts.push({ text: inputText });
            } else if (inputFile) {
                const base64Data = await fileToBase64(inputFile);
                parts.push({ inlineData: { mimeType: inputFile.type, data: base64Data } });
            }

            console.log("📡 Sending request to Gemini (gemini-1.5-flash)...");

            const result: any = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{
                    role: 'user',
                    parts: parts
                }],
                // @ts-ignore
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            console.log("✅ AI Response received");

            let jsonString = "";
            if (result.response?.text) {
                jsonString = typeof result.response.text === 'function' ? await result.response.text() : result.response.text;
            } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                jsonString = result.candidates[0].content.parts[0].text;
            } else if (typeof result.text === 'string') {
                jsonString = result.text;
            }

            if (!jsonString) {
                throw new Error("Empty AI response");
            }

            const cleanJson = jsonString.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);
            onParsed(parsedData);

        } catch (err: any) {
            console.error("❌ AI Parsing Error:", err);
            if (mode === 'text') {
                onParsed(simpleParser(inputText));
            } else {
                setError(`Scan Error: ${err.message || 'AI failed'}. Try manual entry or paste text instead.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">AI Magic Scan</h3>
                        <button onClick={onClose} disabled={isLoading} className="text-2xl font-bold text-gray-400 hover:text-gray-600">&times;</button>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            Paste Text
                        </button>
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        >
                            Upload Photo
                        </button>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

                    <div className="space-y-4">
                        {mode === 'text' ? (
                            <div>
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    rows={8}
                                    placeholder="Paste WhatsApp/Excel/Ticket details here..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-2">Tip: Just copy the whole message and paste it here.</p>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    id="file-upload"
                                    className="hidden"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer group">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="mx-auto rounded-lg max-h-48 shadow-md" />
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <UploadIcon />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Click to upload screenshot</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-8">
                        <button type="button" onClick={onClose} disabled={isLoading} className="text-gray-500 font-bold px-4 hover:text-gray-700">Cancel</button>

                        <div className="flex space-x-2">
                            {mode === 'text' && (
                                <button
                                    type="button"
                                    onClick={() => onParsed(simpleParser(inputText))}
                                    disabled={isLoading || !inputText}
                                    className="px-4 py-2 text-gray-600 font-bold border rounded-xl hover:bg-gray-50 bg-white"
                                >
                                    Fast Scan
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleParse}
                                disabled={isLoading}
                                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 flex items-center shadow-lg shadow-blue-200"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    'AI Magic Scan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UploadIcon = () => (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default IntelligentAddTicketModal;
