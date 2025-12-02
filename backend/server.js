const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Create PostgreSQL connection pool with retry
const createPool = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
  });

  // Test connection on startup
  pool.on('connect', () => {
    console.log('✅ Database connection established');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
  });

  return pool;
};

const pool = createPool();

// Test database connection on startup
const testConnection = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✅ Successfully connected to PostgreSQL');
      
      // Create todos table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Todos table ready');
      
      client.release();
      break;
    } catch (err) {
      retries--;
      console.log(`⚠️ Database connection failed. Retries left: ${retries}`);
      if (retries === 0) {
        console.error('❌ Could not connect to database after multiple attempts');
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
};

// Call test connection
testConnection();

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      status: "OK",
      message: "Backend is running",
      database: "Connected",
      timestamp: result.rows[0].time
    });
  } catch (error) {
    res.json({
      status: "WARNING",
      message: "Backend is running but database connection failed",
      database: "Disconnected",
      error: error.message
    });
  }
});

// TODO: Get all todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM todos ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      count: result.rowCount,
      todos: result.rows
    });
  } catch (error) {
    console.error("Get todos error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch todos"
    });
  }
});

// TODO: Get single todo
app.get("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM todos WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found"
      });
    }

    res.json({
      success: true,
      todo: result.rows[0]
    });
  } catch (error) {
    console.error("Get todo error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch todo"
    });
  }
});

// TODO: Create new todo
app.post("/api/todos", async (req, res) => {
  try {
    const { title, description = "" } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Title is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO todos (title, description, completed) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title.trim(), description.trim(), false]
    );

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      todo: result.rows[0]
    });
  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create todo"
    });
  }
});

// TODO: Update todo
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Check if todo exists
    const checkResult = await pool.query(
      "SELECT * FROM todos WHERE id = $1",
      [id]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found"
      });
    }

    const updateFields = [];
    const values = [];
    let query = "UPDATE todos SET ";

    if (title !== undefined) {
      updateFields.push(`title = $${updateFields.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${updateFields.length + 1}`);
      values.push(description);
    }
    if (completed !== undefined) {
      updateFields.push(`completed = $${updateFields.length + 1}`);
      values.push(completed);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    query += updateFields.join(", ");
    query += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Todo updated successfully",
      todo: result.rows[0]
    });
  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update todo"
    });
  }
});

// TODO: Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found"
      });
    }

    res.json({
      success: true,
      message: "Todo deleted successfully",
      todo: result.rows[0]
    });
  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete todo"
    });
  }
});

// TODO: Toggle todo completion
app.patch("/api/todos/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE todos 
       SET completed = NOT completed, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found"
      });
    }

    res.json({
      success: true,
      message: "Todo toggled successfully",
      todo: result.rows[0]
    });
  } catch (error) {
    console.error("Toggle todo error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle todo"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});