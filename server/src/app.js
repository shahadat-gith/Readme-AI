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
app.use(cors({
  origin:[process.env.CLIENT_URL]
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

// Global Error Handler Guard
app.use((err, req, res, next) => {
  console.error(`Unhandled Server Exception: ${err.message}`);
  
  // Handle specific error types gracefully
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID Format', message: 'The provided ID is not valid.' });
  }
  
  res.status(500).json({ error: 'Critical System Error', message: err.message });
});

export default app;