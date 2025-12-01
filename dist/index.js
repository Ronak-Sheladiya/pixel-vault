var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/GlobalStorage.ts
var GlobalStorage_exports = {};
__export(GlobalStorage_exports, {
  GlobalStorage: () => GlobalStorage,
  getGlobalStorage: () => getGlobalStorage
});
import mongoose4 from "mongoose";
async function getGlobalStorage() {
  let storage2 = await GlobalStorage.findOne();
  if (!storage2) {
    storage2 = new GlobalStorage({
      totalUsed: 0,
      totalLimit: 9 * 1024 * 1024 * 1024
    });
    await storage2.save();
  }
  return storage2;
}
var globalStorageSchema, GlobalStorage;
var init_GlobalStorage = __esm({
  "server/models/GlobalStorage.ts"() {
    "use strict";
    globalStorageSchema = new mongoose4.Schema({
      totalUsed: {
        type: Number,
        default: 0
      },
      totalLimit: {
        type: Number,
        default: 9 * 1024 * 1024 * 1024
        // 9GB total for all users
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    });
    GlobalStorage = mongoose4.model("GlobalStorage", globalStorageSchema);
  }
});

// server/index-prod.ts
import express2 from "express";
import path3 from "node:path";
import fs2 from "node:fs";

// server/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

// server/config/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
var MONGODB_URI = process.env.MONGODB_URI || "";
var connectDatabase = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
    console.log("\u2705 MongoDB connected successfully");
    mongoose.connection.on("error", (error) => {
      console.error("\u274C MongoDB connection error:", error);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("\u26A0\uFE0F  MongoDB disconnected");
    });
  } catch (error) {
    console.error("\u274C Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import sharp from "sharp";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  photos;
  folders;
  constructor() {
    this.photos = /* @__PURE__ */ new Map();
    this.folders = /* @__PURE__ */ new Map();
  }
  async getPhotos(folderId) {
    return Array.from(this.photos.values()).filter((photo) => photo.folderId === (folderId || null)).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }
  async getPhoto(id) {
    return this.photos.get(id);
  }
  async createPhoto(insertPhoto) {
    const id = randomUUID();
    const photo = {
      ...insertPhoto,
      id,
      uploadedAt: /* @__PURE__ */ new Date()
    };
    this.photos.set(id, photo);
    return photo;
  }
  async deletePhoto(id) {
    return this.photos.delete(id);
  }
  async updatePhoto(id, updates) {
    const photo = this.photos.get(id);
    if (!photo) return void 0;
    const updated = { ...photo, ...updates };
    this.photos.set(id, updated);
    return updated;
  }
  async getFolders(parentId) {
    return Array.from(this.folders.values()).filter((folder) => folder.parentId === (parentId || null)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getFolder(id) {
    return this.folders.get(id);
  }
  async createFolder(insertFolder) {
    const id = randomUUID();
    const folder = {
      ...insertFolder,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.folders.set(id, folder);
    return folder;
  }
  async deleteFolder(id) {
    return this.folders.delete(id);
  }
  async updateFolder(id, updates) {
    const folder = this.folders.get(id);
    if (!folder) return void 0;
    const updated = { ...folder, ...updates };
    this.folders.set(id, updated);
    return updated;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  folderId: varchar("folder_id"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow()
});
var folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true
});
var insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs/promises";
var UPLOAD_DIR = path.join(process.cwd(), "uploads");
var multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  app2.get("/api/photos", async (req, res) => {
    try {
      const folderId = req.query.folderId;
      const photos2 = await storage.getPhotos(folderId || null);
      res.json(photos2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });
  app2.get("/api/photos/:id", async (req, res) => {
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
  app2.post("/api/photos/upload", upload.array("photos", 10), async (req, res) => {
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
            folderId
          });
          const photo = await storage.createPhoto(photoData);
          uploadedPhotos.push(photo);
        } catch (error) {
          await fs.unlink(file.path).catch(() => {
          });
          console.error("Failed to process file:", file.originalname, error);
        }
      }
      if (uploadedPhotos.length === 0) {
        return res.status(400).json({ message: "Failed to process any files" });
      }
      res.json(uploadedPhotos);
    } catch (error) {
      res.status(400).json({
        message: error.message || "Upload failed"
      });
    }
  });
  app2.delete("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      const filePath = path.join(UPLOAD_DIR, photo.filename);
      await fs.unlink(filePath).catch(() => {
      });
      const deleted = await storage.deletePhoto(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });
  app2.patch("/api/photos/:id", async (req, res) => {
    try {
      const updates = insertPhotoSchema.partial().parse(req.body);
      const photo = await storage.updatePhoto(req.params.id, updates);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to update photo" });
    }
  });
  app2.get("/api/folders", async (req, res) => {
    try {
      const parentId = req.query.parentId;
      const folders2 = await storage.getFolders(parentId || null);
      res.json(folders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });
  app2.get("/api/folders/:id", async (req, res) => {
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
  app2.post("/api/folders", async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(folderData);
      res.status(201).json(folder);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to create folder" });
    }
  });
  app2.delete("/api/folders/:id", async (req, res) => {
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
  app2.patch("/api/folders/:id", async (req, res) => {
    try {
      const updates = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(req.params.id, updates);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to update folder" });
    }
  });
  app2.get("/uploads/:filename", async (req, res) => {
    try {
      const filePath = path.join(UPLOAD_DIR, req.params.filename);
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: "File not found" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/routes/auth.ts
import { Router } from "express";

// server/models/User.ts
import mongoose2 from "mongoose";
import bcrypt from "bcryptjs";
var userSchema = new mongoose2.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  storageUsed: {
    type: Number,
    default: 0
  },
  storageLimit: {
    type: Number,
    default: 9 * 1024 * 1024 * 1024
    // 9GB total storage
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.index({ email: 1 }, { unique: true });
var User = mongoose2.model("User", userSchema);

// server/models/Share.ts
import mongoose3 from "mongoose";
var shareSchema = new mongoose3.Schema({
  folder: {
    type: mongoose3.Schema.Types.ObjectId,
    ref: "Folder",
    required: true
  },
  sharedBy: {
    type: mongoose3.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sharedWith: {
    type: mongoose3.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  invitedEmail: String,
  permission: {
    type: String,
    enum: ["view", "edit", "admin"],
    default: "view"
  },
  publicLink: String,
  linkExpires: Date,
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
shareSchema.index({ folder: 1, sharedWith: 1 });
shareSchema.index({ publicLink: 1 });
var Share = mongoose3.model("Share", shareSchema);

// server/utils/jwt.ts
import jwt from "jsonwebtoken";
import dotenv2 from "dotenv";
dotenv2.config({ path: "./server/.env" });
var JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-this";
var JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
var JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";
var generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY
  });
};
var generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY
  });
};
var verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// server/config/email.ts
import nodemailer from "nodemailer";
import dotenv3 from "dotenv";
dotenv3.config({ path: "./server/.env" });
var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.error("\u274C Email configuration error:", error);
  } else {
    console.log("\u2705 Email server is ready to send messages");
  }
});
var EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "PixelVault <noreply@pixelvault.com>",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5000"
};

// server/services/emailService.ts
var sendEmail = async (options) => {
  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    console.log(`\u2709\uFE0F  Email sent to ${options.to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};
var sendVerificationEmail = async (email, token, firstName) => {
  const verificationLink = `${EMAIL_CONFIG.frontendUrl}/verify-email/${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PixelVault! \u{1F389}</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName || "there"},</p>
          <p>Thanks for signing up for PixelVault! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>\xA9 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({
    to: email,
    subject: "Welcome to PixelVault - Verify Your Email",
    html
  });
};
var sendPasswordResetEmail = async (email, token, firstName) => {
  const resetLink = `${EMAIL_CONFIG.frontendUrl}/reset-password/${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName || "there"},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>\xA9 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({
    to: email,
    subject: "Reset Your PixelVault Password",
    html
  });
};
var sendFolderSharedEmail = async (recipientEmail, recipientName, senderName, folderName, permission, folderLink) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F4C1} Folder Shared With You</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> has shared a folder with you on PixelVault.</p>
          <div class="info-box">
            <p><strong>Folder:</strong> ${folderName}</p>
            <p><strong>Permission Level:</strong> ${permission.charAt(0).toUpperCase() + permission.slice(1)}</p>
          </div>
          <div style="text-align: center;">
            <a href="${folderLink}" class="button">View Folder</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>\xA9 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({
    to: recipientEmail,
    subject: `${senderName} shared "${folderName}" with you`,
    html
  });
};
var sendCommentMentionEmail = async (recipientEmail, recipientName, commenterName, fileName, commentText, fileLink) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .comment-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; font-style: italic; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F4AC} You Were Mentioned</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p><strong>${commenterName}</strong> mentioned you in a comment on "${fileName}":</p>
          <div class="comment-box">
            "${commentText}"
          </div>
          <div style="text-align: center;">
            <a href="${fileLink}" class="button">View Comment</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>\xA9 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({
    to: recipientEmail,
    subject: `${commenterName} mentioned you in a comment`,
    html
  });
};
var sendInvitationEmail = async (email, inviterName, folderName, permission) => {
  const signupLink = `${EMAIL_CONFIG.frontendUrl}/signup?email=${encodeURIComponent(email)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F44B} You've Been Invited!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to collaborate on the folder <strong>"${folderName}"</strong> on PixelVault.</p>
          <div class="info-box">
             <p><strong>Permission Level:</strong> ${permission.charAt(0).toUpperCase() + permission.slice(1)}</p>
          </div>
          <p>Create an account to access this folder and start collaborating.</p>
          <div style="text-align: center;">
            <a href="${signupLink}" class="button">Accept Invitation</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>\xA9 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to collaborate on PixelVault`,
    html
  });
};

// server/controllers/authController.ts
import { v4 as uuidv4 } from "uuid";
var signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    console.log("Signup attempt for:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      res.status(400).json({ message: "Email already registered" });
      return;
    }
    console.log("Creating new user...");
    const verificationToken = uuidv4();
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      verificationToken,
      isVerified: false
    });
    console.log("Saving user to database...");
    await user.save();
    console.log("User saved successfully:", user._id);
    try {
      await sendVerificationEmail(email, verificationToken, firstName);
      console.log("Verification email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    try {
      const pendingShares = await Share.find({ invitedEmail: email });
      if (pendingShares.length > 0) {
        console.log(`Found ${pendingShares.length} pending shares for ${email}`);
        await Share.updateMany(
          { invitedEmail: email },
          {
            $set: { sharedWith: user._id },
            $unset: { invitedEmail: "" }
          }
        );
      }
    } catch (shareError) {
      console.error("Failed to link pending shares:", shareError);
    }
    res.status(201).json({
      message: "Account created successfully. Please check your email to verify your account.",
      userId: user._id
    });
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to create account", error: error.message });
  }
};
var verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired verification token" });
      return;
    }
    user.isVerified = true;
    user.verificationToken = void 0;
    await user.save();
    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Failed to verify email" });
  }
};
var login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    console.log("Login attempt for:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    console.log("User found:", { email: user.email, isVerified: user.isVerified });
    if (!user.isVerified && process.env.NODE_ENV === "production") {
      console.log("Email not verified for:", email);
      res.status(401).json({ message: "Please verify your email before logging in" });
      return;
    }
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("Invalid password for:", email);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email
    });
    const refreshToken2 = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email
    });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // 'none' required for cross-site cookies (images)
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1e3 : void 0
      // 30 days if remember me
    };
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken2, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    console.log("Login successful for:", email);
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
var logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};
var refreshToken = async (req, res) => {
  try {
    const refreshToken2 = req.cookies?.refreshToken;
    if (!refreshToken2) {
      res.status(401).json({ message: "Refresh token required" });
      return;
    }
    const payload = verifyToken(refreshToken2);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email
    });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
var getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const user = await User.findById(req.user.userId).select("-password -verificationToken -resetPasswordToken");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get user info" });
  }
};
var forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ message: "If an account exists with this email, a password reset link has been sent." });
      return;
    }
    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 36e5);
    await user.save();
    await sendPasswordResetEmail(email, resetToken, user.firstName);
    res.json({ message: "If an account exists with this email, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
};
var resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: /* @__PURE__ */ new Date() }
    });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }
    user.password = password;
    user.resetPasswordToken = void 0;
    user.resetPasswordExpires = void 0;
    await user.save();
    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
var getGlobalStorageStats = async (req, res) => {
  try {
    const { getGlobalStorage: getGlobalStorage2 } = await Promise.resolve().then(() => (init_GlobalStorage(), GlobalStorage_exports));
    const globalStorage = await getGlobalStorage2();
    res.json({
      totalUsed: globalStorage.totalUsed,
      totalLimit: globalStorage.totalLimit,
      lastUpdated: globalStorage.lastUpdated
    });
  } catch (error) {
    console.error("Get global storage error:", error);
    res.status(500).json({ message: "Failed to get storage info" });
  }
};

// server/middleware/auth.ts
var authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// server/routes/auth.ts
var router = Router();
router.post("/signup", signup);
router.post("/verify-email/:token", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", authenticate, getCurrentUser);
router.get("/storage", authenticate, getGlobalStorageStats);
var auth_default = router;

// server/routes/files.ts
import { Router as Router2 } from "express";
import multer2 from "multer";

// server/models/File.ts
import mongoose5 from "mongoose";
var fileSchema = new mongoose5.Schema({
  name: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  r2Key: {
    type: String,
    required: true
  },
  r2Url: {
    type: String,
    required: true
  },
  folder: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  owner: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    dimensions: String
  }
});
fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ folder: 1 });
fileSchema.index({ name: "text" });
var File = mongoose5.model("File", fileSchema);

// server/controllers/fileController.ts
init_GlobalStorage();

// server/services/storageService.ts
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// server/config/r2.ts
import { S3Client } from "@aws-sdk/client-s3";
import dotenv4 from "dotenv";
dotenv4.config({ path: "./server/.env" });
var r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ""
  }
});
var R2_CONFIG = {
  bucketName: process.env.R2_BUCKET_NAME || "pixelvault-storage",
  publicUrl: process.env.R2_PUBLIC_URL || "",
  accountId: process.env.R2_ACCOUNT_ID || ""
};

// server/services/storageService.ts
import { v4 as uuidv42 } from "uuid";
import path2 from "path";
var uploadToR2 = async (file, folder) => {
  try {
    const fileExtension = path2.extname(file.originalname);
    const fileName = `${uuidv42()}${fileExtension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;
    const hasRealCredentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID !== "placeholder" && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_SECRET_ACCESS_KEY !== "placeholder";
    if (!hasRealCredentials) {
      throw new Error("R2 credentials are not configured. Please configure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");
    }
    const upload3 = new Upload({
      client: r2Client,
      params: {
        Bucket: R2_CONFIG.bucketName,
        Key: key,
        Body: file.buffer || file.stream,
        ContentType: file.mimetype
      }
    });
    await upload3.done();
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    });
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 * 24 * 7 });
    return {
      key,
      url,
      // This will be a signed URL
      size: file.size
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file to storage");
  }
};
var deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    });
    await r2Client.send(command);
  } catch (error) {
    console.error("R2 delete error:", error);
    throw new Error("Failed to delete file from storage");
  }
};
var getFileStream = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    });
    const response = await r2Client.send(command);
    return response;
  } catch (error) {
    console.error("R2 get stream error:", error);
    throw new Error("Failed to retrieve file stream from storage");
  }
};

