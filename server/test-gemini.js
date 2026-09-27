import * as dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Hello",
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("Actual error:", e);
  }
}
run();
