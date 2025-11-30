// app.js
const path = require("path");
const express = require("express");
const app = express();

// Serve static frontend
const DIST_PATH = path.join(__dirname, "dist", "public");
app.use(express.static(DIST_PATH));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

// Elastic Beanstalk uses PORT
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log("Server running on port", PORT));
