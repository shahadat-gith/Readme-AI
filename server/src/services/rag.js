// src/services/rag.js
import { generateEmbedding } from './embedding.js';
import { vectorSearch } from './vector.js';
import Repository from '../models/Repository.js';

/**
 * Builds a context payload for a repository by retrieving relevant code chunks.
 * @param {string} repositoryId - The target MongoDB collection document ID.
 * @param {string} queryText - The text query or prompt instruction.
 * @param {number} chunkLimit - Max number of relevant files to pull into the context.
 * @returns {Promise<{contextString: string, repository: Object}>} The structured prompt context block and metadata.
 */
export async function buildRAGContext(repositoryId, queryText, chunkLimit = 6) {
  try {
    // 1. Fetch the master repository tracking profile record metadata
    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      throw new Error(`Repository record profile [ID: ${repositoryId}] not found.`);
    }

    const queryVector = await generateEmbedding(queryText);
    const matchedChunks = await vectorSearch(repositoryId, queryVector, chunkLimit);

    // 4. Synthesize retrieved code segments into an isolated context markdown block
    let contextString = `=== REPOSITORY METADATA ===\n`;
    contextString += `Name: ${repository.name}\n`;
    contextString += `Owner: ${repository.owner}\n`;
    contextString += `Primary Stack: ${repository.language} (${repository.framework || 'Generic'})\n`;
    contextString += `Database Layer: ${repository.database}\n`;
    contextString += `Tracked Directory Folders: ${JSON.stringify(repository.folderTree)}\n\n`;

    contextString += `=== RELEVANT CODE SNIPPETS AND CONTEXT ===\n`;
    
    if (matchedChunks.length === 0) {
      contextString += `(No targeted matching source code files found within vector search boundaries.)\n`;
    } else {
      matchedChunks.forEach((item, index) => {
        contextString += `\n[File Hit #${index + 1}]: ${item.filePath}\n`;
        contextString += `Lines: ${item.metadata?.startLine || 1} to ${item.metadata?.endLine || 'End'}\n`;
        contextString += `\`\`\`${item.metadata?.language || ''}\n`;
        contextString += `${item.chunk}\n`;
        contextString += `\`\`\`\n`;
        contextString += `----------------------------------------\n`;
      });
    }

    return { contextString, repository };
  } catch (error) {
    throw error;
  }
}