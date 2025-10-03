// Check report ownership and user IDs
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkReportOwnership() {
  console.log('🔍 Checking report ownership...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Check users
    console.log('\n👥 Users in database:');
    const [users] = await connection.query('SELECT id, username, name, role FROM users');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`);
    });

    // Check POP test reports ownership
    console.log('\n📊 POP test reports ownership:');
    const [popReports] = await connection.query(`
      SELECT 
        h.id,
        h.equipment_no,
        h.operator_id,
        h.operator_name,
        h.status,
        u.username,
        u.name as user_name
      FROM pop_test_headers h
      LEFT JOIN users u ON h.operator_id = u.id
      ORDER BY h.id
    `);
    
    popReports.forEach(report => {
      console.log(`  Report ID: ${report.id}, Equipment: ${report.equipment_no}`);
      console.log(`    Operator ID: ${report.operator_id}, Name: ${report.operator_name}`);
      console.log(`    User: ${report.username} (${report.user_name}), Status: ${report.status}`);
      console.log('');
    });

    // Check if operator1 user exists and get their ID
    const [operator1] = await connection.query('SELECT id FROM users WHERE username = ?', ['operator1']);
    if (operator1.length > 0) {
      const operator1Id = operator1[0].id;
      console.log(`🔑 operator1 user ID: ${operator1Id}`);
      
      // Check which reports belong to operator1
      const [operator1Reports] = await connection.query(
        'SELECT id, equipment_no, operator_id FROM pop_test_headers WHERE operator_id = ?',
        [operator1Id]
      );
      
      console.log(`\n📋 Reports owned by operator1 (ID: ${operator1Id}):`);
      operator1Reports.forEach(report => {
        console.log(`  Report ID: ${report.id}, Equipment: ${report.equipment_no}`);
      });
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Error checking ownership:', error.message);
  }
}

checkReportOwnership();
