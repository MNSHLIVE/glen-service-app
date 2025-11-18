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
    const [isCooldown, setIsCooldown] = useState(false); // New state for cooldown
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInputFile(file);
            setPreview(URL.createObjectURL(file));
        }
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const prompt = `You are an intelligent assistant for a service center. Your task is to parse the provided input (text or an image of a message/document) and extract information for a new service ticket.

            Extract the following details:
            - customerName: The full name of the customer.
            - phone: The customer's phone number.
            - address: The full service address.
            - complaint: A summary of the issue or service requested.
            - serviceCategory: The type of product needing service (e.g., Chimney, Cook top, Kettle).

            Return the extracted data in a clean JSON object format. Do not include any extra text, comments, or markdown formatting like \`\`\`json.`;

            const ticketSchema = {
                type: Type.OBJECT,
                properties: {
                    customerName: { type: Type.STRING, description: "Customer's full name" },
                    phone: { type: Type.STRING, description: "Customer's phone number" },
                    address: { type: Type.STRING, description: "Full service address" },
                    complaint: { type: Type.STRING, description: "Summary of the complaint" },
                    serviceCategory: { type: Type.STRING, description: "Product category for service" },
                },
                required: ["customerName", "phone", "address", "complaint", "serviceCategory"]
            };

            const parts: any[] = [];

            if (mode === 'text') {
                parts.push({ text: inputText });
            } else if (inputFile) {
                const base64Data = await fileToBase64(inputFile);
                parts.push({
                    inlineData: {
                        mimeType: inputFile.type,
                        data: base64Data
                    }
                });
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    systemInstruction: prompt,
                    responseMimeType: "application/json",
                    responseSchema: ticketSchema,
                },
            });

            const jsonString = response.text;
            const parsedData = JSON.parse(jsonString);
            onParsed(parsedData);

        } catch (err: any) {
            console.error(err);
             // Specific handling for 429 errors
            if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit'))) {
                setError('Too many requests. Please wait a few seconds before trying again.');
            } else {
                setError('Failed to parse the data. The AI could not understand the input. Please check the content or try again.');
            }
        } finally {
            setIsLoading(false);
            // Start cooldown period
            setIsCooldown(true);
            setTimeout(() => setIsCooldown(false), 5000); // 5-second cooldown
        }
    };

    const getButtonText = () => {
        if (isLoading) return 'Analyzing...';
        if (isCooldown) return 'Please wait...';
        return 'Analyze & Prefill';
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
                    
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">Cancel</button>
                        <button 
                            type="button" 
                            onClick={handleParse} 
                            disabled={isLoading || isCooldown}
                            className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center"
                        >
                            {isLoading && <Spinner />}
                            {getButtonText()}
                        </button>
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