import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
const distPath = path.join(__dirname, "dist", "public");
app.use(express.static(distPath));

// API routes would go here
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Catch-all handler for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});