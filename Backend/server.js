const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Route to handle SQL execution
app.post('/execute-sql', async (req, res) => {
  try {
    let { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ message: 'Invalid SQL' });
    }

    let result;

    // Special case: handle "\dt"
    if (sql.trim().toLowerCase() === '\\dt') {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `;
      result = await pool.query(tablesQuery);
    } else {
      //Regular SQL
      result = await pool.query(sql);
    }

    res.json({ result: result.rows });

  } catch (err) {
    console.error("SQL Execution Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
