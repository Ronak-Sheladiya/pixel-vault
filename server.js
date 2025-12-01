import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

// Body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from dist/public
const distPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(distPath));

// Basic API routes for testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock auth endpoints for frontend to work
app.post('/api/auth/login', (req, res) => {
  res.status(401).json({ message: 'Backend not fully configured. Please set up MongoDB and other services.' });
});

app.post('/api/auth/signup', (req, res) => {
  res.status(400).json({ message: 'Backend not fully configured. Please set up MongoDB and other services.' });
});

app.get('/api/auth/me', (req, res) => {
  // Return 401 without triggering refresh loop
  res.status(401).json({ message: 'Not authenticated' });
});

app.post('/api/auth/refresh-token', (req, res) => {
  // Return 401 to stop the refresh loop
  res.status(401).json({ message: 'No refresh token available' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>PixelVault</h1>
      <p>Frontend build not found. The dist/public directory is missing.</p>
      <p>Please run the build process to generate the frontend files.</p>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PixelVault server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});