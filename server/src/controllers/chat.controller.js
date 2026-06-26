import mongoose from 'mongoose';
import { buildRAGContext } from '../services/rag.js';
import { buildChatPrompt } from '../utils/promptBuilder.js';
import { getAiResponse } from '../services/gemini.js';
import Repository from '../models/Repository.js';

/**
 * Answers user questions about a repository using RAG + Gemini.
 * POST /api/chat
 */
export const askQuestion = async (req, res) => {
  const { repositoryId, question } = req.body;
  const userId = req.user._id;

  if (!repositoryId || !question) {
    return res.status(400).json({
      success: false,
      message: 'Both repositoryId and question are required.',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(repositoryId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid repository ID format.',
    });
  }

  try {
    const repo = await Repository.findOne({ _id: repositoryId, user: userId });
    if (!repo) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found or does not belong to you.',
      });
    }

    const { contextString, repository } = await buildRAGContext(repositoryId, question, 8);

    if (!contextString || contextString.trim() === '') {
      return res.status(200).json({
        success: true,
        data: {
          question,
          answer: 'No relevant code context found in this repository to answer your question. Try asking about the repository structure, dependencies, or specific files.',
          repositoryId,
          repositoryName: repository.name,
        },
      });
    }

    const formattedPrompt = buildChatPrompt(question, contextString);
    const answer = await getAiResponse(formattedPrompt);

    return res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        repositoryId,
        repositoryName: repository.name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process your question.',
    });
  }
};
