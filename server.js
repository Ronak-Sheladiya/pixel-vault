const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>CloudVault is Running!</h1>
    <p>Server is working on port ${PORT}</p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

app.listen(PORT, () => {
  console.log(`CloudVault server running on port ${PORT}`);
});