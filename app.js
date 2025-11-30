import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Debug logging
console.log('Current directory:', __dirname);
console.log('Looking for dist/public at:', path.join(__dirname, 'dist', 'public'));

// Check if dist/public exists
const distPath = path.join(__dirname, 'dist', 'public');
if (fs.existsSync(distPath)) {
  console.log('✅ dist/public directory exists');
  const files = fs.readdirSync(distPath);
  console.log('Files in dist/public:', files);
} else {
  console.log('❌ dist/public directory NOT found');
}

// Serve static files
app.use(express.static(distPath));

// Health check with debug info
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT,
    distPath: distPath,
    distExists: fs.existsSync(distPath)
  });
});

// Debug route to check files
app.get('/debug', (req, res) => {
  try {
    const files = fs.readdirSync(distPath);
    res.json({ files, distPath });
  } catch (error) {
    res.json({ error: error.message, distPath });
  }
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>PixelVault Debug</h1>
      <p>index.html not found at: ${indexPath}</p>
      <p>Current directory: ${__dirname}</p>
      <p><a href="/health">Health Check</a> | <a href="/debug">Debug Info</a></p>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PixelVault running on port ${PORT}`);
});