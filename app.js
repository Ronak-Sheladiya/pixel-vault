import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist/public
const distPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(distPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

// Serve React app for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PixelVault running on port ${PORT}`);
});