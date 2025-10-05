var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import dotenv2 from "dotenv";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  imageSchema: () => imageSchema,
  insertLayoutPreferencesSchema: () => insertLayoutPreferencesSchema,
  insertPageSchema: () => insertPageSchema,
  insertRouteOptimizationSchema: () => insertRouteOptimizationSchema,
  insertTableColumnSchema: () => insertTableColumnSchema,
  insertTableRowSchema: () => insertTableRowSchema,
  layoutPreferences: () => layoutPreferences,
  mediaSchema: () => mediaSchema,
  pages: () => pages,
  routeOptimizationResult: () => routeOptimizationResult,
  tableColumns: () => tableColumns,
  tableRows: () => tableRows
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, jsonb, integer, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var mediaSchema = z.object({
  url: z.string(),
  caption: z.string().optional().default(""),
  type: z.enum(["image", "video"]).default("image"),
  thumbnail: z.string().optional()
  // For video thumbnails
});
var imageSchema = mediaSchema;
var tableRows = pgTable("table_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  no: integer("no").notNull().default(0),
  route: text("route").notNull().default(""),
  code: text("code").notNull().default(""),
  location: text("location").notNull().default(""),
  trip: text("trip").notNull().default(""),
  info: text("info").notNull().default(""),
  tngSite: text("tng_site").notNull().default(""),
  tngRoute: text("tng_route").notNull().default(""),
  destination: text("destination").notNull().default("0.00"),
  tollPrice: text("toll_price").notNull().default("0.00"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  images: jsonb("images").$type().notNull().default([]),
  qrCode: text("qr_code").default(""),
  sortOrder: integer("sort_order").notNull().default(0)
}, (table) => ({
  uniqueSpecialSort: uniqueIndex("ux_one_special_sortorder").on(table.sortOrder).where(sql`${table.sortOrder} = -1`)
}));
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
var routeOptimizationResult = pgTable("route_optimization_result", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalOrder: jsonb("original_order").$type().notNull(),
  optimizedOrder: jsonb("optimized_order").$type().notNull(),
  originalDistance: decimal("original_distance", { precision: 8, scale: 2 }).notNull(),
  optimizedDistance: decimal("optimized_distance", { precision: 8, scale: 2 }).notNull(),
  timeSaved: decimal("time_saved", { precision: 8, scale: 2 }).notNull(),
  fuelSaved: decimal("fuel_saved", { precision: 8, scale: 2 }).notNull(),
  algorithm: text("algorithm").notNull().default("nearest_neighbor"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertRouteOptimizationSchema = createInsertSchema(routeOptimizationResult).omit({
  id: true,
  createdAt: true
});
var layoutPreferences = pgTable("layout_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default("default"),
  columnOrder: jsonb("column_order").$type().notNull().default([]),
  columnVisibility: jsonb("column_visibility").$type().notNull().default({}),
  creatorName: text("creator_name").notNull().default("Somebody"),
  creatorUrl: text("creator_url").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdIdx: uniqueIndex("layout_user_id_idx").on(table.userId)
}));
var insertLayoutPreferencesSchema = createInsertSchema(layoutPreferences).omit({
  id: true,
  updatedAt: true
});
var pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0)
});
var insertPageSchema = createInsertSchema(pages).omit({
  id: true
});

