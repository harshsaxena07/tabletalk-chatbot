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
    const { sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ message: 'Invalid SQL' });
    }

    // 🚀 No SQL blocking — everything is allowed
    const result = await pool.query(sql);
    res.json({ result: result.rows });
    
  } catch (err) {
    console.error("SQL Execution Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
