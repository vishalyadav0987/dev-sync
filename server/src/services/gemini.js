import { GoogleGenAI } from '@google/genai';

let ai;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * Analyzes a problem and code submission using Gemini
 * to generate time/space complexity, edge cases, approach, tags, and statement.
 */
export async function analyzeProblemWithGemini({ title, code, customInput }) {
  const currentAi = getAI();
  if (!currentAi) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  // Simplified prompt: Removed manual JSON escaping rules. 
  // The SDK handles JSON stringification natively now.
  const prompt = `
Analyze the following competitive programming / Data Structures and Algorithms code for the problem: "${title}".

Here is the code:
${code}
${customInput ? `\nAnalyze it specifically for this custom input: ${customInput}` : ''}

You are an expert software engineer. Provide a detailed analysis.

CRITICAL INSTRUCTIONS FOR 'primaryCategory':
Choose the single most dominant data structure or algorithmic paradigm (e.g., Matrix, Backtracking, Arrays, Linked Lists, Graphs, Trees, Dynamic Programming). NEVER use "LeetCode" or generic terms as a category. If it is a Matrix problem, output "Matrix".

CRITICAL INSTRUCTIONS FOR 'visualHtml':
Create a rich, interactive HTML/JS simulation and analyzer dashboard for this code. Use modern vanilla CSS (dark theme, #1e1e1e background, dashboard-style layout, flexbox/grid, no Tailwind). 
The layout MUST strictly follow this structure:
1. Top Section: An input bar where the user can enter custom inputs and a 'Load & Restart' button.
2. Main Content Split: Below the top section, split the screen into two main columns (Left and Right).
3. Left Column (State & Controls):
   - TOP of left column: A live "Local Variables Scope" dashboard showing the current state of important variables as small badges/boxes.
   - MIDDLE of left column: A step-by-step visualizer that visually highlights the current data structures (e.g., Matrix, Arrays, Pointers).
   - BOTTOM of left column: Step controls (Previous Step, Next Step, Auto Run) and a status log.
4. Right Column (Code):
   - A panel displaying the original code, where lines are dynamically highlighted as the simulation runs.

Embed all JS logic to simulate the execution. Ensure it is a complete, self-contained HTML block (with html, head, style, body).
`;

  // Define the strict schema to enforce output and eliminate string-escaping timeouts
  const responseSchema = {
    type: "OBJECT",
    properties: {
      edgeCases: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      approachNotes: { type: "STRING" },
      timeComplexity: { type: "STRING" },
      spaceComplexity: { type: "STRING" },
      tags: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      primaryCategory: { type: "STRING" },
      statement: { type: "STRING" },
      visualHtml: { type: "STRING" }
    },
    required: ["edgeCases", "approachNotes", "timeComplexity", "spaceComplexity", "tags", "primaryCategory", "statement", "visualHtml"]
  };

  let retries = 5;       // Increased from 3
  let delay = 3000;      // Start at 3 seconds
  let currentModel = "gemini-3.6-flash";
  const fallbackModel = "gemini-3.5-flash-lite"; // High-throughput fallback model

  while (retries > 0) {
    try {
      const response = await currentAi.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });

      // SDK automatically parses when responseSchema is provided, 
      // but we safely parse just in case it returns raw text.
      const text = response.text || "{}";
      return typeof text === 'string' ? JSON.parse(text) : text;

    } catch (error) {
      const errorStr = String(error);
      const isRetryable = error?.status === 503 || error?.status === 429 || errorStr.includes('503') || errorStr.includes('429');
      retries--;

      if (isRetryable && retries > 0) {
        // Add random jitter (0-1000ms) to avoid thundering herd collisions
        const jitter = Math.floor(Math.random() * 1000);
        const waitTime = delay + jitter;

        console.warn(`[Gemini API] Capacity limit on ${currentModel}. Retrying in ${waitTime}ms... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, waitTime));

        delay *= 2; // Exponential backoff

        // Fallback Strategy: Switch to lighter model if the primary is persistently failing
        if (retries <= 2 && currentModel === "gemini-3.6-flash") {
          console.warn(`[Gemini API] Switching to fallback model: ${fallbackModel}`);
          currentModel = fallbackModel;
        }
      } else if (isRetryable && retries === 0) {
        console.error("[Gemini API] Exhausted all retries.");
        throw new Error("Failed to generate analysis: AI models are experiencing exceptionally high demand. Please try again in a few minutes.");
      } else {
        // Immediately throw on non-retryable errors (e.g., Auth, Bad Request)
        console.error("Gemini Analysis Error:", error);
        throw new Error('Failed to generate analysis using Gemini: ' + (error.message || error));
      }
    }
  }
}