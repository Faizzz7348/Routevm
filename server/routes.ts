import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTableRowSchema, insertTableColumnSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Table rows routes
  app.get("/api/table-rows", async (req, res) => {
    try {
      const rows = await storage.getTableRows();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table rows" });
    }
  });

  app.get("/api/table-rows/:id", async (req, res) => {
    try {
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.json(row);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table row" });
    }
  });

  app.post("/api/table-rows", async (req, res) => {
    try {
      const validatedData = insertTableRowSchema.parse(req.body);
      const row = await storage.createTableRow(validatedData);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create table row" });
      }
    }
  });

  app.patch("/api/table-rows/:id", async (req, res) => {
    try {
      const updates = insertTableRowSchema.partial().parse(req.body);
      const row = await storage.updateTableRow(req.params.id, updates);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update table row" });
      }
    }
  });

  app.delete("/api/table-rows/:id", async (req, res) => {
    try {
      const success = await storage.deleteTableRow(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete table row" });
    }
  });

  app.post("/api/table-rows/reorder", async (req, res) => {
    try {
      const { rowIds } = req.body;
      if (!Array.isArray(rowIds)) {
        return res.status(400).json({ message: "rowIds must be an array" });
      }
      const rows = await storage.reorderTableRows(rowIds);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder table rows" });
    }
  });

  // Table columns routes
  app.get("/api/table-columns", async (req, res) => {
    try {
      const columns = await storage.getTableColumns();
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table columns" });
    }
  });

  app.post("/api/table-columns", async (req, res) => {
    try {
      const validatedData = insertTableColumnSchema.parse(req.body);
      const column = await storage.createTableColumn(validatedData);
      res.status(201).json(column);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create table column" });
      }
    }
  });

  app.patch("/api/table-columns/:id", async (req, res) => {
    try {
      const updates = insertTableColumnSchema.partial().parse(req.body);
      const column = await storage.updateTableColumn(req.params.id, updates);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      res.json(column);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update table column" });
      }
    }
  });

  app.post("/api/table-columns/reorder", async (req, res) => {
    try {
      const { columnIds } = req.body;
      if (!Array.isArray(columnIds)) {
        return res.status(400).json({ message: "columnIds must be an array" });
      }
      const columns = await storage.reorderTableColumns(columnIds);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder table columns" });
    }
  });

  app.delete("/api/table-columns/:id", async (req, res) => {
    try {
      const success = await storage.deleteTableColumn(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Column not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete table column" });
    }
  });

  // Add image to row
  app.post("/api/table-rows/:id/images", async (req, res) => {
    try {
      const { imageUrl, caption } = req.body;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }

      const newImage = {
        url: imageUrl,
        caption: caption && typeof caption === 'string' ? caption : ""
      };
      const updatedImages = [...row.images, newImage];
      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to add image to row" });
    }
  });

  // Update image in row
  app.patch("/api/table-rows/:id/images/:imageIndex", async (req, res) => {
    try {
      const { imageUrl, caption } = req.body;
      const imageIndex = parseInt(req.params.imageIndex);

      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }

      if (imageIndex < 0 || imageIndex >= row.images.length) {
        return res.status(400).json({ message: "Invalid image index" });
      }

      const updatedImages = [...row.images];
      updatedImages[imageIndex] = {
        url: imageUrl !== undefined ? imageUrl : updatedImages[imageIndex].url,
        caption: caption !== undefined ? caption : updatedImages[imageIndex].caption
      };
      
      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  // Delete image from row
  app.delete("/api/table-rows/:id/images/:imageIndex?", async (req, res) => {
    try {
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }

      let updatedImages: typeof row.images;
      if (req.params.imageIndex === undefined) {
        // Delete all images
        updatedImages = [];
      } else {
        // Delete specific image
        const imageIndex = parseInt(req.params.imageIndex);
        if (imageIndex < 0 || imageIndex >= row.images.length) {
          return res.status(400).json({ message: "Invalid image index" });
        }
        updatedImages = row.images.filter((_, index) => index !== imageIndex);
      }

      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image(s)" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
