var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  imageSchema: () => imageSchema,
  insertTableColumnSchema: () => insertTableColumnSchema,
  insertTableRowSchema: () => insertTableRowSchema,
  tableColumns: () => tableColumns,
  tableRows: () => tableRows
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var imageSchema = z.object({
  url: z.string(),
  caption: z.string().optional().default("")
});
var tableRows = pgTable("table_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  no: integer("no").notNull().default(0),
  route: text("route").notNull().default(""),
  code: text("code").notNull().default(""),
  location: text("location").notNull().default(""),
  delivery: text("delivery").notNull().default(""),
  trip: text("trip").notNull().default(""),
  alt1: text("alt1").notNull().default(""),
  alt2: text("alt2").notNull().default(""),
  info: text("info").notNull().default(""),
  tngSite: text("tng_site").notNull().default(""),
  tngRoute: text("tng_route").notNull().default(""),
  images: jsonb("images").$type().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0)
});
var tableColumns = pgTable("table_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dataKey: text("data_key").notNull(),
  type: text("type").notNull().default("text"),
  // text, number, currency, images, select
  sortOrder: integer("sort_order").notNull().default(0),
  isEditable: text("is_editable").notNull().default("true"),
  options: jsonb("options").$type().default([])
});
var insertTableRowSchema = createInsertSchema(tableRows).omit({
  id: true,
  sortOrder: true
});
var insertTableColumnSchema = createInsertSchema(tableColumns).omit({
  id: true,
  sortOrder: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, asc } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.initializeData().catch(console.error);
  }
  async initializeData() {
    try {
      const existingColumns = await db.select().from(tableColumns);
      const existingRows = await db.select().from(tableRows);
      if (existingColumns.length === 0) {
        const defaultColumns = [
          { name: "ID", dataKey: "id", type: "text", isEditable: "false", options: [] },
          { name: "Route", dataKey: "route", type: "select", isEditable: "true", options: ["SL 1", "SL 2", "SL 3", "KL 3", "KL 4", "KL 6", "KL 7"] },
          { name: "Code", dataKey: "code", type: "text", isEditable: "true", options: [] },
          { name: "Location", dataKey: "location", type: "text", isEditable: "true", options: [] },
          { name: "Delivery", dataKey: "delivery", type: "text", isEditable: "true", options: [] },
          { name: "Trip", dataKey: "trip", type: "text", isEditable: "true", options: [] },
          { name: "Alt1", dataKey: "alt1", type: "text", isEditable: "true", options: [] },
          { name: "Alt2", dataKey: "alt2", type: "text", isEditable: "true", options: [] },
          { name: "Info", dataKey: "info", type: "text", isEditable: "true", options: [] },
          { name: "Images", dataKey: "images", type: "images", isEditable: "false", options: [] }
        ];
        const columnsWithOrder = defaultColumns.map((col, index) => ({
          ...col,
          sortOrder: index
        }));
        await db.insert(tableColumns).values(columnsWithOrder);
      }
      if (existingRows.length === 0) {
        const defaultRows = [
          {
            no: 1,
            route: "KL-01",
            code: "CODE001",
            location: "Kuala Lumpur",
            delivery: "Same Day",
            trip: "Trip 1",
            alt1: "Alternative 1",
            alt2: "Alternative 2",
            info: "Sample information for row 1",
            tngSite: "TnG KL Central",
            tngRoute: "Central-North",
            images: [
              { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Modern city skyline" },
              { url: "https://images.unsplash.com/photo-1573167507387-4d8c0a67ceb2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Urban landscape" }
            ]
          },
          {
            no: 2,
            route: "SG-02",
            code: "CODE002",
            location: "Selangor",
            delivery: "Next Day",
            trip: "Trip 2",
            alt1: "Alt Option 1",
            alt2: "Alt Option 2",
            info: "Details for Selangor route",
            tngSite: "TnG Shah Alam",
            tngRoute: "Central-West",
            images: [{ url: "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Suburban area" }]
          },
          {
            no: 3,
            route: "JB-03",
            code: "CODE003",
            location: "Johor Bahru",
            delivery: "2-3 Days",
            trip: "Trip 3",
            alt1: "JB Alternative",
            alt2: "South Route",
            info: "Information about Johor Bahru delivery",
            tngSite: "TnG JB Plaza",
            tngRoute: "South-East",
            images: []
          },
          {
            no: 4,
            route: "PG-04",
            code: "CODE004",
            location: "Penang",
            delivery: "Same Day",
            trip: "Trip 4",
            alt1: "Penang Alt",
            alt2: "Georgetown",
            info: "Penang delivery information",
            tngSite: "TnG Georgetown",
            tngRoute: "North-West",
            images: [{ url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Georgetown bridge" }]
          },
          {
            no: 5,
            route: "KT-05",
            code: "CODE005",
            location: "Kota Kinabalu",
            delivery: "3-5 Days",
            trip: "Trip 5",
            alt1: "KK Option",
            alt2: "Sabah Route",
            info: "Extended delivery to East Malaysia",
            tngSite: "TnG KK Mall",
            tngRoute: "East-North",
            images: []
          }
        ];
        for (let i = 0; i < defaultRows.length; i++) {
          const row = defaultRows[i];
          await db.insert(tableRows).values({
            no: row.no,
            route: row.route,
            code: row.code,
            location: row.location,
            delivery: row.delivery,
            trip: row.trip,
            alt1: row.alt1,
            alt2: row.alt2,
            info: row.info,
            tngSite: row.tngSite,
            tngRoute: row.tngRoute,
            images: row.images,
            sortOrder: i
          });
        }
      }
    } catch (error) {
      console.error("Error initializing database data:", error);
    }
  }
  // Table rows methods
  async getTableRows() {
    return await db.select().from(tableRows).orderBy(asc(tableRows.sortOrder));
  }
  async getTableRow(id) {
    const [row] = await db.select().from(tableRows).where(eq(tableRows.id, id));
    return row || void 0;
  }
  async createTableRow(insertRow) {
    const existingRows = await this.getTableRows();
    const maxSortOrder = Math.max(...existingRows.map((r) => r.sortOrder), -1);
    const [row] = await db.insert(tableRows).values({
      no: insertRow.no || 0,
      route: insertRow.route || "",
      code: insertRow.code || "",
      location: insertRow.location || "",
      delivery: insertRow.delivery || "",
      alt1: insertRow.alt1 || "",
      alt2: insertRow.alt2 || "",
      info: insertRow.info || "",
      tngSite: insertRow.tngSite || "",
      tngRoute: insertRow.tngRoute || "",
      images: insertRow.images || [],
      sortOrder: maxSortOrder + 1
    }).returning();
    return row;
  }
  async updateTableRow(id, updates) {
    const [updatedRow] = await db.update(tableRows).set(updates).where(eq(tableRows.id, id)).returning();
    return updatedRow || void 0;
  }
  async deleteTableRow(id) {
    const result = await db.delete(tableRows).where(eq(tableRows.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderTableRows(rowIds) {
    for (let i = 0; i < rowIds.length; i++) {
      await db.update(tableRows).set({ sortOrder: i }).where(eq(tableRows.id, rowIds[i]));
    }
    return this.getTableRows();
  }
  // Table columns methods
  async getTableColumns() {
    return await db.select().from(tableColumns).orderBy(asc(tableColumns.sortOrder));
  }
  async getTableColumn(id) {
    const [column] = await db.select().from(tableColumns).where(eq(tableColumns.id, id));
    return column || void 0;
  }
  async createTableColumn(insertColumn) {
    const existingColumns = await this.getTableColumns();
    const maxSortOrder = Math.max(...existingColumns.map((c) => c.sortOrder), -1);
    const [column] = await db.insert(tableColumns).values({
      ...insertColumn,
      sortOrder: maxSortOrder + 1
    }).returning();
    return column;
  }
  async updateTableColumn(id, updates) {
    const [updatedColumn] = await db.update(tableColumns).set(updates).where(eq(tableColumns.id, id)).returning();
    return updatedColumn || void 0;
  }
  async deleteTableColumn(id) {
    const column = await this.getTableColumn(id);
    if (!column) return false;
    const coreDataKeys = ["id", "no", "route", "code", "location", "delivery", "trip", "alt1", "alt2", "info", "tngSite", "tngRoute", "images"];
    if (coreDataKeys.includes(column.dataKey)) {
      return false;
    }
    const result = await db.delete(tableColumns).where(eq(tableColumns.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderTableColumns(columnIds) {
    for (let i = 0; i < columnIds.length; i++) {
      await db.update(tableColumns).set({ sortOrder: i }).where(eq(tableColumns.id, columnIds[i]));
    }
    return this.getTableColumns();
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/table-rows", async (req, res) => {
    try {
      const rows = await storage.getTableRows();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table rows" });
    }
  });
  app2.get("/api/table-rows/:id", async (req, res) => {
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
  app2.post("/api/table-rows", async (req, res) => {
    try {
      const validatedData = insertTableRowSchema.parse(req.body);
      const row = await storage.createTableRow(validatedData);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create table row" });
      }
    }
  });
  app2.patch("/api/table-rows/:id", async (req, res) => {
    try {
      const updates = insertTableRowSchema.partial().parse(req.body);
      const row = await storage.updateTableRow(req.params.id, updates);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      res.json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update table row" });
      }
    }
  });
  app2.delete("/api/table-rows/:id", async (req, res) => {
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
  app2.post("/api/table-rows/reorder", async (req, res) => {
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
  app2.get("/api/table-columns", async (req, res) => {
    try {
      const columns = await storage.getTableColumns();
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table columns" });
    }
  });
  app2.post("/api/table-columns", async (req, res) => {
    try {
      const validatedData = insertTableColumnSchema.parse(req.body);
      const column = await storage.createTableColumn(validatedData);
      res.status(201).json(column);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create table column" });
      }
    }
  });
  app2.patch("/api/table-columns/:id", async (req, res) => {
    try {
      const updates = insertTableColumnSchema.partial().parse(req.body);
      const column = await storage.updateTableColumn(req.params.id, updates);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      res.json(column);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update table column" });
      }
    }
  });
  app2.post("/api/table-columns/reorder", async (req, res) => {
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
  app2.delete("/api/table-columns/:id", async (req, res) => {
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
  app2.post("/api/table-rows/:id/images", async (req, res) => {
    try {
      const { imageUrl, caption } = req.body;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ message: "imageUrl is required" });
      }
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      const newImage = {
        url: imageUrl,
        caption: caption && typeof caption === "string" ? caption : ""
      };
      const updatedImages = [...row.images, newImage];
      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to add image to row" });
    }
  });
  app2.patch("/api/table-rows/:id/images/:imageIndex", async (req, res) => {
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
        url: imageUrl !== void 0 ? imageUrl : updatedImages[imageIndex].url,
        caption: caption !== void 0 ? caption : updatedImages[imageIndex].caption
      };
      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image" });
    }
  });
  app2.delete("/api/table-rows/:id/images/:imageIndex?", async (req, res) => {
    try {
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      let updatedImages;
      if (req.params.imageIndex === void 0) {
        updatedImages = [];
      } else {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
