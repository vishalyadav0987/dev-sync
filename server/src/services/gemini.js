import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

/**
 * -----------------------------------------------------------------------
 * CHANGELOG (latest first)
 * -----------------------------------------------------------------------
 * v3 -- visualizer quality
 *  - Reference example replaced with the full "VS Code" style visualizer
 *    (dashboard badges, physical-memory node cards with pointer badges,
 *    colored step log, syntax-highlighted code panel). The old minimal
 *    reference was the reason generated visualizers looked bare.
 *  - Prompt now spells out that design system component-by-component and
 *    requires lineOf(snippet) line resolution -- hardcoded line numbers
 *    were the #1 cause of the highlighted line drifting from the log.
 *  - Visualizer token budget raised: gpt-oss and Gemini Flash both spend
 *    reasoning/thinking tokens out of the same output budget, so 12K
 *    routinely truncated a rich page.
 *  - HTML output is extracted/validated per provider (strips chatter,
 *    requires </html>), so a truncated or chatty Groq response now falls
 *    through to Gemini instead of being saved broken.
 *
 * v2 -- reliability (see git history for details)
 *  - live Gemini aliases, schema-strict Groq JSON, single shared schema,
 *    truncation checks, shared retry helper, analysis + visualizer split
 *    into two concurrent calls.
 * -----------------------------------------------------------------------
 */

const __dirname = dirname(fileURLToPath(import.meta.url));

let VISUALIZER_REFERENCE_EXAMPLE;
try {
  VISUALIZER_REFERENCE_EXAMPLE = readFileSync(join(__dirname, 'visualizer-reference-example.html'), 'utf-8');
} catch (err) {
  throw new Error(
    `Could not load visualizer-reference-example.html next to aiAnalyzer.js -- ` +
    `keep the reference template file alongside this module. (${err.message})`
  );
}

/* ------------------------------------------------------------------ */
/* AI client singletons                                               */
/* ------------------------------------------------------------------ */

let geminiClient;
let groqClient;

function getGeminiAI() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

function getGroqAI() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/* ------------------------------------------------------------------ */
/* Model configuration                                                */
/* ------------------------------------------------------------------ */

const GROQ_MODEL = 'openai/gpt-oss-20b';
const GEMINI_MODEL_PRIMARY = 'gemini-flash-latest';
const GEMINI_MODEL_FALLBACK = 'gemini-flash-lite-latest';

const ANALYSIS_MAX_TOKENS = 4096;
// Rich visualizer ≈ 6-9K tokens of HTML + reasoning tokens on top.
const VISUALIZER_MAX_TOKENS = 32000;
const MAX_CODE_LENGTH = 20000;

/* ------------------------------------------------------------------ */
/* Schema -- single source of truth, shared by both providers         */
/* ------------------------------------------------------------------ */

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    edgeCases: { type: 'array', items: { type: 'string' } },
    approachNotes: { type: 'string' },
    timeComplexity: { type: 'string' },
    spaceComplexity: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    primaryCategory: {
      type: 'string',
      description:
        'The single most dominant data structure or algorithmic paradigm ' +
        '(e.g. Matrix, Backtracking, Arrays, Linked Lists, Graphs, Trees, ' +
        'Dynamic Programming). Never a generic label like "LeetCode".',
    },
    statement: { type: 'string' },
  },
  required: ['edgeCases', 'approachNotes', 'timeComplexity', 'spaceComplexity', 'tags', 'primaryCategory', 'statement'],
};

function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === 'additionalProperties') continue;
      out[key] = key === 'type' && typeof value === 'string' ? value.toUpperCase() : toGeminiSchema(value);
    }
    return out;
  }
  return node;
}

/* ------------------------------------------------------------------ */
/* Prompts                                                            */
/* ------------------------------------------------------------------ */

