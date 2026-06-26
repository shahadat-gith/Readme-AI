// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import dotenv from 'dotenv';
import { connectDB } from './configs/db.js';
import authRoutes from './routes/auth.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import readmeRoutes from './routes/readme.routes.js';
import chatRoutes from './routes/chat.routes.js';
import searchRoutes from './routes/search.routes.js';

dotenv.config();

const app = express();

connectDB();

// Production Middleware Layer
app.use(helmet()); 

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173' 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Include this if you are handling cookies/sessions
}));

app.use(compression()); 
app.use(express.json()); 

// API Routing Mount Points
app.use('/api/auth', authRoutes);
app.use('/api/repository', repositoryRoutes);
app.use('/api/readme', readmeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// Health Check Endpoint for Monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`Unhandled Server Exception: ${err.message}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  res.status(500).json({ success: false, message: 'Internal server error.' });
});

export default app;