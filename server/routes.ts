import { Express } from "express";
import { createServer, type Server } from "http";
const { Pool } = require("pg");
import pool from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all table rows
  app.get("/api/table-rows", async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM table_rows");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching table rows:", error);
      res.status(500).json({ error: "Failed to fetch table rows" });
    }
  });

  // Get a single table row by ID
  app.get("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM table_rows WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Row not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching table row:", error);
      res.status(500).json({ error: "Failed to fetch table row" });
    }
  });

  // Create a new table row
  app.post("/api/table-rows", async (req, res) => {
    try {
      const { name, value } = req.body;
      const result = await pool.query(
        "INSERT INTO table_rows (name, value) VALUES ($1, $2) RETURNING *",
        [name, value]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating table row:", error);
      res.status(500).json({ error: "Failed to create table row" });
    }
  });

  // Update a table row
  app.patch("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, value } = req.body;
      const result = await pool.query(
        "UPDATE table_rows SET name = $1, value = $2 WHERE id = $3 RETURNING *",
        [name, value, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Row not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating table row:", error);
      res.status(500).json({ error: "Failed to update table row" });
    }
  });

  // Delete a table row
  app.delete("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM table_rows WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Row not found" });
      }
      res.json({ message: "Row deleted" });
    } catch (error) {
      console.error("Error deleting table row:", error);
      res.status(500).json({ error: "Failed to delete table row" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Run this in your Neon database (psql or a SQL client)
// CREATE TABLE table_rows (
//   id SERIAL PRIMARY KEY,
//   name VARCHAR(100) NOT NULL,
//   value TEXT,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
