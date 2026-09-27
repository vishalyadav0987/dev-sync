import * as dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { analyzeProblemWithGemini } from './server/src/services/gemini.js';
async function run() {
  try {
    const res = await analyzeProblemWithGemini({ title: "Two Sum", code: "return [0, 1];" });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
