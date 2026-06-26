import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
  githubUrl: {
    type: String,
    required: true,
    trim: true
  },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  language: { type: String, default: 'Unknown' },
  framework: { type: String, default: 'Unknown' },
  database: { type: String, default: 'Unknown' },
  packageManager: { type: String, default: 'Unknown' },
  dependencies: { type: [String], default: [] },
  statistics: {
    files: { type: Number, default: 0 },
    folders: { type: Number, default: 0 },
    linesOfCode: { type: Number, default: 0 }
  },
  folderTree: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

RepositorySchema.index({ user: 1, createdAt: -1 });
RepositorySchema.index({ githubUrl: 1 });

export default mongoose.model('Repository', RepositorySchema);