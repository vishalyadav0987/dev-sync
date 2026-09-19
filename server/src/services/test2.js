import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'hello'
    });
    console.log("1.5 worked:", res.text);
  } catch (err) {
    console.error("1.5 error:", err.message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'hello'
    });
    console.log("3.6 worked:", res.text);
  } catch (err) {
    console.error("3.6 error:", err.message);
  }
}

test();