function buildAnalysisPrompt({ title, code, customInput }) {
  return `You are an expert software engineer reviewing a competitive-programming / DSA submission.

Problem title: "${title}"

Code submission:
\`\`\`
${code}
\`\`\`
${customInput ? `\nPay particular attention to how the code behaves on this custom input: ${customInput}` : ''}

Return your analysis as the fields defined by the schema:
- edgeCases: concrete edge cases this code should handle (or currently mishandles).
- approachNotes: a concise explanation of the algorithmic approach actually used.
- timeComplexity / spaceComplexity: Big-O notation with a short justification.
- tags: lowercase topic tags (e.g. "backtracking", "two-pointers").
- primaryCategory: the single most dominant data structure or algorithmic paradigm.
- statement: a clean restatement of the problem this code appears to solve.

Base every field on the code as written -- do not guess at behavior it doesn't actually have.`;
}

function buildVisualizerPrompt({ title, code, customInput }) {
  return `You are a senior frontend engineer building a self-contained, interactive HTML/JS
step-by-step execution visualizer for a DSA solution.

The REFERENCE EXAMPLE below is the quality bar and the design system. Copy its CSS
variables, component classes, layout, controls, rendering approach and code structure
(sections 1-6 in its <script>). It is NOT a content template: do not reuse its problem,
code, input, or step logic.

--- REFERENCE EXAMPLE START ---
${VISUALIZER_REFERENCE_EXAMPLE}
--- REFERENCE EXAMPLE END ---

Build the visualizer for THIS submission:

Problem title: "${title}"
Code submission:
\`\`\`
${code}
\`\`\`
${customInput ? `\nPre-fill the input(s) with this custom input: ${customInput}` : ''}

REQUIRED UI (same look as the reference, component for component):
1. .top-bar: a labeled input per function argument (e.g. "Linked list values:", "Target:"),
   a yellow "Random" button producing valid random input, and "Load & Restart". Enter reloads.
2. Left column, three .card blocks:
   a. .dashboard of .badge tiles: "Frame" (current function / recursion depth), "Phase",
      then EVERY live local variable of the current frame. Changed values get .changed.
   b. .visualizer-area with a .section-title, drawing the structures THIS code uses:
      - linked list: .ll-node cards (header N<id>, big value, "next: N<k>/NULL" footer),
        .ptr-badge pointer tags underneath, .hl for nodes touched this step, .deleted for
        unlinked nodes;
      - array/string: indexed cells with pointer badges (i, j, left, right, mid...);
      - matrix/grid: CSS grid of cells with row/col labels and visited/current states;
      - tree/graph: positioned nodes with inline SVG edges;
      - stack/queue/heap/hash map/set: labeled boxes or key→value tables;
      - recursion/backtracking: a call-stack panel listing frames with their arguments.
      Several structures may appear side by side. Pick what fits; never force a linked list.
   c. .logs-card: ◄ Previous / Next ► / Auto Run (turns red "Pause"), speed slider,
      "Step X / N" counter, and a .log-box with one entry per step using the
      latest / success / warn / error classes for normal / found-or-return / mutation /
      removal-or-failure steps.
3. Right column: .code-header with a filename matching the language (Solution.cpp,
   Solution.java, solution.py, solution.js...), .code-body with line numbers, syntax
   highlighting via a single-pass tokenizer (adapt the keyword/type lists to the
   language), and the active line highlighted and scrolled inside the panel only.
4. Keyboard: ArrowLeft / ArrowRight / Space. Responsive column stacking under 900px.

CORRECTNESS (more important than polish):
- The steps must trace the REAL control flow of the code above: real loop bounds, every
  loop-condition check including the final failing one, recursive calls and returns in
  the order they happen, and every variable mutation. Never simplify the algorithm.
- Line numbers: put the code verbatim in rawCode (escape any \` as \\\` and \${ as \\\${),
  and resolve EVERY highlighted line with lineOf('unique snippet', afterLine) exactly as
  the reference does. Never write a line number literal.
- Each step is a full snapshot (deep-copied structures + locals). The dashboard, the
  visual, the log message, and the highlighted line must agree at every step.
- Escape all text inserted via innerHTML. Parse input leniently ("1,2,3" or "[1, 2, 3]"),
  cap input size, cap total steps, and show the real behavior on edge input (empty,
  single element, NULL dereference) as an error step instead of crashing.
- Entirely client-side: no network requests, no external libraries or fonts, no
  localStorage.

Respond with ONLY the raw HTML document, starting with <!DOCTYPE html> and ending with
</html>. No JSON, no commentary, no markdown fences.`;
}

