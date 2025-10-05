import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTableRowSchema, insertTableColumnSchema, insertRouteOptimizationSchema, insertLayoutPreferencesSchema, insertPageSchema, type RouteOptimizationRequest } from "@shared/schema";
import { z } from "zod";
import { optimizeRoute } from "./routeOptimizer";
import { calculateTollPrice, calculateRoutesForDestinations } from "./googleMaps";

// UUID validation schema
const uuidSchema = z.string().uuid();

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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.json(row);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table row" });
    }
  });

  app.get("/api/ql-kitchen", async (req, res) => {
    try {
      const row = await storage.getQlKitchenRow();
      if (!row) {
        return res.status(404).json({ message: "QL kitchen row not found" });
      }
      res.json(row);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QL kitchen row" });
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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
      // Normalize snake_case keys to camelCase for consistency
      const normalizedBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
          return [camelKey, value];
        })
      );

      // Special validation for currency field (tngRoute)
      if (normalizedBody.tngRoute !== undefined) {
        const currencyValue = String(normalizedBody.tngRoute);
        if (currencyValue !== "" && isNaN(Number(currencyValue))) {
          return res.status(400).json({ 
            message: "Invalid currency value", 
            details: "Currency value must be a number" 
          });
        }
        // Format currency as decimal string with 2 decimal places if it's a number
        if (currencyValue !== "" && !isNaN(Number(currencyValue))) {
          normalizedBody.tngRoute = Number(currencyValue).toFixed(2);
        }
      }
      
      const updates = insertTableRowSchema.partial().parse(normalizedBody);
      const row = await storage.updateTableRow(req.params.id, updates);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error(`Error updating row ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to update table row" });
      }
    }
  });

  app.delete("/api/table-rows/:id", async (req, res) => {
    try {
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
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
      
      // Validate all IDs are UUIDs
      for (const id of rowIds) {
        const validationResult = uuidSchema.safeParse(id);
        if (!validationResult.success) {
          return res.status(400).json({ message: "All row IDs must be valid UUIDs" });
        }
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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid column ID format" });
      }
      
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
      
      // Validate all IDs are UUIDs
      for (const id of columnIds) {
        const validationResult = uuidSchema.safeParse(id);
        if (!validationResult.success) {
          return res.status(400).json({ message: "All column IDs must be valid UUIDs" });
        }
      }
      const columns = await storage.reorderTableColumns(columnIds);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder table columns" });
    }
  });

  app.delete("/api/table-columns/:id", async (req, res) => {
    try {
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid column ID format" });
      }
      
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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
      const { imageUrl, caption } = req.body;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }

      // Check if image URL already exists to prevent duplicates
      const existingImageUrls = row.images.map(img => img.url);
      if (existingImageUrls.includes(imageUrl)) {
        return res.status(400).json({ message: "Image URL already exists for this row" });
      }

      const newImage = {
        url: imageUrl,
        caption: caption && typeof caption === 'string' ? caption : "",
        type: "image" as const,
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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
      const { imageUrl, caption } = req.body;
      const imageIndex = parseInt(req.params.imageIndex);
      
      // Validate imageIndex is a valid integer
      if (isNaN(imageIndex) || imageIndex < 0 || !Number.isInteger(imageIndex)) {
        return res.status(400).json({ message: "Image index must be a non-negative integer" });
      }

      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }

      if (imageIndex >= row.images.length) {
        return res.status(400).json({ message: "Invalid image index" });
      }

      // Check if updating to a URL that already exists in another image
      if (imageUrl !== undefined) {
        const existingImageUrls = row.images.map((img, idx) => idx !== imageIndex ? img.url : null).filter(Boolean);
        if (existingImageUrls.includes(imageUrl)) {
          return res.status(400).json({ message: "Image URL already exists for this row" });
        }
      }

      const updatedImages = [...row.images];
      updatedImages[imageIndex] = {
        url: imageUrl !== undefined ? imageUrl : updatedImages[imageIndex].url,
        caption: caption !== undefined ? caption : updatedImages[imageIndex].caption,
        type: updatedImages[imageIndex].type || "image",
        thumbnail: updatedImages[imageIndex].thumbnail
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
      // Validate UUID parameter
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      
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
        
        // Validate imageIndex is a valid integer
        if (isNaN(imageIndex) || imageIndex < 0 || !Number.isInteger(imageIndex)) {
          return res.status(400).json({ message: "Image index must be a non-negative integer" });
        }
        
        if (imageIndex >= row.images.length) {
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

  // QR Image Proxy to handle CORS issues
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter required" });
      }

      // Security checks
      if (!url.match(/^https?:\/\//)) {
        return res.status(400).json({ error: "Only HTTP/HTTPS URLs allowed" });
      }

      if (url.length > 2000) {
        return res.status(400).json({ error: "URL too long" });
      }

      // Fetch the image with timeout and size limit
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'QR-Scanner-Bot/1.0'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(415).json({ error: "Not an image" });
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return res.status(413).json({ error: "Image too large" });
      }

      // Set CORS headers and stream the image
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300'
      });

      // Convert ReadableStream to Buffer and send
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error: any) {
      console.error("Proxy image error:", error);
      if (error.name === 'AbortError') {
        res.status(408).json({ error: "Request timeout" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Calculate toll prices endpoint
  app.post("/api/calculate-tolls", async (req, res) => {
    try {
      const requestSchema = z.object({
        rowIds: z.array(z.string().uuid()).optional(),
      });

      const validatedData = requestSchema.parse(req.body);

      // Get rows to calculate tolls for
      let rows;
      if (validatedData.rowIds && validatedData.rowIds.length > 0) {
        const allRows = await storage.getTableRows();
        rows = allRows.filter(row => validatedData.rowIds!.includes(row.id));
      } else {
        rows = await storage.getTableRows();
        // Filter out the QL Kitchen row (sortOrder -1)
        rows = rows.filter(row => row.sortOrder !== -1);
      }

      // Calculate distances and toll prices for lorry-optimized routes
      const routeData = await calculateRoutesForDestinations(rows);

      // Update rows with distances and toll prices
      for (const row of rows) {
        const updates: any = {};
        
        if (routeData.distances[row.id] !== undefined) {
          updates.kilometer = routeData.distances[row.id].toString();
        }
        
        if (routeData.tollPrices[row.id] !== undefined) {
          updates.tollPrice = routeData.tollPrices[row.id].toFixed(2);
        }
        
        if (Object.keys(updates).length > 0) {
          await storage.updateTableRow(row.id, updates);
        }
      }

      res.json({ 
        success: true, 
        distances: routeData.distances,
        tollPrices: routeData.tollPrices,
        message: `Updated distances and toll prices for ${Object.keys(routeData.tollPrices).length} destinations`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Toll calculation error:", error);
        res.status(500).json({ message: "Failed to calculate toll prices" });
      }
    }
  });

  // Route Optimization endpoint
  app.post("/api/optimize-route", async (req, res) => {
    try {
      const requestSchema = z.object({
        rowIds: z.array(z.string().uuid()).optional(),
        startLocation: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }).optional(),
        algorithm: z.enum(['nearest_neighbor', 'genetic', 'simulated_annealing']).optional(),
        prioritizeTrip: z.boolean().optional(),
        maxDistance: z.number().optional(),
        vehicleSpecs: z.object({
          type: z.string(),
          fuelType: z.string(),
          tollClass: z.number(),
        }).optional(),
      });

      const validatedData = requestSchema.parse(req.body) as RouteOptimizationRequest;

      // Get all rows or specific rows
      let rows;
      if (validatedData.rowIds && validatedData.rowIds.length > 0) {
        const allRows = await storage.getTableRows();
        rows = allRows.filter(row => validatedData.rowIds!.includes(row.id));
      } else {
        rows = await storage.getTableRows();
        // Filter out the QL Kitchen row (sortOrder -1)
        rows = rows.filter(row => row.sortOrder !== -1);
      }

      // Filter to only rows with valid coordinates
      const validRows = rows.filter(row => 
        row.latitude && 
        row.longitude && 
        !isNaN(parseFloat(row.latitude)) && 
        !isNaN(parseFloat(row.longitude)) &&
        parseFloat(row.latitude) !== 0 && 
        parseFloat(row.longitude) !== 0
      );

      if (validRows.length < 2) {
        return res.status(400).json({ 
          message: `At least 2 locations with valid coordinates are required for optimization. Found ${validRows.length}.` 
        });
      }

      // Run optimization on valid rows only
      const result = optimizeRoute(
        validRows,
        validatedData.algorithm || 'nearest_neighbor',
        validatedData.startLocation,
        validatedData.prioritizeTrip || false
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        console.error("Route optimization error:", error);
        res.status(500).json({ message: "Failed to optimize route" });
      }
    }
  });

  // Save route optimization result
  app.post("/api/save-route", async (req, res) => {
    try {
      const validatedData = insertRouteOptimizationSchema.parse(req.body);
      const savedRoute = await storage.saveRoute(validatedData);
      res.status(201).json(savedRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Save route error:", error);
        res.status(500).json({ message: "Failed to save route" });
      }
    }
  });

  // Get all saved routes
  app.get("/api/saved-routes", async (req, res) => {
    try {
      const savedRoutes = await storage.getSavedRoutes();
      res.json(savedRoutes);
    } catch (error) {
      console.error("Get saved routes error:", error);
      res.status(500).json({ message: "Failed to fetch saved routes" });
    }
  });

  // Get a specific saved route
  app.get("/api/saved-routes/:id", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid route ID format" });
      }

      const savedRoute = await storage.getSavedRoute(req.params.id);
      if (!savedRoute) {
        return res.status(404).json({ message: "Saved route not found" });
      }
      res.json(savedRoute);
    } catch (error) {
      console.error("Get saved route error:", error);
      res.status(500).json({ message: "Failed to fetch saved route" });
    }
  });

  // Delete a saved route
  app.delete("/api/saved-routes/:id", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid route ID format" });
      }

      const success = await storage.deleteSavedRoute(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Saved route not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete saved route error:", error);
      res.status(500).json({ message: "Failed to delete saved route" });
    }
  });

  // Layout preferences routes
  app.get("/api/layout", async (req, res) => {
    try {
      const userIdSchema = z.string().min(1, "userId cannot be empty");
      const validationResult = userIdSchema.safeParse(req.query.userId);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "userId is required",
          errors: validationResult.error.errors 
        });
      }
      
      const userId = validationResult.data;
      const layout = await storage.getLayoutPreferences(userId);
      
      if (!layout) {
        return res.status(404).json({ message: "No saved layout found" });
      }
      
      res.json(layout);
    } catch (error) {
      console.error("Get layout preferences error:", error);
      res.status(500).json({ message: "Failed to fetch layout preferences" });
    }
  });

  app.post("/api/layout", async (req, res) => {
    try {
      const userIdSchema = z.string().min(1, "userId cannot be empty");
      const userIdValidation = userIdSchema.safeParse(req.body.userId);
      
      if (!userIdValidation.success) {
        return res.status(400).json({ 
          message: "userId is required",
          errors: userIdValidation.error.errors 
        });
      }
      
      const userId = userIdValidation.data;
      const { userId: _, ...layoutData } = req.body;
      const validatedData = insertLayoutPreferencesSchema.parse(layoutData);
      const layout = await storage.saveLayoutPreferences(userId, validatedData);
      res.status(200).json(layout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Save layout preferences error:", error);
        res.status(500).json({ message: "Failed to save layout preferences" });
      }
    }
  });

  // Pages routes
  app.get("/api/pages", async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      console.error("Get pages error:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.get("/api/pages/:id", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid page ID format" });
      }
      
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Get page error:", error);
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  app.post("/api/pages", async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const page = await storage.createPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Create page error:", error);
        res.status(500).json({ message: "Failed to create page" });
      }
    }
  });

  app.patch("/api/pages/:id", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid page ID format" });
      }
      
      const updates = insertPageSchema.partial().parse(req.body);
      const page = await storage.updatePage(req.params.id, updates);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Update page error:", error);
        res.status(500).json({ message: "Failed to update page" });
      }
    }
  });

  app.delete("/api/pages/:id", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid page ID format" });
      }
      
      const success = await storage.deletePage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete page error:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
