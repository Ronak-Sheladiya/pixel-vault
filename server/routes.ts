import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import { storage } from "./storage";
import { insertPhotoSchema, insertFolderSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/photos", async (req, res) => {
    try {
      const folderId = req.query.folderId as string | undefined;
      const photos = await storage.getPhotos(folderId || null);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.get("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photo" });
    }
  });

  app.post("/api/photos/upload", upload.array("photos", 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const folderId = req.body.folderId || null;
      const uploadedPhotos = [];

      for (const file of req.files) {
        try {
          const metadata = await sharp(file.path).metadata();
          
          const photoData = insertPhotoSchema.parse({
            filename: file.filename,
            originalFilename: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            folderId: folderId,
          });

          const photo = await storage.createPhoto(photoData);
          uploadedPhotos.push(photo);
        } catch (error) {
          await fs.unlink(file.path).catch(() => {});
          console.error("Failed to process file:", file.originalname, error);
        }
      }

      if (uploadedPhotos.length === 0) {
        return res.status(400).json({ message: "Failed to process any files" });
      }

      res.json(uploadedPhotos);
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || "Upload failed" 
      });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const filePath = path.join(UPLOAD_DIR, photo.filename);
      await fs.unlink(filePath).catch(() => {});

      const deleted = await storage.deletePhoto(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.patch("/api/photos/:id", async (req, res) => {
    try {
      const updates = insertPhotoSchema.partial().parse(req.body);
      const photo = await storage.updatePhoto(req.params.id, updates);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.json(photo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to update photo" });
    }
  });

  app.get("/api/folders", async (req, res) => {
    try {
      const parentId = req.query.parentId as string | undefined;
      const folders = await storage.getFolders(parentId || null);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.get("/api/folders/:id", async (req, res) => {
    try {
      const folder = await storage.getFolder(req.params.id);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folder" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(folderData);
      res.status(201).json(folder);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFolder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  app.patch("/api/folders/:id", async (req, res) => {
    try {
      const updates = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(req.params.id, updates);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      res.json(folder);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.get("/uploads/:filename", async (req, res) => {
    try {
      const filePath = path.join(UPLOAD_DIR, req.params.filename);
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
