import { type Photo, type InsertPhoto, type Folder, type InsertFolder } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getPhotos(folderId?: string | null): Promise<Photo[]>;
  getPhoto(id: string): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: string): Promise<boolean>;
  updatePhoto(id: string, updates: Partial<InsertPhoto>): Promise<Photo | undefined>;

  getFolders(parentId?: string | null): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  deleteFolder(id: string): Promise<boolean>;
  updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
}

export class MemStorage implements IStorage {
  private photos: Map<string, Photo>;
  private folders: Map<string, Folder>;

  constructor() {
    this.photos = new Map();
    this.folders = new Map();
  }

  async getPhotos(folderId?: string | null): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.folderId === (folderId || null))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async getPhoto(id: string): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = randomUUID();
    const photo: Photo = {
      ...insertPhoto,
      id,
      uploadedAt: new Date(),
    };
    this.photos.set(id, photo);
    return photo;
  }

  async deletePhoto(id: string): Promise<boolean> {
    return this.photos.delete(id);
  }

  async updatePhoto(id: string, updates: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;

    const updated: Photo = { ...photo, ...updates };
    this.photos.set(id, updated);
    return updated;
  }

  async getFolders(parentId?: string | null): Promise<Folder[]> {
    return Array.from(this.folders.values())
      .filter(folder => folder.parentId === (parentId || null))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.folders.delete(id);
  }

  async updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;

    const updated: Folder = { ...folder, ...updates };
    this.folders.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
