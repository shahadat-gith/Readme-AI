// src/services/embedding.js
import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.error('Error: HF_TOKEN environmental variable is missing.');
  process.exit(1);
}

// Initialize the standard modern Hugging Face client wrapper
const hf = new InferenceClient(HF_TOKEN);

/**
 * Generates a 384-dimensional vector embedding for a given text block.
 * @param {string} text - The raw text or code chunk payload.
 * @returns {Promise<number[]>} Array of floats representing the dense embedding.
 */
export async function generateEmbedding(text) {
  try {
    if (!text || text.trim() === '') {
      throw new Error('Cannot generate embedding for empty string contents.');
    }

    // Use featureExtraction to convert input text data into dense float vectors
    const vectorResult = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    });

    // Ensure we are returning a flat array of floats
    if (Array.isArray(vectorResult) && Array.isArray(vectorResult[0])) {
      return vectorResult[0];
    }
    
    return vectorResult;
  } catch (error) {
    throw error;
  }
}