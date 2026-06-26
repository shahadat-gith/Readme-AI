import mongoose from 'mongoose';

const ReadmeSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    unique: true
  },
  markdown: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Readme', ReadmeSchema);