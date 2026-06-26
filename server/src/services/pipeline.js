// src/services/pipeline.js
import { cloneRepository } from './clone.js';
import { parseRepository } from './parser.js';
import { extractMetadata } from './metadata.js';
import { chunkSourceCode } from './chunk.js';
import { generateEmbedding } from './embedding.js';
import { storeEmbeddings } from './vector.js';
import Repository from '../models/Repository.js';
import fs from 'fs-extra';
import pLimit from 'p-limit';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the full analysis pipeline for a repository.
 * Checks for existing analysis to avoid duplicate work.
 *
 * @param {string} githubUrl - The GitHub URL to analyze.
 * @param {string} userId - The ID of the user who owns this analysis.
 * @returns {Promise<Object>} The updated repository document.
 */
export async function runAnalysisPipeline(githubUrl, userId) {
  let temporaryDiskPath = '';

  try {
    // Check if this repo was already analyzed by this user
    const existingRepo = await Repository.findOne({ githubUrl, user: userId });
    if (existingRepo && existingRepo.name !== 'Processing...') {
      return existingRepo;
    }

    // 1. Create the repository document immediately so we have an ID
    const repositoryDoc = await Repository.create({
      githubUrl,
      name: 'Processing...',
      owner: 'Processing...',
      user: userId,
      language: 'Detecting...',
      framework: 'Detecting...',
      database: 'Detecting...',
      packageManager: 'Detecting...',
      dependencies: [],
      statistics: { files: 0, folders: 0, linesOfCode: 0 },
      folderTree: [],
    });

    // 2. Shallow Clone Repository
    const cloneProfile = await cloneRepository(githubUrl);
    temporaryDiskPath = cloneProfile.targetPath;

    // 3. Traversal and Content Extraction
    const parsedWorkspace = await parseRepository(temporaryDiskPath);

    // 4. Technical Stack Discovery
    const techStackMeta = extractMetadata(parsedWorkspace.files);

    // 5. Update the repository document with real metadata
    repositoryDoc.name = cloneProfile.name;
    repositoryDoc.owner = cloneProfile.owner;
    repositoryDoc.language = techStackMeta.language;
    repositoryDoc.framework = techStackMeta.framework;
    repositoryDoc.database = techStackMeta.database;
    repositoryDoc.packageManager = techStackMeta.packageManager;
    repositoryDoc.dependencies = techStackMeta.dependencies;
    repositoryDoc.statistics = {
      files: parsedWorkspace.stats.filesCount,
      folders: parsedWorkspace.stats.foldersCount,
      linesOfCode: parsedWorkspace.stats.linesOfCode,
    };
    repositoryDoc.folderTree = parsedWorkspace.folderTree;
    await repositoryDoc.save();

    // 6. Apply Intelligent Chunking
    const fileSegments = chunkSourceCode(parsedWorkspace.files);
    // 7. Generate Embeddings Concurrently (throttled)
    const throttle = pLimit(2);

    const embeddingTasks = fileSegments.map((segment, index) =>
      throttle(async () => {
        try {
          if (!segment.chunk || typeof segment.chunk !== 'string' || segment.chunk.trim() === '') {
            return null;
          }
          if (index > 0) await delay(150);

          const denseVector = await generateEmbedding(segment.chunk);
          return {
            repositoryId: repositoryDoc._id,
            user: userId,
            filePath: segment.filePath,
            chunk: segment.chunk,
            embedding: denseVector,
            metadata: segment.metadata,
          };
        } catch (err) {
          throw err;
        }
      })
    );

    const rawChunks = await Promise.all(embeddingTasks);
    const validChunks = rawChunks.filter((c) => c !== null);

    // 8. Store in MongoDB Atlas Vector Search
    await storeEmbeddings(validChunks);

    return repositoryDoc;
  } catch (error) {
    throw error;
  } finally {
    // 9. Cleanup temporary directory
    if (temporaryDiskPath) {
      await fs.remove(temporaryDiskPath).catch(() => {});
    }
  }
}
