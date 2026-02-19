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

const IntelligentAddTicketModal: React.FC<IntelligentAddTicketModalProps> = ({ mode, onClose, onParsed }) => {
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

    // Simple Regex Fallback Parser (Robust OCR-like behavior)
    const simpleParser = (text: string): Partial<Ticket> => {
        console.log("🛠️ Running Simple Parser Fallback for text:", text);
        const result: Partial<Ticket> = {
            customerName: '',
            phone: '',
            address: '',
            complaint: '',
            serviceCategory: 'Other'
        };

        // 1. Extract Phone (10-12 digits)
        const phoneMatch = text.match(/\b(?:\+?91)?[6-9]\d{9}\b/);
        if (phoneMatch) {
            result.phone = phoneMatch[0].replace('+91', '');
            // Remove phone from text to avoid it being picked up as parts of name/address
            text = text.replace(phoneMatch[0], '');
        }

        // 2. Identify Category
        const cats = ['Chimney', 'Cooktop', 'Hob', 'Kettle', 'Dishwasher', 'Microwave', 'Oven'];
        const foundCat = cats.find(c => text.toLowerCase().includes(c.toLowerCase()));
        if (foundCat) result.serviceCategory = foundCat;

        // 3. Smart Split logic (comma, newline, or dash)
        const parts = text.split(/[,\n]/).map(p => p.trim()).filter(p => p.length > 2);

        if (parts.length >= 1) {
            // First segment often contains the name
            const namePart = parts[0].replace(/[0-9]/g, '').trim(); // Remove any leftover numbers
            if (namePart.length > 3 && namePart.length < 40) result.customerName = namePart;
        }

        if (parts.length >= 2) {
            // Segments containing address keywords
            const addrKeys = ['Adarsh', 'Appartment', 'Sector', 'Phase', 'Street', 'Lane', 'Plot', 'Flat', 'House', 'Floor', 'Delhi', 'Gurgaon', 'Noida', 'Block', 'Pocket'];
            const addressSegments = parts.filter(p => addrKeys.some(k => p.toLowerCase().includes(k.toLowerCase())));
            if (addressSegments.length > 0) {
                result.address = addressSegments.join(', ');
            } else if (parts[1].length > 10) {
                // Fallback: second part is usually address if long
                result.address = parts[1];
            }
        }

        // 4. Complaint is usually the last part or whole text
        result.complaint = parts[parts.length - 1] || text;

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
                console.error("❌ Missing VITE_GEMINI_API_KEY in environment variables.");
                setError("Configuration error: API Key missing.");
                setIsLoading(false);
                return;
            }

            // Fallback for text mode if AI fails or user wants simple scan
            if (mode === 'text' && inputText.length < 50) {
                console.log("💡 Context looks short, pre-parsing with Simple Parser...");
                const preParsed = simpleParser(inputText);
                // We'll still try AI, but we have this ready
            }

            const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });

            const prompt = `Extract customerName, phone (10 digits), address, complaint, and serviceCategory (Chimney, Cooktop, etc.) from this text. Return ONLY a JSON object.`;

            const ticketSchema = {
                type: Type.OBJECT,
                properties: {
                    customerName: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    address: { type: Type.STRING },
                    complaint: { type: Type.STRING },
                    serviceCategory: { type: Type.STRING },
                },
                required: ["customerName", "phone", "address", "complaint", "serviceCategory"]
            };

            const parts: any[] = [];
            if (mode === 'text') {
                parts.push({ text: inputText });
            } else if (inputFile) {
                const base64Data = await fileToBase64(inputFile);
                parts.push({ inlineData: { mimeType: inputFile.type, data: base64Data } });
            }

            console.log("📡 Sending request to Gemini (gemini-1.5-flash)...");

            // THE DEFINITIVE FIX: Use config object with snake_case mapped keys for @google/genai
            const result: any = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{
                    role: 'user',
                    parts: parts
                }],
                config: {
                    // @ts-ignore
                    system_instruction: prompt,
                    // @ts-ignore
                    generation_config: {
                        response_mime_type: "application/json",
                    }
                }
            });

            console.log("✅ AI Response received:", JSON.stringify(result, null, 2));

            let jsonString = "";
            if (typeof result.text === 'string') {
                jsonString = result.text;
            } else if (typeof result.text === 'function') {
                jsonString = await result.text();
            } else if (result.response && typeof result.response.text === 'function') {
                jsonString = await result.response.text();
            } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                jsonString = result.candidates[0].content.parts[0].text;
            }

            if (!jsonString) {
                console.warn("⚠️ AI returned empty, trying Simple Parser...");
                if (mode === 'text') {
                    onParsed(simpleParser(inputText));
                    return;
                }
                throw new Error("Empty response from AI");
            }

            console.log("📄 Extracted JSON String:", jsonString);
            const cleanJson = jsonString.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);
            onParsed(parsedData);

        } catch (err: any) {
            console.error("❌ AI Parsing Error Details:", err);

            if (mode === 'text') {
                console.log("🛠️ Falling back to Simple Parser due to error...");
                onParsed(simpleParser(inputText));
            } else {
                const errorMessage = err?.message || 'Unknown error';
                const errorDetails = err?.status ? ` (Status: ${err.status})` : '';
                setError(`AI Magic Scan Error: ${errorMessage}${errorDetails}. Please try typing manually.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">
                            Create Ticket from {mode === 'text' ? 'Text' : 'Photo'}
                        </h3>
                        <button onClick={onClose} disabled={isLoading} className="text-2xl font-bold text-gray-500 hover:text-gray-800 disabled:opacity-50">&times;</button>
                    </div>

                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                    <div className="space-y-4">
                        {mode === 'text' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Paste WhatsApp or Excel text</label>
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    rows={8}
                                    placeholder="Paste text from a WhatsApp message or a row from an Excel sheet. e.g., Customer: Anil Sharma, Phone: 9812345678, Address: 123 MG Road, Delhi. Complaint: Chimney not working."
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-glen-blue focus:border-glen-blue"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Upload screenshot or photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-glen-light-blue file:text-glen-blue hover:file:bg-blue-100"
                                />
                                {preview && <img src={preview} alt="Preview" className="mt-4 rounded-lg max-h-48" />}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-6">
                        <button type="button" onClick={onClose} disabled={isLoading} className="text-gray-500 font-bold py-2 px-4 hover:text-gray-800 transition-colors disabled:opacity-50">Cancel</button>

                        <div className="flex space-x-2">
                            {mode === 'text' && (
                                <button
                                    type="button"
                                    onClick={() => onParsed(simpleParser(inputText))}
                                    disabled={isLoading || !inputText}
                                    className="bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 border border-gray-300"
                                >
                                    Simple Fast Scan
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleParse}
                                disabled={isLoading}
                                className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center shadow-md"
                            >
                                {isLoading && <Spinner />}
                                {isLoading ? 'Analyzing...' : 'AI Magic Scan'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default IntelligentAddTicketModal;