/* ------------------------------------------------------------------ */
/* Low-level helpers                                                  */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Truncation / bad-output errors are deliberately NOT retryable on the same
// provider -- the same budget truncates again. They fall through to the next
// provider instead.
function isRetryableApiError(err) {
  const status = err?.status ?? err?.response?.status;
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message ?? err);
  return /\b(429|500|502|503|504)\b/.test(msg) || /rate.?limit|overloaded|unavailable/i.test(msg);
}

async function withRetry(taskFn, { maxAttempts, baseDelayMs, isRetryable = isRetryableApiError, onRetry }) {
  let delay = baseDelayMs;
  for (let attempt = 1; ; attempt++) {
    try {
      return await taskFn(attempt);
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryable(err)) throw err;
      const wait = delay + Math.floor(Math.random() * 400);
      onRetry?.(err, attempt, wait);
      await sleep(wait);
      delay *= 2;
    }
  }
}

function stripCodeFence(text) {
  const match = text.trim().match(/^```(?:json|html)?\s*\n?([\s\S]*?)\n?```$/);
  return match ? match[1] : text;
}

function safeParseJSON(text) {
  const cleaned = stripCodeFence(text).trim();
  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new Error(`Model did not return valid JSON (${parseError.message}).`);
  }
}

// Pulls the HTML document out of whatever the model returned (fences,
// "Here is your visualizer:" chatter) and rejects incomplete documents.
function extractHtmlDocument(text) {
  const start = text.search(/<!DOCTYPE html|<html[\s>]/i);
  const end = text.toLowerCase().lastIndexOf('</html>');
  if (start === -1) throw new Error('Visualizer output contains no HTML document.');
  if (end === -1 || end < start) throw new Error('Visualizer HTML is incomplete (missing </html>).');
  const html = text.slice(start, end + '</html>'.length);
  if (!/<script[\s>]/i.test(html)) throw new Error('Visualizer HTML has no <script>; it cannot step through anything.');
  return html;
}

/* ------------------------------------------------------------------ */
/* Provider calls                                                     */
/* ------------------------------------------------------------------ */

async function callGroqOnce({ prompt, schema, schemaName, maxTokens, temperature = 0.2, reasoningEffort = 'low' }) {
  const client = getGroqAI();
  if (!client) throw new Error('Groq is not configured.');

  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_completion_tokens: maxTokens,
        reasoning_effort: reasoningEffort, // gpt-oss: reasoning tokens share max_completion_tokens
        ...(schema
          ? { response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } } }
          : {}),
      });

      const choice = completion.choices?.[0];
      const content = choice?.message?.content;
      if (choice?.finish_reason === 'length') {
        throw new Error(`Groq truncated the response (hit max_completion_tokens=${maxTokens}).`);
      }
      if (!content) throw new Error('Groq returned an empty response.');
      return schema ? safeParseJSON(content) : stripCodeFence(content).trim();
    },
    {
      maxAttempts: 2,
      baseDelayMs: 500,
      onRetry: (err, attempt, wait) =>
        console.warn(`[AI Analyzer] Groq attempt ${attempt} failed (${err.message}); retrying in ${wait}ms.`),
    }
  );
}

async function callGeminiOnce({ prompt, schema, maxTokens, temperature = 0.2 }) {
  const client = getGeminiAI();
  if (!client) throw new Error('Gemini is not configured.');

  return withRetry(
    async (attempt) => {
      const model = attempt >= 3 ? GEMINI_MODEL_FALLBACK : GEMINI_MODEL_PRIMARY;
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(schema ? { responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema) } : {}),
        },
      });

      const text = response.text;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(`Gemini (${model}) truncated the response (hit maxOutputTokens=${maxTokens}).`);
      }
      if (!text) throw new Error(`Gemini (${model}) returned an empty response.`);
      return schema ? safeParseJSON(text) : stripCodeFence(text).trim();
    },
    {
      maxAttempts: 4,
      baseDelayMs: 2000,
      onRetry: (err, attempt, wait) =>
        console.warn(`[AI Analyzer] Gemini attempt ${attempt} failed (${err.message}); retrying in ${wait}ms.`),
    }
  );
}

