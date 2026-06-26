// src/controllers/readme.controller.js
import { generateReadmeFile } from '../services/readme.js';
import Readme from '../models/Readme.js';
import Repository from '../models/Repository.js';

/**
 * Generates a professional README for a processed repository.
 * POST /api/readme/generate
 */
export const generateReadme = async (req, res) => {
  const { repositoryId } = req.body;
  const userId = req.user._id;

  if (!repositoryId) {
    return res.status(400).json({
      success: false,
      message: 'The repositoryId property is required.',
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

    const readmeDocument = await generateReadmeFile(repositoryId, userId);

    return res.status(201).json({
      success: true,
      message: 'README generated and stored successfully.',
      data: {
        id: readmeDocument._id,
        repositoryId: readmeDocument.repositoryId,
        markdown: readmeDocument.markdown,
        createdAt: readmeDocument.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'README generation failed.',
    });
  }
};

/**
 * Retrieves the generated README for a repository.
 * GET /api/readme/:repositoryId
 */
export const getReadmeByRepositoryId = async (req, res) => {
  try {
    const readme = await Readme.findOne({
      repositoryId: req.params.repositoryId,
      user: req.user._id,
    });

    if (!readme) {
      return res.status(404).json({
        success: false,
        message: 'README not found for this repository.',
      });
    }

    return res.status(200).json({ success: true, data: readme });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const listUserReadmes = async (req, res) => {
  try {
    // 1. Fetch the records matching the user ID
    const readmes = await Readme.find({ user: req.user._id })
      .populate('repositoryId', 'name githubUrl owner language framework statistics')
      .sort({ createdAt: -1 })
      .lean(); 

    // 2. Map through records to split the string ID away from the details object
    const structuredReadmes = readmes.map((readme) => {
      const { repositoryId, ...rest } = readme;
      
      return {
        ...rest,
        repositoryId: repositoryId?._id || repositoryId, 
        repository: repositoryId && typeof repositoryId === 'object' ? repositoryId : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: structuredReadmes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Download a README file as raw markdown.
 * GET /api/readme/:repositoryId/download
 */
export const downloadReadme = async (req, res) => {
  try {
    const readme = await Readme.findOne({
      repositoryId: req.params.repositoryId,
      user: req.user._id,
    }).populate('repositoryId', 'name');

    if (!readme) {
      return res.status(404).json({
        success: false,
        message: 'README not found for this repository.',
      });
    }

    const repoName = readme.repositoryId?.name || 'repository';
    const safeName = repoName.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_README.md"`);
    res.send(readme.markdown);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
