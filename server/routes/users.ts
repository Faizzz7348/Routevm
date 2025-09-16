import { Router } from "express";
import pool from "../db";

const router = Router();

router.get("/api/users", async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;