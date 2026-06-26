// src/services/readme.js
import { buildRAGContext } from './rag.js';
import { buildReadmePrompt, README_SYSTEM_INSTRUCTION } from '../utils/promptBuilder.js';
import { getAiResponse } from './gemini.js';
import Readme from '../models/Readme.js';

/**
 * Handles the complete lifecycle for generating and persisting repository documentation files.
 * @param {string} repositoryId - Document reference key.
 * @returns {Promise<Object>} The written Mongoose Document payload.
 */
export async function generateReadmeFile(repositoryId, userId) {
  // 1. Pull code vectors into contextual strings
  const { contextString } = await buildRAGContext(
    repositoryId,
    "Generate comprehensive overview architecture directory structure installation scripts exposed endpoints setup instructions",
    15
  );

  // 2. Format using the prompt builder
  const formattedUserPrompt = buildReadmePrompt(contextString);

  // 3. Dispatch to Gemini
  const generatedMarkdownText = await getAiResponse(formattedUserPrompt, {
    systemInstruction: README_SYSTEM_INSTRUCTION,
  });

  // 4. Upsert: replace existing README for this repo+user combo if one exists
  const storedDocumentResult = await Readme.findOneAndUpdate(
    { repositoryId, user: userId },
    { repositoryId, user: userId, markdown: generatedMarkdownText },
    { upsert: true, new: true }
  );

  return storedDocumentResult;
}