// server/controllers/fileController.ts
import sharp2 from "sharp";
import { Readable } from "stream";
var uploadFiles = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }
    const { folderId } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const uploadedFiles = [];
    let totalSize = 0;
    for (const file of req.files) {
      totalSize += file.size;
    }
    const globalStorage = await getGlobalStorage();
    if (globalStorage.totalUsed + totalSize > globalStorage.totalLimit) {
      res.status(413).json({
        message: "Global storage full! Cannot upload files. The system has reached its 9GB total storage limit.",
        globalStorageUsed: globalStorage.totalUsed,
        globalStorageLimit: globalStorage.totalLimit,
        requiredSpace: totalSize
      });
      return;
    }
    for (const file of req.files) {
      try {
        if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
          throw new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`);
        }
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        let metadata = {};
        if (fileType === "image") {
          const imageMetadata = await sharp2(file.buffer).metadata();
          metadata = {
            width: imageMetadata.width,
            height: imageMetadata.height,
            dimensions: `${imageMetadata.width}x${imageMetadata.height}`
          };
        }
        const uploadResult = await uploadToR2(file, req.user.userId);
        const newFile = new File({
          name: file.originalname,
          originalName: file.originalname,
          type: fileType,
          mimeType: file.mimetype,
          size: file.size,
          r2Key: uploadResult.key,
          r2Url: uploadResult.url,
          folder: folderId || null,
          owner: req.user.userId,
          metadata
        });
        await newFile.save();
        user.storageUsed += file.size;
        totalSize += file.size;
        uploadedFiles.push(newFile);
      } catch (error) {
        console.error("\u274C Failed to process file:", file.originalname);
        console.error("Error details:", error.message);
      }
    }
    if (uploadedFiles.length === 0) {
      console.error("\u274C No files were uploaded successfully");
      res.status(400).json({ message: "Failed to upload any files. Ensure they are images or videos." });
      return;
    }
    await user.save();
    const updatedGlobalStorage = await getGlobalStorage();
    updatedGlobalStorage.totalUsed += totalSize;
    updatedGlobalStorage.lastUpdated = /* @__PURE__ */ new Date();
    await updatedGlobalStorage.save();
    res.status(201).json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Upload failed" });
  }
};
var getFiles = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { folderId } = req.query;
    console.log(`[DEBUG] getFiles - User: ${req.user.userId}, Folder: ${folderId}`);
    const query = {
      owner: req.user.userId,
      folder: folderId || null
    };
    console.log("[DEBUG] Query:", JSON.stringify(query));
    const files = await File.find(query).sort({ uploadedAt: -1 });
    console.log(`[DEBUG] Found ${files.length} files`);
    const filesWithProxyUrls = files.map((file) => {
      const fileObj = file.toObject();
      fileObj.r2Url = `/api/files/${file._id}/content`;
      return fileObj;
    });
    res.json({ files: filesWithProxyUrls });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};
var getFile = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    const fileObj = file.toObject();
    fileObj.r2Url = `/api/files/${file._id}/content`;
    res.json({ file: fileObj });
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ message: "Failed to fetch file" });
  }
};
var serveFileContent = async (req, res) => {
  try {
    console.log(`[DEBUG] serveFileContent called for ID: ${req.params.id}`);
    console.log(`[DEBUG] Auth status: ${req.user ? "Authenticated" : "Not Authenticated"}`);
    console.log(`[DEBUG] Headers:`, JSON.stringify(req.headers));
    const file = await File.findOne({
      _id: req.params.id
      // owner: req.user.userId // Disabled owner check for debugging
    });
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    if (!file.r2Key) {
      res.status(404).json({ message: "File content not found" });
      return;
    }
    const { Body, ContentType, ContentLength } = await getFileStream(file.r2Key);
    if (ContentType) res.setHeader("Content-Type", ContentType);
    if (ContentLength) res.setHeader("Content-Length", ContentLength);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    if (Body instanceof Readable) {
      Body.pipe(res);
    } else {
      res.send(Body);
    }
  } catch (error) {
    console.error("Serve file content error:", error);
    res.status(500).json({ message: "Failed to serve file content" });
  }
};
var deleteFile = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    await deleteFromR2(file.r2Key);
    const user = await User.findById(req.user.userId);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await user.save();
    }
    const globalStorage = await getGlobalStorage();
    globalStorage.totalUsed = Math.max(0, globalStorage.totalUsed - file.size);
    globalStorage.lastUpdated = /* @__PURE__ */ new Date();
    await globalStorage.save();
    await File.deleteOne({ _id: file._id });
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
};
var renameFile = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { name } = req.body;
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { name },
      { new: true }
    );
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    res.json({ file });
  } catch (error) {
    console.error("Rename file error:", error);
    res.status(500).json({ message: "Failed to rename file" });
  }
};
var moveFile = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { folderId } = req.body;
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { folder: folderId || null },
      { new: true }
    );
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    res.json({ file });
  } catch (error) {
    console.error("Move file error:", error);
    res.status(500).json({ message: "Failed to move file" });
  }
};

// server/routes/files.ts
var router2 = Router2();
var upload2 = multer2({
  storage: multer2.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024
    // 500MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  }
});
router2.use(authenticate);
router2.post("/upload", upload2.array("files", 10), uploadFiles);
router2.get("/", getFiles);
router2.get("/:id", getFile);
router2.get("/:id/content", serveFileContent);
router2.delete("/:id", deleteFile);
router2.patch("/:id/rename", renameFile);
router2.patch("/:id/move", moveFile);
var files_default = router2;

// server/routes/folders.ts
import { Router as Router3 } from "express";

// server/models/Folder.ts
import mongoose6 from "mongoose";
var folderSchema = new mongoose6.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  owner: {
    type: mongoose6.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  parent: {
    type: mongoose6.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  path: {
    type: String,
    default: "/"
  },
  color: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
folderSchema.pre("save", function(next) {
  this.updatedAt = /* @__PURE__ */ new Date();
  next();
});
folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ parent: 1 });
var Folder = mongoose6.model("Folder", folderSchema);

// server/controllers/folderController.ts
var createFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { name, description, parentId, color } = req.body;
    let path4 = "/";
    if (parentId) {
      const parentFolder = await Folder.findOne({
        _id: parentId,
        owner: req.user.userId
      });
      if (!parentFolder) {
        res.status(404).json({ message: "Parent folder not found" });
        return;
      }
      path4 = `${parentFolder.path}${parentFolder.name}/`;
    }
    const folder = new Folder({
      name,
      description,
      owner: req.user.userId,
      parent: parentId || null,
      path: path4,
      color
    });
    await folder.save();
    res.status(201).json({ folder });
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ message: "Failed to create folder" });
  }
};
var getFolders = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { parentId } = req.query;
    const folders2 = await Folder.find({
      owner: req.user.userId,
      parent: parentId || null
    }).sort({ createdAt: -1 });
    res.json({ folders: folders2 });
  } catch (error) {
    console.error("Get folders error:", error);
    res.status(500).json({ message: "Failed to fetch folders" });
  }
};
var getFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    const ancestors = [];
    let currentParentId = folder.parent;
    while (currentParentId) {
      const parent = await Folder.findOne({ _id: currentParentId });
      if (parent) {
        ancestors.unshift({ _id: parent._id, name: parent.name });
        currentParentId = parent.parent;
      } else {
        break;
      }
    }
    res.json({ folder, ancestors });
  } catch (error) {
    console.error("Get folder error:", error);
    res.status(500).json({ message: "Failed to fetch folder" });
  }
};
var updateFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { name, description, color } = req.body;
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { name, description, color, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    res.json({ folder });
  } catch (error) {
    console.error("Update folder error:", error);
    res.status(500).json({ message: "Failed to update folder" });
  }
};
var deleteFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    const deleteFolderFiles = async (folderId) => {
      const files = await File.find({ folder: folderId });
      for (const file of files) {
        try {
          await deleteFromR2(file.r2Key);
        } catch (err) {
          console.error(`Failed to delete file ${file._id} from R2:`, err);
        }
      }
      await File.deleteMany({ folder: folderId });
    };
    const deleteSubfolders = async (folderId) => {
      const subfolders = await Folder.find({ parent: folderId });
      for (const subfolder of subfolders) {
        await deleteSubfolders(subfolder._id.toString());
        await deleteFolderFiles(subfolder._id.toString());
        await Folder.deleteOne({ _id: subfolder._id });
      }
    };
    await deleteSubfolders(folder._id.toString());
    await deleteFolderFiles(folder._id.toString());
    await Folder.deleteOne({ _id: folder._id });
    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ message: "Failed to delete folder" });
  }
};
var moveFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { parentId } = req.body;
    let newPath = "/";
    if (parentId) {
      const parentFolder = await Folder.findOne({
        _id: parentId,
        owner: req.user.userId
      });
      if (!parentFolder) {
        res.status(404).json({ message: "Parent folder not found" });
        return;
      }
      newPath = `${parentFolder.path}${parentFolder.name}/`;
    }
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { parent: parentId || null, path: newPath, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    res.json({ folder });
  } catch (error) {
    console.error("Move folder error:", error);
    res.status(500).json({ message: "Failed to move folder" });
  }
};

// server/routes/folders.ts
var router3 = Router3();
router3.use(authenticate);
router3.post("/", createFolder);
router3.get("/", getFolders);
router3.get("/:id", getFolder);
router3.patch("/:id", updateFolder);
router3.delete("/:id", deleteFolder);
router3.patch("/:id/move", moveFolder);
var folders_default = router3;

// server/routes/share.ts
import { Router as Router4 } from "express";

// server/controllers/shareController.ts
import { v4 as uuidv43 } from "uuid";
var shareFolder = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { folderId } = req.params;
    const { email, permission } = req.body;
    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId
    });
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    const userToShareWith = await User.findOne({ email });
    if (!userToShareWith) {
      console.log(`User ${email} not found, sending invitation`);
      const existingInvite = await Share.findOne({
        folder: folderId,
        invitedEmail: email
      });
      if (existingInvite) {
        existingInvite.permission = permission;
        await existingInvite.save();
        res.json({ message: "Invitation updated", share: existingInvite });
        return;
      }
      const share2 = new Share({
        folder: folderId,
        sharedBy: req.user.userId,
        sharedWith: null,
        invitedEmail: email,
        permission
      });
      await share2.save();
      const sharer2 = await User.findById(req.user.userId);
      await sendInvitationEmail(
        email,
        sharer2?.firstName || "Someone",
        folder.name,
        permission
      );
      res.status(201).json({ message: "Invitation sent successfully", share: share2 });
      return;
    }
    const existingShare = await Share.findOne({
      folder: folderId,
      sharedWith: userToShareWith._id
    });
    if (existingShare) {
      existingShare.permission = permission;
      await existingShare.save();
      res.json({ message: "Permission updated", share: existingShare });
      return;
    }
    const share = new Share({
      folder: folderId,
      sharedBy: req.user.userId,
      sharedWith: userToShareWith._id,
      permission
    });
    await share.save();
    const sharer = await User.findById(req.user.userId);
    await sendFolderSharedEmail(
      email,
      userToShareWith.firstName || "there",
      sharer?.firstName || "Someone",
      folder.name,
      permission,
      `${process.env.FRONTEND_URL}/dashboard/${folderId}`
    );
    res.status(201).json({ message: "Folder shared successfully", share });
  } catch (error) {
    console.error("Share folder error:", error);
    res.status(500).json({ message: "Failed to share folder" });
  }
};
var generatePublicLink = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { folderId } = req.params;
    const { permission, expiresIn } = req.body;
    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId
    });
    if (!folder) {
      res.status(404).json({ message: "Folder not found" });
      return;
    }
    const publicLink = uuidv43();
    const linkExpires = expiresIn ? new Date(Date.now() + expiresIn) : void 0;
    const share = new Share({
      folder: folderId,
      sharedBy: req.user.userId,
      publicLink,
      linkExpires,
      permission: permission || "view",
      isPublic: true
    });
    await share.save();
    const shareUrl = `${process.env.FRONTEND_URL}/shared/${publicLink}`;
    res.status(201).json({
      message: "Public link generated",
      shareUrl,
      share
    });
  } catch (error) {
    console.error("Generate public link error:", error);
    res.status(500).json({ message: "Failed to generate public link" });
  }
};
var getFolderMembers = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { folderId } = req.params;
    const shares = await Share.find({ folder: folderId }).populate("sharedWith", "email firstName lastName").populate("sharedBy", "email firstName lastName");
    res.json({ members: shares });
  } catch (error) {
    console.error("Get folder members error:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};
var removeMember = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { shareId } = req.params;
    const share = await Share.findById(shareId).populate("folder");
    if (!share) {
      res.status(404).json({ message: "Share not found" });
      return;
    }
    const folder = share.folder;
    if (folder.owner.toString() !== req.user.userId) {
      res.status(403).json({ message: "Only folder owner can remove members" });
      return;
    }
    await Share.deleteOne({ _id: shareId });
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Failed to remove member" });
  }
};
var updatePermission = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { shareId } = req.params;
    const { permission } = req.body;
    const share = await Share.findById(shareId).populate("folder");
    if (!share) {
      res.status(404).json({ message: "Share not found" });
      return;
    }
    const folder = share.folder;
    if (folder.owner.toString() !== req.user.userId) {
      res.status(403).json({ message: "Only folder owner can update permissions" });
      return;
    }
    share.permission = permission;
    await share.save();
    res.json({ message: "Permission updated", share });
  } catch (error) {
    console.error("Update permission error:", error);
    res.status(500).json({ message: "Failed to update permission" });
  }
};
var getSharedFolders = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const shares = await Share.find({ sharedWith: req.user.userId }).populate("folder").populate("sharedBy", "email firstName lastName");
    res.json({ sharedFolders: shares });
  } catch (error) {
    console.error("Get shared folders error:", error);
    res.status(500).json({ message: "Failed to fetch shared folders" });
  }
};

// server/routes/share.ts
var router4 = Router4();
router4.use(authenticate);
router4.post("/folder/:folderId", shareFolder);
router4.post("/folder/:folderId/public-link", generatePublicLink);
router4.get("/folder/:folderId/members", getFolderMembers);
router4.delete("/:shareId", removeMember);
router4.patch("/:shareId/permission", updatePermission);
router4.get("/shared-with-me", getSharedFolders);
var share_default = router4;

// server/routes/comments.ts
import { Router as Router5 } from "express";

// server/models/Comment.ts
import mongoose7 from "mongoose";
var commentSchema = new mongoose7.Schema({
  file: {
    type: mongoose7.Schema.Types.ObjectId,
    ref: "File",
    required: true
  },
  user: {
    type: mongoose7.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true
  },
  mentions: [{
    type: mongoose7.Schema.Types.ObjectId,
    ref: "User"
  }],
  parent: {
    type: mongoose7.Schema.Types.ObjectId,
    ref: "Comment",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
commentSchema.pre("save", function(next) {
  this.updatedAt = /* @__PURE__ */ new Date();
  next();
});
commentSchema.index({ file: 1, parent: 1 });
var Comment = mongoose7.model("Comment", commentSchema);

// server/controllers/commentController.ts
var addComment = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { fileId } = req.params;
    const { text: text2, parentId } = req.body;
    const file = await File.findById(fileId);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text2)) !== null) {
      const user = await User.findOne({ email: match[1] });
      if (user) {
        mentions.push(user._id);
      }
    }
    const comment = new Comment({
      file: fileId,
      user: req.user.userId,
      text: text2,
      parent: parentId || null,
      mentions
    });
    await comment.save();
    const commenter = await User.findById(req.user.userId);
    for (const mentionedUserId of mentions) {
      const mentionedUser = await User.findById(mentionedUserId);
      if (mentionedUser) {
        await sendCommentMentionEmail(
          mentionedUser.email,
          mentionedUser.firstName || "there",
          commenter?.firstName || "Someone",
          file.name,
          text2,
          `${process.env.FRONTEND_URL}/file/${fileId}`
        );
      }
    }
    const populatedComment = await Comment.findById(comment._id).populate("user", "email firstName lastName").populate("mentions", "email firstName lastName");
    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};
var getComments = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { fileId } = req.params;
    const comments = await Comment.find({ file: fileId }).populate("user", "email firstName lastName").populate("mentions", "email firstName lastName").sort({ createdAt: 1 });
    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};
var updateComment = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { commentId } = req.params;
    const { text: text2 } = req.body;
    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user.userId
    });
    if (!comment) {
      res.status(404).json({ message: "Comment not found or unauthorized" });
      return;
    }
    comment.text = text2;
    comment.updatedAt = /* @__PURE__ */ new Date();
    await comment.save();
    const populatedComment = await Comment.findById(comment._id).populate("user", "email firstName lastName").populate("mentions", "email firstName lastName");
    res.json({ comment: populatedComment });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
};
var deleteComment = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { commentId } = req.params;
    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user.userId
    });
    if (!comment) {
      res.status(404).json({ message: "Comment not found or unauthorized" });
      return;
    }
    await Comment.deleteMany({ parent: commentId });
    await Comment.deleteOne({ _id: commentId });
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// server/routes/comments.ts
var router5 = Router5();
router5.use(authenticate);
router5.post("/:fileId", addComment);
router5.get("/:fileId", getComments);
router5.patch("/:commentId", updateComment);
router5.delete("/:commentId", deleteComment);
var comments_default = router5;

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.set("trust proxy", 1);
connectDatabase();
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? void 0 : false,
  hsts: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === "production" ? "https://piccsync.work" : `http://localhost:${process.env.PORT || 3e3}`),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", auth_default);
app.use("/api/files", files_default);
app.use("/api/photos", files_default);
app.use("/api/folders", folders_default);
app.use("/api/share", share_default);
app.use("/api/comments", comments_default);
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function setupProduction(app2, server) {
  const distPath = path3.resolve(import.meta.dirname, "..", "dist", "public");
  app2.use(express2.static(distPath));
  app2.get("*", (_req, res) => {
    const indexPath = path3.join(distPath, "index.html");
    if (fs2.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not built. Run 'npm run build' first.");
    }
  });
}
(async () => {
  await runApp(setupProduction);
})();
export {
  setupProduction
};
