require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Create a .env file using .env.example.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL later if you move to a managed cloud database that requires it.
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, status, created_at FROM tasks ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tasks failed:", error.message);
    res.status(500).json({ error: "Could not load tasks." });
  }
});

app.post("/api/tasks", async (req, res) => {
  const { title, description = "" } = req.body;
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "A task title is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description)
       VALUES ($1, $2)
       RETURNING id, title, description, status, created_at`,
      [title.trim(), String(description).trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task failed:", error.message);
    res.status(500).json({ error: "Could not create task." });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const allowedStatuses = ["Pending", "In Progress", "Completed"];

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid task status." });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET status = $1 WHERE id = $2
       RETURNING id, title, description, status, created_at`,
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update task failed:", error.message);
    res.status(500).json({ error: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Delete task failed:", error.message);
    res.status(500).json({ error: "Could not delete task." });
  }
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Student Task Manager is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Could not start application:", error.message);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
