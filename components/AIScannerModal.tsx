import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';

interface AIScannerModalProps {
  onClose: () => void;
  onTicketCreated: (ticket: any) => void;
}

// Convert image file to base64 (strip the data:... prefix)
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

type ScanStep = 'idle' | 'scanning' | 'preview' | 'saving' | 'done' | 'error';

const AIScannerModal: React.FC<AIScannerModalProps> = ({ onClose, onTicketCreated }) => {
  const [step, setStep] = useState<ScanStep>('idle');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<{
    customer_name: string;
    phone: string;
    address: string;
    complaint: string;
  } | null>(null);
  const [savedTicket, setSavedTicket] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ─── Handle file/camera select ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputFile(file);
    
    // Cleanup old URL if it exists
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    
    setImagePreview(URL.createObjectURL(file));
    setStep('idle');
    setExtracted(null);
    setErrorMessage('');
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  // ─── Step 1: Send image to Gemini ─────────────────────────────────────────
  const handleScan = async (retryCount = 0) => {
    if (!inputFile) {
      setErrorMessage('Please capture or upload a complaint image.');
      return;
    }

    setStep('scanning');
    setErrorMessage('');

    try {
      const apiKey = 
        localStorage.getItem('glen_gemini_key') || 
        import.meta.env.VITE_GEMINI_API_KEY || 
        // @ts-ignore
        (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null) ||
        // @ts-ignore
        import.meta.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'undefined') {
        throw new Error('Gemini API Key missing. Please set VITE_GEMINI_API_KEY.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64 = await fileToBase64(inputFile);

      const prompt = `Act as a service center data entry specialist. Extract these 4 specific fields from the attached complaint ticket image:
1. Customer Name
2. Mobile/Phone Number
3. Complete Address
4. Complaint Details (What is the issue?)

Return ONLY a valid JSON object in this format:
{
  "customer_name": "...",
  "phone": "...",
  "address": "...",
  "complaint": "..."
}
Guidelines:
- If a field is missing, use an empty string.
- Clean the phone number to digits only.
- Be accurate with the address as it's used for service navigation.`;

      console.log("📡 Running AI reconstruction...");
      
      const result: any = await ai.models.generateContent({
        model: 'gemini-1.5-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: inputFile.type, data: base64 } },
              { text: prompt },
            ],
          },
        ],
      });

      let rawText = '';
      if (result.response?.text) {
        rawText = typeof result.response.text === 'function' ? await result.response.text() : result.response.text;
      } else if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawText = result.candidates[0].content.parts[0].text;
      } else if (typeof result?.text === 'string') {
        rawText = result.text;
      }

      if (!rawText) throw new Error('AI could not identify any text. Please try a clearer photo.');

      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (!parsed.customer_name && !parsed.complaint) {
        throw new Error('Required fields (Name/Complaint) not found. Try again.');
      }

      // Cleanup
      parsed.phone = (parsed.phone || '').replace(/\D/g, '');

      setExtracted(parsed);
      setStep('preview');
    } catch (err: any) {
      console.error('❌ Gemini scan error:', err);
      
      // AUTO-RETRY LOGIC for common temporary errors
      const isTemporary = err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('rate limit');
      if (isTemporary && retryCount < 1) {
        console.log("🔄 Model busy, retrying in 2 seconds...");
        setTimeout(() => handleScan(retryCount + 1), 2000);
        return;
      }

      let msg = err.message || 'AI could not read the image.';
      if (msg.includes('404') || msg.includes('not found')) {
        msg = "Connecting to Vision AI. Please scan again.";
      }
      if (msg.includes('429') || msg.includes('limit')) {
        msg = "AI model is currently busy. Retrying in 10 seconds...";
      }
      
      setErrorMessage(`Scan Error: ${msg}`);
      setStep('error');
    }
  };

  // ─── Step 2: Save to Supabase ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!extracted) return;

    setStep('saving');
    setErrorMessage('');

    try {
      const newId = `TKT-${Date.now()}`;
      const now = new Date().toISOString();

      const payload = {
        id: newId,
        customer_name: extracted.customer_name || 'Unknown',
        phone: extracted.phone || '',
        address: extracted.address || '',
        complaint: extracted.complaint || '',
        status: 'New',
        created_at: now,
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);

      setSavedTicket(data || payload);
      setStep('done');
      onTicketCreated(data || payload);
    } catch (err: any) {
      console.error('❌ Supabase save error:', err);
      setErrorMessage('Saving failed: ' + (err.message || 'Database error.'));
      setStep('error');
    }
  };

  const handleFieldChange = (field: keyof typeof extracted, value: string) => {
    if (!extracted) return;
    setExtracted({ ...extracted, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">

        {/* Dynamic Header */}
        <div className={`px-8 py-6 flex items-center justify-between transition-colors duration-500 shrink-0 ${
          step === 'done' ? 'bg-green-600' :
          step === 'error' ? 'bg-red-600' :
          'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800'
        }`}>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">AI Complaint Scanner</h3>
            <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
              {step === 'idle' && 'Scanner Standby'}
              {step === 'scanning' && 'Analyzing Handwritting…'}
              {step === 'preview' && 'Review Ticket Details'}
              {step === 'saving' && 'Syncing Cloud State'}
              {step === 'done' && 'Process Success!'}
              {step === 'error' && 'Capture Failed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
            disabled={step === 'scanning' || step === 'saving'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">

          {/* ── DONE state ─────────────────────────────────────────────────── */}
          {step === 'done' && savedTicket && (
            <div className="space-y-6 animate-in zoom-in-95 duration-400">
              <div className="bg-green-50 border-2 border-green-200 rounded-[2rem] p-6 relative overflow-hidden">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-green-800 font-black text-xl">Ticket Successfully Created!</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Ticket ID', val: savedTicket.id },
                    { label: 'Name', val: savedTicket.customer_name },
                    { label: 'Mobile', val: savedTicket.phone },
                    { label: 'Complaint', val: savedTicket.complaint },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm items-baseline">
                      <span className="text-green-700 font-bold opacity-60 text-xs uppercase tracking-wider">{item.label}</span>
                      <span className="text-green-950 font-black text-right ml-4 truncate max-w-[180px]">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-900 text-white font-black py-5 rounded-[1.5rem] hover:bg-black transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] active:scale-95"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}

          {/* ── All other states ────────────────────────────────────────────── */}
          {step !== 'done' && (
            <>
              {/* Media Selection Area */}
              <div className="space-y-4">
                {/* Hidden Inputs */}
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} ref={cameraInputRef} className="hidden" />

                {imagePreview ? (
                  <div className="relative group overflow-hidden rounded-[2rem] border-4 border-indigo-50 shadow-2xl bg-gray-50 aspect-video flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Complaint"
                      className="max-h-full object-contain"
                    />
                    {!['scanning', 'saving'].includes(step) && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 gap-6 backdrop-blur-[2px]">
                        <button onClick={triggerCamera} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-2xl hover:scale-110 active:scale-90 transition-transform">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={triggerUpload} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-2xl hover:scale-110 active:scale-90 transition-transform">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5">
                    <button
                      onClick={triggerCamera}
                      className="flex flex-col items-center justify-center p-8 bg-blue-50 border-2 border-blue-100 rounded-[2rem] hover:bg-blue-100 hover:border-blue-200 transition-all group shadow-sm hover:shadow-lg"
                    >
                      <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center text-blue-600 shadow-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Take Photo</span>
                    </button>
                    <button
                      onClick={triggerUpload}
                      className="flex flex-col items-center justify-center p-8 bg-purple-50 border-2 border-purple-100 rounded-[2rem] hover:bg-purple-100 hover:border-purple-200 transition-all group shadow-sm hover:shadow-lg"
                    >
                      <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center text-purple-600 shadow-xl mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className="text-xs font-black text-purple-900 uppercase tracking-widest">Upload File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error message */}
              {(step === 'error' || errorMessage) && (
                <div className="bg-red-50 border-2 border-red-100 text-red-700 rounded-[1.5rem] p-5 text-xs font-bold leading-relaxed animate-shake">
                  <div className="flex gap-3">
                    <span className="text-lg">⚠️</span>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Extracted data preview (editable) */}
              {(step === 'preview' || (step === 'error' && extracted)) && (
                <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-600">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Extracted Fields</span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {(
                      [
                        { key: 'customer_name' as const, label: 'Name', icon: '👤' },
                        { key: 'phone' as const, label: 'Mobile Number', icon: '📱' },
                        { key: 'address' as const, label: 'Address', icon: '📍' },
                        { key: 'complaint' as const, label: 'Complaint about?', icon: '📝' },
                      ]
                    ).map(({ key, label, icon }) => (
                      <div key={key} className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">{icon}</div>
                        <label className="absolute left-12 top-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest">{label}</label>
                        <input
                          type="text"
                          value={extracted?.[key] || ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl pl-12 pr-4 pt-7 pb-3 text-sm font-black text-gray-900 focus:outline-none focus:border-indigo-300 focus:bg-white focus:shadow-[0_8px_20px_-8px_rgba(79,70,229,0.2)] transition-all"
                          placeholder={`Enter ${label}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2">
                {imagePreview && (step === 'idle' || step === 'error') && !extracted && (
                  <button
                    onClick={handleScan}
                    className="w-full py-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-[1.5rem] text-lg font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(67,56,202,0.4)]"
                  >
                    ✨ Run AI Extraction
                  </button>
                )}

                {step === 'scanning' && (
                  <button
                    disabled
                    className="w-full py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] text-lg font-black flex items-center justify-center gap-4"
                  >
                    <div className="w-6 h-6 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    Thinking…
                  </button>
                )}

                {step === 'preview' && (
                  <button
                    onClick={handleSave}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] text-lg font-black hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(16,185,129,0.4)]"
                  >
                    🚀 Save to Dashboard
                  </button>
                )}

                {step === 'saving' && (
                  <button
                    disabled
                    className="w-full py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] text-lg font-black flex items-center justify-center gap-4"
                  >
                    <div className="w-6 h-6 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    Saving…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIScannerModal;
