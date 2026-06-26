// src/server.js
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.error(`Server running on port ${PORT}`);
});

// Handle graceful shutdowns for production stability (e.g., Docker/Kubernetes orchestration)
process.on('SIGTERM', () => {
  console.error('SIGTERM received: closing HTTP server.');
  server.close(() => {
    console.error('HTTP server closed.');
    process.exit(0);
  });
});