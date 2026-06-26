import mongoose from 'mongoose';
import Chunk from '../models/Chunk.js';

/**
 * Persists an array of processed chunks along with their vector profiles to MongoDB Atlas.
 * @param {Array<Object>} chunks - Prepared structural data payload array.
 * @returns {Promise<Object>} Mongoose BulkWrite response summary.
 */
export async function storeEmbeddings(chunks) {
  if (!chunks || chunks.length === 0) {
    return { message: 'Zero chunks passed for operations.' };
  }

  const operations = chunks.map(item => ({
    insertOne: {
      document: {
        repositoryId: item.repositoryId,
        user: item.user,
        filePath: item.filePath,
        chunk: item.chunk,
        embedding: item.embedding,
        metadata: item.metadata
      }
    }
  }));

  return Chunk.bulkWrite(operations, { ordered: false });
}

/**
 * Executes a semantic similarity vector search scoped strictly to a specific repository.
 * @param {string} repositoryId - The target relational repository profile id string.
 * @param {number[]} queryEmbedding - The 384-dimensional dense array representing the user question vector.
 * @param {number} limit - Maximum number of relevant code blocks to retrieve.
 * @returns {Promise<Array<Object>>} Closest matching structural code chunks from the target repo.
 */
export async function vectorSearch(repositoryId, queryEmbedding, limit = 5) {
  try {
    // CRITICAL FIX: Convert string ID to native ObjectId for Atlas Vector Search aggregation filter matching
    const targetObjectId = new mongoose.Types.ObjectId(repositoryId);

    const searchResults = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "readmeai_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit,
          filter: { repositoryId: targetObjectId } 
        }
      },
      {
        $project: {
          embedding: 0, 
          score: { $meta: "vectorSearchScore" } 
        }
      }
    ]);

    return searchResults;
  } catch (error) {
    throw error;
  }
}