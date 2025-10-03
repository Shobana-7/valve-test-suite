// Script to fix year_of_manufacture column to support YYYY-MM format
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixYearManufactureColumn() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    console.log('✅ Connected to database');

    // Check current column type
    const [columns] = await connection.query("DESCRIBE pop_test_valves");
    const yearColumn = columns.find(col => col.Field === 'year_of_manufacture');
    console.log('Current year_of_manufacture column:', yearColumn.Type);

    // Alter the column to support YYYY-MM format
    console.log('\n🔧 Updating year_of_manufacture column to support YYYY-MM format...');
    
    await connection.query(`
      ALTER TABLE pop_test_valves 
      MODIFY COLUMN year_of_manufacture VARCHAR(7) NOT NULL
    `);

    console.log('✅ Column updated to VARCHAR(7) to support YYYY-MM format');

    // Verify the change
    const [updatedColumns] = await connection.query("DESCRIBE pop_test_valves");
    const updatedYearColumn = updatedColumns.find(col => col.Field === 'year_of_manufacture');
    console.log('Updated year_of_manufacture column:', updatedYearColumn.Type);

    console.log('\n✅ Database schema updated successfully!');
    console.log('Now year_of_manufacture can store values like "2024-09" for September 2024');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixYearManufactureColumn();
