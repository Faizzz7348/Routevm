var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import pkg from "pg";
var { Pool } = pkg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
  // Required for Neon
});
var db_default = pool;

// server/routes.ts
var { Pool: Pool2 } = __require("pg");
async function registerRoutes(app2) {
  app2.get("/api/table-rows", async (_req, res) => {
    try {
      const result = await db_default.query("SELECT * FROM table_rows");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching table rows:", error);
      res.status(500).json({ error: "Failed to fetch table rows" });
    }
  });
  app2.get("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db_default.query("SELECT * FROM table_rows WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Row not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching table row:", error);
      res.status(500).json({ error: "Failed to fetch table row" });
    }
  });
  app2.post("/api/table-rows", async (req, res) => {
    try {
      const { name, value } = req.body;
      const result = await db_default.query(
        "INSERT INTO table_rows (name, value) VALUES ($1, $2) RETURNING *",
        [name, value]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating table row:", error);
      res.status(500).json({ error: "Failed to create table row" });
    }
  });
  app2.patch("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, value } = req.body;
      const result = await db_default.query(
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
  app2.delete("/api/table-rows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db_default.query(
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
(async () => {
  const server = await registerRoutes(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
})();