/**
 * Groq first, Gemini fallback. `transform` runs inside each provider's
 * attempt, so output that fails validation (e.g. truncated HTML) moves on
 * to the next provider instead of being returned.
 */
async function generateWithFallback({ prompt, schema, schemaName, maxTokens, temperature, reasoningEffort, transform = (x) => x }) {
  const hasGroq = !!getGroqAI();
  const hasGemini = !!getGeminiAI();
  if (!hasGroq && !hasGemini) {
    throw new Error('No AI provider configured. Please set GROQ_API_KEY or GEMINI_API_KEY.');
  }

  const failures = [];
  const label = schemaName ?? 'visualizer';
  const providers = [
    hasGroq && ['Groq', () => callGroqOnce({ prompt, schema, schemaName, maxTokens, temperature, reasoningEffort })],
    hasGemini && ['Gemini', () => callGeminiOnce({ prompt, schema, maxTokens, temperature })],
  ].filter(Boolean);

  for (const [name, call] of providers) {
    try {
      return transform(await call());
    } catch (err) {
      failures.push(`${name}: ${err.message}`);
      console.warn(`[AI Analyzer] ${name} failed for "${label}": ${err.message}`);
    }
  }
  throw new Error(`All configured AI providers failed for "${label}". ${failures.join(' | ')}`);
}

/* ------------------------------------------------------------------ */
/* Input / output validation                                          */
/* ------------------------------------------------------------------ */

function assertValidInput({ title, code }) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('A non-empty "title" is required.');
  if (typeof code !== 'string' || !code.trim()) throw new Error('A non-empty "code" submission is required.');
}

function clampCode(code) {
  if (code.length <= MAX_CODE_LENGTH) return code;
  console.warn(`[AI Analyzer] Code submission truncated from ${code.length} to ${MAX_CODE_LENGTH} chars.`);
  return `${code.slice(0, MAX_CODE_LENGTH)}\n/* ...truncated for length... */`;
}

function validateAnalysisResult(result) {
  const missing = ANALYSIS_SCHEMA.required.filter((key) => result[key] == null);
  if (missing.length) throw new Error(`AI response is missing required field(s): ${missing.join(', ')}`);
  if (!Array.isArray(result.edgeCases) || !Array.isArray(result.tags)) {
    throw new Error('AI response has the wrong type for "edgeCases" or "tags" (expected arrays).');
  }
  if (typeof result.visualHtml !== 'string' || !result.visualHtml.trim()) result.visualHtml = null;
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export async function analyzeProblemWithGemini({ title, code, customInput }) {
  assertValidInput({ title, code });
  const safeCode = clampCode(code);

  const [analysisOutcome, visualizerOutcome] = await Promise.allSettled([
    generateWithFallback({
      prompt: buildAnalysisPrompt({ title, code: safeCode, customInput }),
      schema: ANALYSIS_SCHEMA,
      schemaName: 'code_analysis',
      maxTokens: ANALYSIS_MAX_TOKENS,
      reasoningEffort: 'low',
    }),
    generateWithFallback({
      prompt: buildVisualizerPrompt({ title, code: safeCode, customInput }),
      maxTokens: VISUALIZER_MAX_TOKENS,
      reasoningEffort: 'medium', // tracing control flow correctly needs some thinking
      transform: extractHtmlDocument,
    }),
  ]);

  if (analysisOutcome.status === 'rejected') {
    const vizNote = visualizerOutcome.status === 'rejected' ? ` | visualizer: ${visualizerOutcome.reason.message}` : '';
    throw new Error(`Failed to generate problem analysis: ${analysisOutcome.reason.message}${vizNote}`);
  }

  let visualHtml = null;
  if (visualizerOutcome.status === 'rejected') {
    console.warn(`[AI Analyzer] Visualizer generation failed (saving analysis without it): ${visualizerOutcome.reason.message}`);
  } else {
    visualHtml = visualizerOutcome.value;
  }

  const result = { ...analysisOutcome.value, visualHtml };
  validateAnalysisResult(result);
  return result;
}

export const analyzeProblem = analyzeProblemWithGemini;