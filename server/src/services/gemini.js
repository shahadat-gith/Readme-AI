// src/services/gemini.js
import { GoogleGenAI } from '@google/genai';
import { README_SYSTEM_INSTRUCTION } from '../utils/promptBuilder.js';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environmental variable is missing from the operational environment.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Routes prompts to Gemini 2.5 Flash.
 *
 * @param {string} userPromptPayload - The user prompt / chat content.
 * @param {object} [options] - Optional config.
 * @param {string|null} [options.systemInstruction=null] - System instruction (pass README_SYSTEM_INSTRUCTION for readme generation, null for chat).
 * @param {number} [options.temperature=0.2] - Model temperature.
 * @returns {Promise<string>} The generated text.
 */
export async function getAiResponse(userPromptPayload, options = {}) {
  const systemInstruction = options.systemInstruction ?? null;
  const temperature = options.temperature ?? 0.2;

  const config = { temperature };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPromptPayload,
      config,
    });

    if (!response || !response.text) {
      throw new Error("Empty or structurally broken response received from the Gemini API gateway.");
    }

    return response.text;
  } catch (error) {
    console.error(`[Inference Engine Exception]: Generation failure: ${error.message}`);
    throw error;
  }
}