const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root', 
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    const [valveColumns] = await connection.query('DESCRIBE pop_test_valves');
    console.log('pop_test_valves columns:');
    valveColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Default}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkTableStructure();
