import express, { type Express } from "express";
import { type Server } from "node:http";
import path from "node:path";
import fs from "node:fs";
import runApp from "./app";

export async function setupProduction(app: Express, server: Server) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  // Serve static files from the dist/public directory
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not built. Run 'npm run build' first.");
    }
  });
}

(async () => {
  await runApp(setupProduction);
})();
