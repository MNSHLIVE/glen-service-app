
const { GoogleGenAI } = require('@google/genai');
console.log('GoogleGenAI type:', typeof GoogleGenAI);
try {
    const ai = new GoogleGenAI({ apiKey: 'test' });
    console.log('Instantiated successfully with new');
} catch (e) {
    console.log('Failed with new:', e.message);
}

const { createGoogleGenerativeAI } = require('@google/genai');
console.log('createGoogleGenerativeAI type:', typeof createGoogleGenerativeAI);
