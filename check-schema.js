const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    console.log('🔗 Connected to database');
    
    // Check if pop_test_headers table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'pop_test_headers'");
    
    if (tables.length === 0) {
      console.log('❌ pop_test_headers table does not exist');
      return;
    }
    
    console.log('✅ pop_test_headers table exists');
    
    // Describe the table structure
    const [columns] = await connection.query('DESCRIBE pop_test_headers');
    
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Default ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    // Check for range specifically
    const rangeField = columns.find(col => col.Field === 'range');
    if (rangeField) {
      console.log('\n✅ range column exists');
    } else {
      console.log('\n❌ range column does NOT exist');
      console.log('Available columns:', columns.map(col => col.Field).join(', '));
    }

    // Also check pop_test_valves table
    console.log('\n📋 Checking pop_test_valves table...');
    const [valveTables] = await connection.query("SHOW TABLES LIKE 'pop_test_valves'");

    if (valveTables.length === 0) {
      console.log('❌ pop_test_valves table does not exist');
    } else {
      console.log('✅ pop_test_valves table exists');
      const [valveColumns] = await connection.query('DESCRIBE pop_test_valves');
      console.log('Valve table columns:', valveColumns.map(col => col.Field).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
