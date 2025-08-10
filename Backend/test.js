const db = require('./db');

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Failed to connect to the database:', err.message);
  } else {
    console.log('✅ Connected to the database successfully.');
    connection.release(); // Always release the connection back to pool
  }

  setTimeout(() => {
    console.log('Test finished');
    process.exit();
  }, 1000);
});
