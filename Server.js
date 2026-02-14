const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json()); // ✅ needed for req.body

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false }, // ✅ Aiven friendly (Render also)
};


// ✅ Use server PORT, not DB_PORT
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.REACT_APP_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // school deployment: allow all
      return cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// ✅ Use pool (recommended)
const pool = mysql.createPool(dbConfig);

// GET all posts
app.get("/posts", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM posts");
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE post
app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM posts WHERE postid = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Post not found" });

    return res.json({ message: "Deleted", affectedRows: result.affectedRows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE post
app.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title || !body)
      return res.status(400).json({ error: "title and body required" });

    const [result] = await pool.execute(
      "UPDATE posts SET title = ?, body = ? WHERE postid = ?",
      [title, body, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Post not found" });

    return res.json({ message: "Updated", affectedRows: result.affectedRows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`${PORT} running`);
});
