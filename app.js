import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST_PATH = path.join(__dirname, "dist", "public");
app.use(express.static(DIST_PATH));
app.get("*", (req, res) => res.sendFile(path.join(DIST_PATH, "index.html")));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server running on port", PORT));
