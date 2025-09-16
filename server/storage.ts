import { type TableRow, type InsertTableRow, type TableColumn, type InsertTableColumn, type ImageWithCaption, tableRows, tableColumns } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  // Table rows
  getTableRows(): Promise<TableRow[]>;
  getTableRow(id: string): Promise<TableRow | undefined>;
  createTableRow(row: InsertTableRow): Promise<TableRow>;
  updateTableRow(id: string, updates: Partial<InsertTableRow>): Promise<TableRow | undefined>;
  deleteTableRow(id: string): Promise<boolean>;
  reorderTableRows(rowIds: string[]): Promise<TableRow[]>;
  
  // Table columns
  getTableColumns(): Promise<TableColumn[]>;
  getTableColumn(id: string): Promise<TableColumn | undefined>;
  createTableColumn(column: InsertTableColumn): Promise<TableColumn>;
  updateTableColumn(id: string, updates: Partial<InsertTableColumn>): Promise<TableColumn | undefined>;
  deleteTableColumn(id: string): Promise<boolean>;
  reorderTableColumns(columnIds: string[]): Promise<TableColumn[]>;
}

export class MemStorage implements IStorage {
  private tableRows: Map<string, TableRow>;
  private tableColumns: Map<string, TableColumn>;

  constructor() {
    this.tableRows = new Map();
    this.tableColumns = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Initialize default columns - these are permanent core columns
    const defaultColumns: TableColumn[] = [
      { id: "col-1", name: "ID", dataKey: "id", type: "text", sortOrder: 0, isEditable: "false", options: [] },
      { id: "col-2", name: "Route", dataKey: "route", type: "select", sortOrder: 1, isEditable: "true", options: ["SL 1", "SL 2", "SL 3", "KL 3", "KL 4", "KL 6", "KL 7"] },
      { id: "col-3", name: "Code", dataKey: "code", type: "text", sortOrder: 2, isEditable: "true", options: [] },
      { id: "col-4", name: "Location", dataKey: "location", type: "text", sortOrder: 3, isEditable: "true", options: [] },
      { id: "col-5", name: "Delivery", dataKey: "delivery", type: "text", sortOrder: 4, isEditable: "true", options: [] },
      { id: "col-6", name: "Trip", dataKey: "trip", type: "select", sortOrder: 5, isEditable: "true", options: ["Daily", "Weekday", "Alt 1", "Alt 2"] },
      { id: "col-7", name: "A1", dataKey: "alt1", type: "text", sortOrder: 6, isEditable: "true", options: [] },
      { id: "col-8", name: "A2", dataKey: "alt2", type: "text", sortOrder: 7, isEditable: "true", options: [] },
      { id: "col-9", name: "Info", dataKey: "info", type: "text", sortOrder: 8, isEditable: "true", options: [] },
      { id: "col-10", name: "Images", dataKey: "images", type: "images", sortOrder: 9, isEditable: "false", options: [] },
    ];

    defaultColumns.forEach(column => {
      this.tableColumns.set(column.id, column);
    });

    // Initialize sample rows
    const defaultRows: TableRow[] = [
      {
        id: "row-1",
        no: 1,
        route: "KL-01",
        code: "CODE001",
        location: "Kuala Lumpur",
        delivery: "Same Day",
        trip: "Daily",
        alt1: "Alternative 1",
        alt2: "Alternative 2",
        info: "Sample information for row 1",
        tngSite: "TnG KL Central",
        tngRoute: "Central-North",
        images: [
          { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Modern city skyline" },
          { url: "https://images.unsplash.com/photo-1573167507387-4d8c0a67ceb2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Urban landscape" }
        ],
        sortOrder: 0,
      },
      {
        id: "row-2",
        no: 2,
        route: "SG-02",
        code: "CODE002",
        location: "Selangor",
        delivery: "Next Day",
        trip: "Weekday",
        alt1: "Alt Option 1",
        alt2: "Alt Option 2",
        info: "Details for Selangor route",
        tngSite: "TnG Shah Alam",
        tngRoute: "Central-West",
        images: [{ url: "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Suburban area" }],
        sortOrder: 1,
      },
      {
        id: "row-3",
        no: 3,
        route: "JB-03",
        code: "CODE003",
        location: "Johor Bahru",
        delivery: "2-3 Days",
        trip: "Alt 1",
        alt1: "JB Alternative",
        alt2: "South Route",
        info: "Information about Johor Bahru delivery",
        tngSite: "TnG JB Plaza",
        tngRoute: "South-East",
        images: [],
        sortOrder: 2,
      },
      {
        id: "row-4",
        no: 4,
        route: "PG-04",
        code: "CODE004",
        location: "Penang",
        delivery: "Same Day",
        trip: "Alt 2",
        alt1: "Penang Alt",
        alt2: "Georgetown",
        info: "Penang delivery information",
        tngSite: "TnG Georgetown",
        tngRoute: "North-West",
        images: [{ url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Georgetown bridge" }],
        sortOrder: 3,
      },
      {
        id: "row-6",
        no: 5,
        route: "KT-05",
        code: "CODE005",
        location: "Kota Kinabalu",
        delivery: "3-5 Days",
        trip: "Daily",
        alt1: "KK Option",
        alt2: "Sabah Route",
        info: "Extended delivery to East Malaysia",
        tngSite: "TnG KK Mall",
        tngRoute: "East-North",
        images: [],
        sortOrder: 4,
      },
    ];

    defaultRows.forEach(row => {
      this.tableRows.set(row.id, row);
    });
  }

  // Table rows methods
  async getTableRows(): Promise<TableRow[]> {
    return Array.from(this.tableRows.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTableRow(id: string): Promise<TableRow | undefined> {
    return this.tableRows.get(id);
  }

  async createTableRow(insertRow: InsertTableRow): Promise<TableRow> {
    const id = randomUUID();
    const maxSortOrder = Math.max(...Array.from(this.tableRows.values()).map(r => r.sortOrder), -1);
    const row: TableRow = {
      no: insertRow.no || 0,
      route: insertRow.route || '',
      code: insertRow.code || '',
      location: insertRow.location || '',
      delivery: insertRow.delivery || '',
      trip: insertRow.trip || '',
      alt1: insertRow.alt1 || '',
      alt2: insertRow.alt2 || '',
      info: insertRow.info || '',
      tngSite: insertRow.tngSite || '',
      tngRoute: insertRow.tngRoute || '',
      images: (insertRow.images as ImageWithCaption[]) || [],
      id,
      sortOrder: maxSortOrder + 1,
    };
    this.tableRows.set(id, row);
    return row;
  }

  async updateTableRow(id: string, updates: Partial<InsertTableRow>): Promise<TableRow | undefined> {
    const existingRow = this.tableRows.get(id);
    if (!existingRow) return undefined;

    const updatedRow = { ...existingRow, ...updates } as TableRow;
    this.tableRows.set(id, updatedRow);
    return updatedRow;
  }

  async deleteTableRow(id: string): Promise<boolean> {
    return this.tableRows.delete(id);
  }

  async reorderTableRows(rowIds: string[]): Promise<TableRow[]> {
    rowIds.forEach((id, index) => {
      const row = this.tableRows.get(id);
      if (row) {
        row.sortOrder = index;
        this.tableRows.set(id, row);
      }
    });
    return this.getTableRows();
  }

  // Table columns methods
  async getTableColumns(): Promise<TableColumn[]> {
    return Array.from(this.tableColumns.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTableColumn(id: string): Promise<TableColumn | undefined> {
    return this.tableColumns.get(id);
  }

  async createTableColumn(insertColumn: InsertTableColumn): Promise<TableColumn> {
    const id = randomUUID();
    const maxSortOrder = Math.max(...Array.from(this.tableColumns.values()).map(c => c.sortOrder), -1);
    const column: TableColumn = {
      name: insertColumn.name,
      dataKey: insertColumn.dataKey,
      type: insertColumn.type || 'text',
      isEditable: insertColumn.isEditable || 'true',
      options: insertColumn.options || [],
      id,
      sortOrder: maxSortOrder + 1,
    };
    this.tableColumns.set(id, column);
    return column;
  }

  async updateTableColumn(id: string, updates: Partial<InsertTableColumn>): Promise<TableColumn | undefined> {
    const existingColumn = this.tableColumns.get(id);
    if (!existingColumn) return undefined;

    const updatedColumn = { ...existingColumn, ...updates };
    this.tableColumns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteTableColumn(id: string): Promise<boolean> {
    // Prevent deletion of core columns (col-1 through col-8)
    const coreColumnIds = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7', 'col-8', 'col-9'];
    if (coreColumnIds.includes(id)) {
      return false; // Cannot delete core columns
    }
    return this.tableColumns.delete(id);
  }

  async reorderTableColumns(columnIds: string[]): Promise<TableColumn[]> {
    columnIds.forEach((id, index) => {
      const column = this.tableColumns.get(id);
      if (column) {
        column.sortOrder = index;
        this.tableColumns.set(id, column);
      }
    });
    return this.getTableColumns();
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with sample data if tables are empty
    this.initializeData().catch(console.error);
  }

  private async initializeData() {
    try {
      // Check if data already exists
      const existingColumns = await db.select().from(tableColumns);
      const existingRows = await db.select().from(tableRows);

      if (existingColumns.length === 0) {
        // Initialize default columns - these are permanent core columns
        const defaultColumns: Omit<TableColumn, 'id' | 'sortOrder'>[] = [
          { name: "ID", dataKey: "id", type: "text", isEditable: "false", options: [] },
          { name: "Route", dataKey: "route", type: "select", isEditable: "true", options: ["SL 1", "SL 2", "SL 3", "KL 3", "KL 4", "KL 6", "KL 7"] },
          { name: "Code", dataKey: "code", type: "text", isEditable: "true", options: [] },
          { name: "Location", dataKey: "location", type: "text", isEditable: "true", options: [] },
          { name: "Delivery", dataKey: "delivery", type: "text", isEditable: "true", options: [] },
          { name: "Trip", dataKey: "trip", type: "text", isEditable: "true", options: [] },
          { name: "Alt1", dataKey: "alt1", type: "text", isEditable: "true", options: [] },
          { name: "Alt2", dataKey: "alt2", type: "text", isEditable: "true", options: [] },
          { name: "Info", dataKey: "info", type: "text", isEditable: "true", options: [] },
          { name: "Images", dataKey: "images", type: "images", isEditable: "false", options: [] },
        ];

        const columnsWithOrder = defaultColumns.map((col, index) => ({
          ...col,
          sortOrder: index
        }));
        await db.insert(tableColumns).values(columnsWithOrder);
      }

      if (existingRows.length === 0) {
        // Initialize sample rows
        const defaultRows: Omit<TableRow, 'id' | 'sortOrder'>[] = [
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
            ],
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
            images: [{ url: "https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Suburban area" }],
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
            images: [],
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
            images: [{ url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", caption: "Georgetown bridge" }],
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
            images: [],
          },
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
  async getTableRows(): Promise<TableRow[]> {
    return await db.select().from(tableRows).orderBy(asc(tableRows.sortOrder));
  }

  async getTableRow(id: string): Promise<TableRow | undefined> {
    const [row] = await db.select().from(tableRows).where(eq(tableRows.id, id));
    return row || undefined;
  }

  async createTableRow(insertRow: InsertTableRow): Promise<TableRow> {
    const existingRows = await this.getTableRows();
    const maxSortOrder = Math.max(...existingRows.map(r => r.sortOrder), -1);
    
    const [row] = await db.insert(tableRows).values({
      no: insertRow.no || 0,
      route: insertRow.route || '',
      code: insertRow.code || '',
      location: insertRow.location || '',
      delivery: insertRow.delivery || '',
      alt1: insertRow.alt1 || '',
      alt2: insertRow.alt2 || '',
      info: insertRow.info || '',
      tngSite: insertRow.tngSite || '',
      tngRoute: insertRow.tngRoute || '',
      images: (insertRow.images as ImageWithCaption[]) || [],
      sortOrder: maxSortOrder + 1,
    }).returning();
    
    return row;
  }

  async updateTableRow(id: string, updates: Partial<InsertTableRow>): Promise<TableRow | undefined> {
    const [updatedRow] = await db.update(tableRows)
      .set(updates as any)
      .where(eq(tableRows.id, id))
      .returning();
    
    return updatedRow || undefined;
  }

  async deleteTableRow(id: string): Promise<boolean> {
    const result = await db.delete(tableRows).where(eq(tableRows.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderTableRows(rowIds: string[]): Promise<TableRow[]> {
    for (let i = 0; i < rowIds.length; i++) {
      await db.update(tableRows)
        .set({ sortOrder: i })
        .where(eq(tableRows.id, rowIds[i]));
    }
    return this.getTableRows();
  }

  // Table columns methods
  async getTableColumns(): Promise<TableColumn[]> {
    return await db.select().from(tableColumns).orderBy(asc(tableColumns.sortOrder));
  }

  async getTableColumn(id: string): Promise<TableColumn | undefined> {
    const [column] = await db.select().from(tableColumns).where(eq(tableColumns.id, id));
    return column || undefined;
  }

  async createTableColumn(insertColumn: InsertTableColumn): Promise<TableColumn> {
    const existingColumns = await this.getTableColumns();
    const maxSortOrder = Math.max(...existingColumns.map(c => c.sortOrder), -1);
    
    const [column] = await db.insert(tableColumns).values({
      ...insertColumn,
      sortOrder: maxSortOrder + 1,
    }).returning();
    
    return column;
  }

  async updateTableColumn(id: string, updates: Partial<InsertTableColumn>): Promise<TableColumn | undefined> {
    const [updatedColumn] = await db.update(tableColumns)
      .set(updates)
      .where(eq(tableColumns.id, id))
      .returning();
    
    return updatedColumn || undefined;
  }

  async deleteTableColumn(id: string): Promise<boolean> {
    // Get the column to check if it's a core column
    const column = await this.getTableColumn(id);
    if (!column) return false;

    // Prevent deletion of core columns (based on dataKey)
    const coreDataKeys = ['id', 'no', 'route', 'code', 'location', 'delivery', 'trip', 'alt1', 'alt2', 'info', 'tngSite', 'tngRoute', 'images'];
    if (coreDataKeys.includes(column.dataKey)) {
      return false; // Cannot delete core columns
    }

    const result = await db.delete(tableColumns).where(eq(tableColumns.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderTableColumns(columnIds: string[]): Promise<TableColumn[]> {
    for (let i = 0; i < columnIds.length; i++) {
      await db.update(tableColumns)
        .set({ sortOrder: i })
        .where(eq(tableColumns.id, columnIds[i]));
    }
    return this.getTableColumns();
  }
}

export const storage = new DatabaseStorage();