// server/db.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, asc, desc } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.initializeData().catch(console.error);
    this.ensureCoreColumns().catch(console.error);
  }
  async initializeData() {
    try {
      const existingColumns = await db.select().from(tableColumns);
      const existingRows = await db.select().from(tableRows);
      if (existingColumns.length === 0) {
        const defaultColumns = [
          {
            name: "ID",
            dataKey: "id",
            type: "text",
            sortOrder: 1,
            isEditable: "false",
            options: []
          },
          {
            name: "No",
            dataKey: "no",
            type: "text",
            sortOrder: 2,
            isEditable: "false",
            options: []
          },
          {
            name: "Route",
            dataKey: "route",
            type: "select",
            sortOrder: 3,
            isEditable: "true",
            options: [
              "KL 1",
              "KL 2",
              "KL 3",
              "KL 4",
              "KL 5",
              "KL 6",
              "KL 7",
              "SL 1",
              "SL 2",
              "SL 3"
            ]
          },
          {
            name: "Code",
            dataKey: "code",
            type: "text",
            sortOrder: 4,
            isEditable: "true",
            options: []
          },
          {
            name: "Location",
            dataKey: "location",
            type: "text",
            sortOrder: 5,
            isEditable: "true",
            options: []
          },
          {
            name: "Trip",
            dataKey: "trip",
            type: "select",
            sortOrder: 6,
            isEditable: "true",
            options: ["Daily", "Weekday", "Alt 1", "Alt 2"]
          },
          {
            name: "Parking",
            dataKey: "tngRoute",
            type: "currency",
            sortOrder: 7,
            isEditable: "true",
            options: []
          },
          {
            name: "Info",
            dataKey: "info",
            type: "text",
            sortOrder: 8,
            isEditable: "true",
            options: []
          },
          {
            name: "Images",
            dataKey: "images",
            type: "images",
            sortOrder: 9,
            isEditable: "false",
            options: []
          },
          {
            name: "Kilometer",
            dataKey: "kilometer",
            type: "number",
            sortOrder: 10,
            isEditable: "false",
            options: []
          },
          {
            name: "Toll Price",
            dataKey: "tollPrice",
            type: "currency",
            sortOrder: 11,
            isEditable: "false",
            options: []
          },
          {
            name: "Latitude",
            dataKey: "latitude",
            type: "text",
            sortOrder: 12,
            isEditable: "true",
            options: []
          },
          {
            name: "Longitude",
            dataKey: "longitude",
            type: "text",
            sortOrder: 13,
            isEditable: "true",
            options: []
          }
        ];
        const columnsWithOrder = defaultColumns;
        await db.insert(tableColumns).values(columnsWithOrder);
      }
      const qlKitchenExists = existingRows.some(
        (row) => row.route === "Warehouse" && row.location === "QL Kitchen" && row.sortOrder === -1
      );
      if (!qlKitchenExists) {
        try {
          await db.insert(tableRows).values({
            no: 999,
            route: "Warehouse",
            code: "QL001",
            location: "QL Kitchen",
            trip: "Daily",
            info: "Special QL Kitchen warehouse route",
            tngSite: "QL Central",
            tngRoute: "0.00",
            destination: "0.00",
            tollPrice: "0.00",
            latitude: "3.139003",
            longitude: "101.686855",
            images: [],
            qrCode: "",
            sortOrder: -1
          });
        } catch (error) {
          if (error.code !== "23505" || !error.detail?.includes("sort_order")) {
            throw error;
          }
        }
      }
      if (existingRows.length === 0) {
        const defaultRows = [
          {
            no: 1,
            route: "KL-01",
            code: "CODE001",
            location: "Kuala Lumpur",
            trip: "Daily",
            info: "Sample information for row 1",
            tngSite: "TnG KL Central",
            tngRoute: "15.50",
            destination: "25.00",
            tollPrice: "0.00",
            latitude: "3.139003",
            longitude: "101.686855",
            images: [
              {
                url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
                caption: "KL city center",
                type: "image"
              },
              {
                url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
                caption: "Petronas Towers",
                type: "image"
              }
            ],
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://maps.google.com/?q=3.139003,101.686855"
          },
          {
            no: 2,
            route: "SG-02",
            code: "CODE002",
            location: "Selangor",
            trip: "Weekday",
            info: "Details for Selangor route",
            tngSite: "TnG Shah Alam",
            tngRoute: "22.75",
            destination: "18.50",
            tollPrice: "0.00",
            latitude: "3.085602",
            longitude: "101.532303",
            images: [
              {
                url: "https://images.unsplash.com/photo-1605649487212-183a9c785351?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
                caption: "Selangor district",
                type: "image"
              }
            ],
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://maps.google.com/?q=3.085602,101.532303"
          },
          {
            no: 3,
            route: "JB-03",
            code: "CODE003",
            location: "Johor Bahru",
            trip: "Alt 1",
            info: "Information about Johor Bahru delivery",
            tngSite: "TnG JB Plaza",
            tngRoute: "8.90",
            destination: "12.75",
            tollPrice: "0.00",
            latitude: "1.464651",
            longitude: "103.761475",
            images: [],
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fmvending.web.app/location/JB-03"
          },
          {
            no: 4,
            route: "PG-04",
            code: "CODE004",
            location: "Penang",
            trip: "Alt 2",
            info: "Penang delivery information",
            tngSite: "TnG Georgetown",
            tngRoute: "32.40",
            destination: "28.75",
            tollPrice: "0.00",
            latitude: "5.414184",
            longitude: "100.329113",
            images: [
              {
                url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
                caption: "Penang heritage",
                type: "image"
              }
            ],
            qrCode: ""
          },
          {
            no: 5,
            route: "KT-05",
            code: "CODE005",
            location: "Kota Kinabalu",
            trip: "Daily",
            info: "Extended delivery to East Malaysia",
            tngSite: "TnG KK Mall",
            tngRoute: "45.20",
            destination: "35.60",
            tollPrice: "0.00",
            latitude: "5.974407",
            longitude: "116.095692",
            images: [],
            qrCode: ""
          }
        ];
        for (let i = 0; i < defaultRows.length; i++) {
          const row = defaultRows[i];
          const sortOrder = row.location === "QL Kitchen" ? -1 : i - 1;
          await db.insert(tableRows).values({
            no: row.no,
            route: row.route,
            code: row.code,
            location: row.location,
            trip: row.trip,
            info: row.info,
            tngSite: row.tngSite,
            tngRoute: row.tngRoute,
            destination: row.destination,
            latitude: row.latitude,
            longitude: row.longitude,
            images: row.images,
            qrCode: row.qrCode,
            sortOrder
          });
        }
      }
    } catch (error) {
      console.error("Error initializing database data:", error);
    }
  }
  async ensureCoreColumns() {
    try {
      const existingColumns = await this.getTableColumns();
      const kilometerColumn = existingColumns.find((col) => col.dataKey === "kilometer");
      const tollPriceColumn = existingColumns.find((col) => col.dataKey === "tollPrice");
      if (!kilometerColumn) {
        const infoColumn = existingColumns.find((col) => col.dataKey === "info");
        const infoSortOrder = infoColumn ? infoColumn.sortOrder : 6;
        await db.insert(tableColumns).values({
          name: "Kilometer",
          dataKey: "kilometer",
          type: "number",
          sortOrder: infoSortOrder + 1,
          isEditable: "false",
          options: []
        });
        for (const col of existingColumns) {
          if (col.sortOrder > infoSortOrder) {
            await db.update(tableColumns).set({ sortOrder: col.sortOrder + 1 }).where(eq(tableColumns.id, col.id));
          }
        }
      }
      if (!tollPriceColumn) {
        const updatedColumns = await this.getTableColumns();
        const kilometerCol = updatedColumns.find((col) => col.dataKey === "kilometer");
        const kilometerSortOrder = kilometerCol ? kilometerCol.sortOrder : 11;
        await db.insert(tableColumns).values({
          name: "Toll Price",
          dataKey: "tollPrice",
          type: "currency",
          sortOrder: kilometerSortOrder + 1,
          isEditable: "false",
          options: []
        });
        for (const col of updatedColumns) {
          if (col.sortOrder > kilometerSortOrder) {
            await db.update(tableColumns).set({ sortOrder: col.sortOrder + 1 }).where(eq(tableColumns.id, col.id));
          }
        }
      }
    } catch (error) {
      console.error("Error ensuring core columns:", error);
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
  async getQlKitchenRow() {
    const [row] = await db.select().from(tableRows).where(eq(tableRows.sortOrder, -1));
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
      trip: insertRow.trip || "",
      info: insertRow.info || "",
      tngSite: insertRow.tngSite || "",
      tngRoute: insertRow.tngRoute || "",
      tollPrice: insertRow.tollPrice || "0.00",
      latitude: insertRow.latitude || null,
      longitude: insertRow.longitude || null,
      images: insertRow.images || [],
      sortOrder: maxSortOrder + 1
    }).returning();
    return row;
  }
  async updateTableRow(id, updates) {
    const existingRow = await this.getTableRow(id);
    if (!existingRow) return void 0;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== void 0)
    );
    if (filteredUpdates.sortOrder === -1 && existingRow.location !== "QL Kitchen") {
      throw new Error("Only QL kitchen row can have sortOrder -1");
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return this.getTableRow(id);
    }
    const [updatedRow] = await db.update(tableRows).set(filteredUpdates).where(eq(tableRows.id, id)).returning();
    return updatedRow || void 0;
  }
  async deleteTableRow(id) {
    const result = await db.delete(tableRows).where(eq(tableRows.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderTableRows(rowIds) {
    const qlKitchenRow = await this.getQlKitchenRow();
    const filteredRowIds = qlKitchenRow ? rowIds.filter((id) => id !== qlKitchenRow.id) : rowIds;
    for (let i = 0; i < filteredRowIds.length; i++) {
      await db.update(tableRows).set({ sortOrder: i }).where(eq(tableRows.id, filteredRowIds[i]));
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
    const maxSortOrder = Math.max(
      ...existingColumns.map((c) => c.sortOrder),
      -1
    );
    const columnData = {
      name: insertColumn.name,
      dataKey: insertColumn.dataKey,
      type: insertColumn.type || "text",
      isEditable: insertColumn.isEditable || "true",
      options: insertColumn.options || [],
      sortOrder: maxSortOrder + 1
    };
    const [column] = await db.insert(tableColumns).values(columnData).returning();
    return column;
  }
  async updateTableColumn(id, updates) {
    const updateData = {
      ...updates,
      options: updates.options ? updates.options : void 0
    };
    const [updatedColumn] = await db.update(tableColumns).set(updateData).where(eq(tableColumns.id, id)).returning();
    return updatedColumn || void 0;
  }
  async deleteTableColumn(id) {
    const column = await this.getTableColumn(id);
    if (!column) return false;
    const coreDataKeys = [
      "id",
      "no",
      "route",
      "code",
      "location",
      "trip",
      "info",
      "tngRoute",
      "latitude",
      "longitude",
      "images"
    ];
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
  // Route optimization results methods
  async getSavedRoutes() {
    return await db.select().from(routeOptimizationResult).orderBy(desc(routeOptimizationResult.createdAt));
  }
  async getSavedRoute(id) {
    const [route] = await db.select().from(routeOptimizationResult).where(eq(routeOptimizationResult.id, id));
    return route || void 0;
  }
  async saveRoute(route) {
    const [savedRoute] = await db.insert(routeOptimizationResult).values({
      ...route,
      originalOrder: [...route.originalOrder],
      optimizedOrder: [...route.optimizedOrder]
    }).returning();
    return savedRoute;
  }
  async deleteSavedRoute(id) {
    const result = await db.delete(routeOptimizationResult).where(eq(routeOptimizationResult.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Layout preferences methods
  async getLayoutPreferences(userId) {
    const [layout] = await db.select().from(layoutPreferences).where(eq(layoutPreferences.userId, userId)).limit(1);
    return layout || void 0;
  }
  async saveLayoutPreferences(userId, layout) {
    const existing = await this.getLayoutPreferences(userId);
    if (existing) {
      const [updated] = await db.update(layoutPreferences).set({
        columnOrder: Array.from(layout.columnOrder || []),
        columnVisibility: { ...layout.columnVisibility || {} },
        creatorName: layout.creatorName !== void 0 ? layout.creatorName : existing.creatorName,
        creatorUrl: layout.creatorUrl !== void 0 ? layout.creatorUrl : existing.creatorUrl,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(layoutPreferences.id, existing.id)).returning();
      return updated;
    } else {
      const [saved] = await db.insert(layoutPreferences).values({
        userId,
        columnOrder: Array.from(layout.columnOrder || []),
        columnVisibility: { ...layout.columnVisibility || {} },
        creatorName: layout.creatorName || "Somebody",
        creatorUrl: layout.creatorUrl || ""
      }).returning();
      return saved;
    }
  }
  // Pages methods
  async getPages() {
    return await db.select().from(pages).orderBy(asc(pages.sortOrder));
  }
  async getPage(id) {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page || void 0;
  }
  async createPage(page) {
    const [newPage] = await db.insert(pages).values({
      title: page.title || "",
      description: page.description || "",
      sortOrder: page.sortOrder || 0
    }).returning();
    return newPage;
  }
  async updatePage(id, updates) {
    const [updated] = await db.update(pages).set(updates).where(eq(pages.id, id)).returning();
    return updated || void 0;
  }
  async deletePage(id) {
    const result = await db.delete(pages).where(eq(pages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/routeOptimizer.ts
var QL_KITCHEN_LOCATION = {
  latitude: 3.0738,
  longitude: 101.5183
};
var AVERAGE_SPEED_KMH = 40;
var FUEL_CONSUMPTION_PER_KM = 0.12;
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
function calculateRouteDistance(locations, startLocation) {
  if (locations.length === 0) return 0;
  let totalDistance = 0;
  let currentLat = startLocation.latitude;
  let currentLon = startLocation.longitude;
  for (const location of locations) {
    const distance = calculateDistance(
      currentLat,
      currentLon,
      location.latitude,
      location.longitude
    );
    totalDistance += distance;
    currentLat = location.latitude;
    currentLon = location.longitude;
  }
  return totalDistance;
}
function nearestNeighborOptimization(locations, startLocation, prioritizeTrip = false) {
  if (locations.length === 0) return [];
  const unvisited = [...locations];
  const route = [];
  let currentLat = startLocation.latitude;
  let currentLon = startLocation.longitude;
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      let adjustedDistance = distance;
      if (prioritizeTrip && unvisited[i].trip) {
        adjustedDistance = distance * 0.7;
      }
      if (adjustedDistance < nearestDistance) {
        nearestDistance = adjustedDistance;
        nearestIndex = i;
      }
    }
    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push(nearest);
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
  }
  return route;
}
function twoOptOptimization(route) {
  if (route.length < 4) return route;
  let improved = true;
  let optimizedRoute = [...route];
  while (improved) {
    improved = false;
    for (let i = 0; i < optimizedRoute.length - 2; i++) {
      for (let j = i + 2; j < optimizedRoute.length; j++) {
        const currentDistance = (i > 0 ? calculateDistance(
          optimizedRoute[i - 1].latitude,
          optimizedRoute[i - 1].longitude,
          optimizedRoute[i].latitude,
          optimizedRoute[i].longitude
        ) : 0) + calculateDistance(
          optimizedRoute[j - 1].latitude,
          optimizedRoute[j - 1].longitude,
          optimizedRoute[j].latitude,
          optimizedRoute[j].longitude
        );
        const newDistance = (i > 0 ? calculateDistance(
          optimizedRoute[i - 1].latitude,
          optimizedRoute[i - 1].longitude,
          optimizedRoute[j - 1].latitude,
          optimizedRoute[j - 1].longitude
        ) : 0) + calculateDistance(
          optimizedRoute[i].latitude,
          optimizedRoute[i].longitude,
          optimizedRoute[j].latitude,
          optimizedRoute[j].longitude
        );
        if (newDistance < currentDistance) {
          optimizedRoute = [
            ...optimizedRoute.slice(0, i),
            ...optimizedRoute.slice(i, j).reverse(),
            ...optimizedRoute.slice(j)
          ];
          improved = true;
        }
      }
    }
  }
  return optimizedRoute;
}
function geneticAlgorithmOptimization(locations, startLocation, prioritizeTrip = false) {
  if (locations.length === 0) return [];
  if (locations.length < 5) {
    const initial = nearestNeighborOptimization(
      locations,
      startLocation,
      prioritizeTrip
    );
    return twoOptOptimization(initial);
  }
  const POPULATION_SIZE = 50;
  const GENERATIONS = 100;
  const MUTATION_RATE = 0.1;
  const ELITE_SIZE = 5;
  let population = [];
  population.push(
    nearestNeighborOptimization(locations, startLocation, prioritizeTrip)
  );
  for (let i = 1; i < POPULATION_SIZE; i++) {
    const shuffled = [...locations].sort(() => Math.random() - 0.5);
    population.push(shuffled);
  }
  for (let gen = 0; gen < GENERATIONS; gen++) {
    const fitness = population.map((route) => {
      const distance = calculateRouteDistance(route, startLocation);
      return 1 / (distance + 1);
    });
    const sortedIndices = fitness.map((f, i) => ({ fitness: f, index: i })).sort((a, b) => b.fitness - a.fitness);
    const newPopulation = [];
    for (let i = 0; i < ELITE_SIZE; i++) {
      newPopulation.push([...population[sortedIndices[i].index]]);
    }
    while (newPopulation.length < POPULATION_SIZE) {
      const parent1 = population[sortedIndices[Math.floor(Math.random() * POPULATION_SIZE / 2)].index];
      const parent2 = population[sortedIndices[Math.floor(Math.random() * POPULATION_SIZE / 2)].index];
      const child = orderCrossover(parent1, parent2);
      if (Math.random() < MUTATION_RATE) {
        swapMutation(child);
      }
      newPopulation.push(child);
    }
    population = newPopulation;
  }
  const finalFitness = population.map((route) => {
    const distance = calculateRouteDistance(route, startLocation);
    return 1 / (distance + 1);
  });
  const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));
  return population[bestIndex];
}
function orderCrossover(parent1, parent2) {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;
  const child = new Array(size);
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }
  let currentIndex = (end + 1) % size;
  for (let i = 0; i < size; i++) {
    const parent2Index = (end + 1 + i) % size;
    const location = parent2[parent2Index];
    if (!child.includes(location)) {
      child[currentIndex] = location;
      currentIndex = (currentIndex + 1) % size;
    }
  }
  return child;
}
function swapMutation(route) {
  const i = Math.floor(Math.random() * route.length);
  const j = Math.floor(Math.random() * route.length);
  [route[i], route[j]] = [route[j], route[i]];
}
function simulatedAnnealingOptimization(locations, startLocation, prioritizeTrip = false) {
  if (locations.length === 0) return [];
  let currentRoute = nearestNeighborOptimization(
    locations,
    startLocation,
    prioritizeTrip
  );
  let currentDistance = calculateRouteDistance(currentRoute, startLocation);
  let bestRoute = [...currentRoute];
  let bestDistance = currentDistance;
  let temperature = 1e3;
  const coolingRate = 0.995;
  const minTemperature = 1;
  while (temperature > minTemperature) {
    const newRoute = [...currentRoute];
    const i = Math.floor(Math.random() * newRoute.length);
    const j = Math.floor(Math.random() * newRoute.length);
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    const newDistance = calculateRouteDistance(newRoute, startLocation);
    const delta = newDistance - currentDistance;
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
      currentRoute = newRoute;
      currentDistance = newDistance;
      if (currentDistance < bestDistance) {
        bestRoute = [...currentRoute];
        bestDistance = currentDistance;
      }
    }
    temperature *= coolingRate;
  }
  return bestRoute;
}
function optimizeRoute(rows, algorithm = "nearest_neighbor", startLocation = QL_KITCHEN_LOCATION, prioritizeTrip = false) {
  const locationsWithData = rows.filter(
    (row) => row.latitude && row.longitude && parseFloat(row.latitude) !== 0 && parseFloat(row.longitude) !== 0
  ).map((row) => ({
    id: row.id,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    name: row.location || "Unknown",
    trip: row.trip
  }));
  if (locationsWithData.length === 0) {
    throw new Error("No valid locations with coordinates found");
  }
  const originalDistance = calculateRouteDistance(
    locationsWithData,
    startLocation
  );
  let optimizedLocations;
  switch (algorithm) {
    case "genetic":
      optimizedLocations = geneticAlgorithmOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      break;
    case "simulated_annealing":
      optimizedLocations = simulatedAnnealingOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      break;
    case "nearest_neighbor":
    default:
      const initial = nearestNeighborOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      optimizedLocations = twoOptOptimization(initial);
      break;
  }
  const optimizedDistance = calculateRouteDistance(
    optimizedLocations,
    startLocation
  );
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = distanceSaved / AVERAGE_SPEED_KMH * 60;
  const fuelSaved = distanceSaved * FUEL_CONSUMPTION_PER_KM;
  return {
    originalOrder: locationsWithData.map((l) => l.id),
    optimizedOrder: optimizedLocations.map((l) => l.id),
    originalDistance: parseFloat(originalDistance.toFixed(2)),
    optimizedDistance: parseFloat(optimizedDistance.toFixed(2)),
    distanceSaved: parseFloat(distanceSaved.toFixed(2)),
    timeSaved: parseFloat(timeSaved.toFixed(2)),
    fuelSaved: parseFloat(fuelSaved.toFixed(2)),
    algorithm,
    optimizationFactors: {
      distanceReduction: parseFloat(
        (distanceSaved / originalDistance * 100).toFixed(2)
      ),
      timeEfficiency: parseFloat(timeSaved.toFixed(2)),
      fuelEfficiency: parseFloat(fuelSaved.toFixed(2))
    }
  };
}

// server/googleMaps.ts
var GOOGLE_MAPS_API_KEY = process.env.GOOGLE_API_KEY;
var QL_KITCHEN_LOCATION2 = {
  latitude: 3.0738,
  longitude: 101.5183
};
async function calculateRouteForLorry(destination) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not configured");
    return { distanceKm: 0, tollPrice: 0 };
  }
  if (!destination.latitude || !destination.longitude) {
    console.warn(`No coordinates for destination: ${destination.location}`);
    return { distanceKm: 0, tollPrice: 0 };
  }
  try {
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: QL_KITCHEN_LOCATION2.latitude,
            longitude: QL_KITCHEN_LOCATION2.longitude
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: parseFloat(destination.latitude.toString()),
            longitude: parseFloat(destination.longitude.toString())
          }
        }
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      // Optimizes for shortest route considering traffic
      computeAlternativeRoutes: false,
      routeModifiers: {
        vehicleInfo: {
          emissionType: "DIESEL"
        },
        avoidTolls: false,
        // We want toll info for lorries
        avoidHighways: false,
        // Lorries use highways
        avoidFerries: true
        // Avoid ferries for lorries when possible
      },
      extraComputations: ["TOLLS"],
      units: "METRIC"
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Maps API error: ${response.status} - ${errorText}`);
      return { distanceKm: 0, tollPrice: 0 };
    }
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      console.warn(`No route found for destination: ${destination.location}`);
      return { distanceKm: 0, tollPrice: 0 };
    }
    const route = data.routes[0];
    const distanceKm = route.distanceMeters ? Math.round(route.distanceMeters / 1e3 * 10) / 10 : 0;
    const tollInfo = route.travelAdvisory?.tollInfo;
    let tollPrice = 0;
    if (tollInfo && tollInfo.estimatedPrice && tollInfo.estimatedPrice.length > 0) {
      const myrToll = tollInfo.estimatedPrice.find((price) => price.currencyCode === "MYR") || tollInfo.estimatedPrice[0];
      if (myrToll) {
        const units = parseFloat(myrToll.units || "0");
        const nanos = (myrToll.nanos || 0) / 1e9;
        tollPrice = units + nanos;
        const class1Multiplier = 1;
        tollPrice = Math.round(tollPrice * class1Multiplier * 100) / 100;
      }
    }
    return { distanceKm, tollPrice };
  } catch (error) {
    console.error(`Error calculating route for ${destination.location}:`, error);
    return { distanceKm: 0, tollPrice: 0 };
  }
}
async function calculateRoutesForDestinations(destinations) {
  const distances = {};
  const tollPrices = {};
  const batchSize = 5;
  for (let i = 0; i < destinations.length; i += batchSize) {
    const batch = destinations.slice(i, i + batchSize);
    const promises = batch.map(async (dest) => {
      const result = await calculateRouteForLorry(dest);
      return { id: dest.id, distanceKm: result.distanceKm, toll: result.tollPrice };
    });
    const results = await Promise.all(promises);
    results.forEach(({ id, distanceKm, toll }) => {
      distances[id] = distanceKm;
      tollPrices[id] = toll;
    });
    if (i + batchSize < destinations.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return { distances, tollPrices };
}

// server/routes.ts
var uuidSchema = z2.string().uuid();
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
  app2.get("/api/ql-kitchen", async (req, res) => {
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
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      const normalizedBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
          return [camelKey, value];
        })
      );
      if (normalizedBody.tngRoute !== void 0) {
        const currencyValue = String(normalizedBody.tngRoute);
        if (currencyValue !== "" && isNaN(Number(currencyValue))) {
          return res.status(400).json({
            message: "Invalid currency value",
            details: "Currency value must be a number"
          });
        }
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error(`Error updating row ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to update table row" });
      }
    }
  });
  app2.delete("/api/table-rows/:id", async (req, res) => {
    try {
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
  app2.post("/api/table-rows/reorder", async (req, res) => {
    try {
      const { rowIds } = req.body;
      if (!Array.isArray(rowIds)) {
        return res.status(400).json({ message: "rowIds must be an array" });
      }
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
  app2.delete("/api/table-columns/:id", async (req, res) => {
    try {
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
  app2.post("/api/table-rows/:id/images", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      const { imageUrl, caption } = req.body;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ message: "imageUrl is required" });
      }
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      const existingImageUrls = row.images.map((img) => img.url);
      if (existingImageUrls.includes(imageUrl)) {
        return res.status(400).json({ message: "Image URL already exists for this row" });
      }
      const newImage = {
        url: imageUrl,
        caption: caption && typeof caption === "string" ? caption : "",
        type: "image"
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
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      const { imageUrl, caption } = req.body;
      const imageIndex = parseInt(req.params.imageIndex);
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
      if (imageUrl !== void 0) {
        const existingImageUrls = row.images.map((img, idx) => idx !== imageIndex ? img.url : null).filter(Boolean);
        if (existingImageUrls.includes(imageUrl)) {
          return res.status(400).json({ message: "Image URL already exists for this row" });
        }
      }
      const updatedImages = [...row.images];
      updatedImages[imageIndex] = {
        url: imageUrl !== void 0 ? imageUrl : updatedImages[imageIndex].url,
        caption: caption !== void 0 ? caption : updatedImages[imageIndex].caption,
        type: updatedImages[imageIndex].type || "image",
        thumbnail: updatedImages[imageIndex].thumbnail
      };
      const updatedRow = await storage.updateTableRow(req.params.id, { images: updatedImages });
      res.json(updatedRow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image" });
    }
  });
  app2.delete("/api/table-rows/:id/images/:imageIndex?", async (req, res) => {
    try {
      const validationResult = uuidSchema.safeParse(req.params.id);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid row ID format" });
      }
      const row = await storage.getTableRow(req.params.id);
      if (!row) {
        return res.status(404).json({ message: "Row not found" });
      }
      let updatedImages;
      if (req.params.imageIndex === void 0) {
        updatedImages = [];
      } else {
        const imageIndex = parseInt(req.params.imageIndex);
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
  app2.get("/api/proxy-image", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter required" });
      }
      if (!url.match(/^https?:\/\//)) {
        return res.status(400).json({ error: "Only HTTP/HTTPS URLs allowed" });
      }
      if (url.length > 2e3) {
        return res.status(400).json({ error: "URL too long" });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "QR-Scanner-Bot/1.0"
        }
      });
      clearTimeout(timeout);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        return res.status(415).json({ error: "Not an image" });
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return res.status(413).json({ error: "Image too large" });
      }
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300"
      });
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Proxy image error:", error);
      if (error.name === "AbortError") {
        res.status(408).json({ error: "Request timeout" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
  app2.post("/api/calculate-tolls", async (req, res) => {
    try {
      const requestSchema = z2.object({
        rowIds: z2.array(z2.string().uuid()).optional()
      });
      const validatedData = requestSchema.parse(req.body);
      let rows;
      if (validatedData.rowIds && validatedData.rowIds.length > 0) {
        const allRows = await storage.getTableRows();
        rows = allRows.filter((row) => validatedData.rowIds.includes(row.id));
      } else {
        rows = await storage.getTableRows();
        rows = rows.filter((row) => row.sortOrder !== -1);
      }
      const routeData = await calculateRoutesForDestinations(rows);
      for (const row of rows) {
        const updates = {};
        if (routeData.distances[row.id] !== void 0) {
          updates.kilometer = routeData.distances[row.id].toString();
        }
        if (routeData.tollPrices[row.id] !== void 0) {
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Toll calculation error:", error);
        res.status(500).json({ message: "Failed to calculate toll prices" });
      }
    }
  });
  app2.post("/api/optimize-route", async (req, res) => {
    try {
      const requestSchema = z2.object({
        rowIds: z2.array(z2.string().uuid()).optional(),
        startLocation: z2.object({
          latitude: z2.number(),
          longitude: z2.number()
        }).optional(),
        algorithm: z2.enum(["nearest_neighbor", "genetic", "simulated_annealing"]).optional(),
        prioritizeTrip: z2.boolean().optional(),
        maxDistance: z2.number().optional(),
        vehicleSpecs: z2.object({
          type: z2.string(),
          fuelType: z2.string(),
          tollClass: z2.number()
        }).optional()
      });
      const validatedData = requestSchema.parse(req.body);
      let rows;
      if (validatedData.rowIds && validatedData.rowIds.length > 0) {
        const allRows = await storage.getTableRows();
        rows = allRows.filter((row) => validatedData.rowIds.includes(row.id));
      } else {
        rows = await storage.getTableRows();
        rows = rows.filter((row) => row.sortOrder !== -1);
      }
      const validRows = rows.filter(
        (row) => row.latitude && row.longitude && !isNaN(parseFloat(row.latitude)) && !isNaN(parseFloat(row.longitude)) && parseFloat(row.latitude) !== 0 && parseFloat(row.longitude) !== 0
      );
      if (validRows.length < 2) {
        return res.status(400).json({
          message: `At least 2 locations with valid coordinates are required for optimization. Found ${validRows.length}.`
        });
      }
      const result = optimizeRoute(
        validRows,
        validatedData.algorithm || "nearest_neighbor",
        validatedData.startLocation,
        validatedData.prioritizeTrip || false
      );
      res.json(result);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        console.error("Route optimization error:", error);
        res.status(500).json({ message: "Failed to optimize route" });
      }
    }
  });
  app2.post("/api/save-route", async (req, res) => {
    try {
      const validatedData = insertRouteOptimizationSchema.parse(req.body);
      const savedRoute = await storage.saveRoute(validatedData);
      res.status(201).json(savedRoute);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Save route error:", error);
        res.status(500).json({ message: "Failed to save route" });
      }
    }
  });
  app2.get("/api/saved-routes", async (req, res) => {
    try {
      const savedRoutes = await storage.getSavedRoutes();
      res.json(savedRoutes);
    } catch (error) {
      console.error("Get saved routes error:", error);
      res.status(500).json({ message: "Failed to fetch saved routes" });
    }
  });
  app2.get("/api/saved-routes/:id", async (req, res) => {
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
  app2.delete("/api/saved-routes/:id", async (req, res) => {
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
  app2.get("/api/layout", async (req, res) => {
    try {
      const userIdSchema = z2.string().min(1, "userId cannot be empty");
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
  app2.post("/api/layout", async (req, res) => {
    try {
      const userIdSchema = z2.string().min(1, "userId cannot be empty");
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Save layout preferences error:", error);
        res.status(500).json({ message: "Failed to save layout preferences" });
      }
    }
  });
  app2.get("/api/pages", async (req, res) => {
    try {
      const pages2 = await storage.getPages();
      res.json(pages2);
    } catch (error) {
      console.error("Get pages error:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });
  app2.get("/api/pages/:id", async (req, res) => {
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
  app2.post("/api/pages", async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const page = await storage.createPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Create page error:", error);
        res.status(500).json({ message: "Failed to create page" });
      }
    }
  });
  app2.patch("/api/pages/:id", async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Update page error:", error);
        res.status(500).json({ message: "Failed to update page" });
      }
    }
  });
  app2.delete("/api/pages/:id", async (req, res) => {
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
dotenv2.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
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
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      log(`Error ${status}: ${message}`, "error");
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        log(`Port ${port} is already in use`, "error");
        process.exit(1);
      } else {
        log(`Server error: ${error.message}`, "error");
        process.exit(1);
      }
    });
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`Server successfully started on port ${port}`);
      log(`Environment: ${app.get("env")}`);
      log(`Health check available at /health`);
    });
    process.on("uncaughtException", (error) => {
      log(`Uncaught Exception: ${error.message}`, "error");
      console.error(error);
      process.exit(1);
    });
    process.on("unhandledRejection", (reason, promise) => {
      log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "error");
      console.error(reason);
      process.exit(1);
    });
  } catch (error) {
    log(`Failed to initialize server: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    console.error(error);
    process.exit(1);
  }
})();
