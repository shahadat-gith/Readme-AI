import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  chunk: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    language: String,
    startLine: Number,
    endLine: Number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
});

export default mongoose.model('Chunk', ChunkSchema);