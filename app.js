const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist/public if it exists
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

// API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'PixelVault API working!' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send('<h1>PixelVault</h1><p>Frontend not built yet. API is working!</p>');
    }
  });
});

app.listen(PORT, () => {
  console.log(`PixelVault running on port ${PORT}`);
});