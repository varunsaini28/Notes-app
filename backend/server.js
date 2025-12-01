const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
require("dotenv").config(); // Add this to load environment variables

const app = express();
app.use(express.json());
app.use(cors());

// Pool or reuse client for better performance
let client;

async function initializeClient() {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  console.log("Database connected");
  return client;
}

// Initialize connection
initializeClient().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) await client.end();
  process.exit(0);
});

// Input validation middleware
function validateNote(req, res, next) {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  if (title.length > 100) {
    return res.status(400).json({ error: "Title too long" });
  }
  next();
}

app.post("/add", validateNote, async function (req, res) {
  try {
    const { title, content } = req.body;
    
    const addNoteQuery = `
      INSERT INTO notes(id, title, content, created_at) 
      VALUES($1, $2, $3, NOW())
      RETURNING *`;
    
    // Generate UUID on server side
    const id = require('crypto').randomUUID();
    const values = [id, title, content];
    
    const result = await client.query(addNoteQuery, values);
    
    return res.status(201).json({
      success: true,
      msg: "Note added",
      note: result.rows[0]
    });
  } catch (error) {
    console.error("Add note error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.get("/notes", async function (req, res) {
  try {
    const selectQuery = "SELECT * FROM notes ORDER BY created_at DESC";
    const response = await client.query(selectQuery);
    
    return res.json({
      success: true,
      data: response.rows
    });
  } catch (error) {
    console.error("Get notes error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Add delete endpoint
app.delete("/notes/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const deleteQuery = "DELETE FROM notes WHERE id = $1 RETURNING *";
    const result = await client.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    return res.json({
      success: true,
      msg: "Note deleted"
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});