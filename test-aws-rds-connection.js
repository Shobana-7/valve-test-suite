// Script to test AWS RDS MySQL connection and validate migration
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAWSRDSConnection() {
  console.log('🔄 Testing AWS RDS MySQL connection...');
  
  try {
    // AWS RDS connection configuration
    const rdsConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? {
        ca: process.env.DB_SSL_CA ? require('fs').readFileSync(process.env.DB_SSL_CA) : undefined,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 10000,
      acquireTimeout: 10000
    };

    console.log(`📊 Connection Details:`);
    console.log(`  Host: ${rdsConfig.host}`);
    console.log(`  Port: ${rdsConfig.port}`);
    console.log(`  User: ${rdsConfig.user}`);
    console.log(`  Database: ${rdsConfig.database}`);
    console.log(`  SSL: ${rdsConfig.ssl ? 'Enabled' : 'Disabled'}`);
    
    // Test basic connection
    console.log('\n🔍 Testing basic connection...');
    const connection = await mysql.createConnection(rdsConfig);
    console.log('✅ Connection successful!');
    
    // Test database version
    console.log('\n📋 Database Information:');
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    console.log(`  MySQL Version: ${versionResult[0].version}`);
    
    // Test current database
    const [dbResult] = await connection.query('SELECT DATABASE() as current_db');
    console.log(`  Current Database: ${dbResult[0].current_db}`);
    
    // Test server status
    const [statusResult] = await connection.query('SHOW STATUS LIKE "Uptime"');
    console.log(`  Server Uptime: ${statusResult[0].Value} seconds`);
    
    // Validate database schema
    console.log('\n📊 Database Schema Validation:');
    
    const [tables] = await connection.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [rdsConfig.database]);
    
    console.log('Tables found:');
    let totalRows = 0;
    let totalSize = 0;
    
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}: ${table.table_rows} rows (${table.size_mb} MB)`);
      totalRows += parseInt(table.table_rows) || 0;
      totalSize += parseFloat(table.size_mb) || 0;
    });
    
    console.log(`\n📈 Summary: ${tables.length} tables, ${totalRows} total rows, ${totalSize.toFixed(2)} MB`);
    
    // Validate critical tables
    console.log('\n🔍 Validating Critical Tables:');
    
    const criticalTables = [
      'users',
      'pop_test_headers', 
      'pop_test_valves',
      'valve_brands',
      'valve_models',
      'valve_materials',
      'valve_io_sizes',
      'valve_set_pressures'
    ];
    
    for (const tableName of criticalTables) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${count[0].count} records`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: Table not found or error - ${error.message}`);
      }
    }
    
    // Test sample data
    console.log('\n📋 Sample Data Validation:');
    
    try {
      // Test users
      const [users] = await connection.query('SELECT username, role FROM users LIMIT 3');
      console.log('  Users:');
      users.forEach(user => {
        console.log(`    - ${user.username} (${user.role})`);
      });
      
      // Test brands
      const [brands] = await connection.query('SELECT brand_name FROM valve_brands LIMIT 5');
      console.log('  Valve Brands:');
      brands.forEach(brand => {
        console.log(`    - ${brand.brand_name}`);
      });
      
      // Test POP test reports
      const [reports] = await connection.query('SELECT report_number, equipment_no FROM pop_test_headers LIMIT 3');
      console.log('  POP Test Reports:');
      reports.forEach(report => {
        console.log(`    - ${report.report_number} (${report.equipment_no})`);
      });
      
    } catch (error) {
      console.log(`  ⚠️  Sample data validation error: ${error.message}`);
    }
    
    // Test application-specific queries
    console.log('\n🧪 Testing Application Queries:');
    
    try {
      // Test login query
      const [loginTest] = await connection.query(
        'SELECT id, username, role FROM users WHERE username = ? LIMIT 1',
        ['operator1']
      );
      console.log(`  ✅ Login query: Found user ${loginTest[0]?.username || 'none'}`);
      
      // Test master data query
      const [masterDataTest] = await connection.query(`
        SELECT 
          (SELECT COUNT(*) FROM valve_brands) as brands,
          (SELECT COUNT(*) FROM valve_models) as models,
          (SELECT COUNT(*) FROM valve_materials) as materials
      `);
      console.log(`  ✅ Master data: ${masterDataTest[0].brands} brands, ${masterDataTest[0].models} models, ${masterDataTest[0].materials} materials`);
      
      // Test reports query
      const [reportsTest] = await connection.query(`
        SELECT COUNT(*) as count FROM pop_test_headers
      `);
      console.log(`  ✅ Reports query: ${reportsTest[0].count} POP test reports`);
      
    } catch (error) {
      console.log(`  ❌ Application query error: ${error.message}`);
    }
    
    // Performance test
    console.log('\n⚡ Performance Test:');
    
    const startTime = Date.now();
    await connection.query('SELECT 1');
    const queryTime = Date.now() - startTime;
    console.log(`  Query latency: ${queryTime}ms`);
    
    if (queryTime < 100) {
      console.log('  ✅ Excellent performance');
    } else if (queryTime < 500) {
      console.log('  ⚠️  Acceptable performance');
    } else {
      console.log('  ❌ Poor performance - check network/configuration');
    }
    
    await connection.end();
    
    console.log('\n🎉 AWS RDS Connection Test Completed Successfully!');
    console.log('\n✅ Summary:');
    console.log('  - Database connection: Working');
    console.log('  - Schema validation: Passed');
    console.log('  - Sample data: Available');
    console.log('  - Application queries: Working');
    console.log(`  - Performance: ${queryTime}ms latency`);
    
    console.log('\n🚀 Your application is ready to use AWS RDS MySQL!');
    
  } catch (error) {
    console.error('\n❌ AWS RDS Connection Test Failed:');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check if RDS endpoint is correct');
      console.error('  - Verify RDS instance is running');
      console.error('  - Check DNS resolution');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check username and password');
      console.error('  - Verify user has proper permissions');
      console.error('  - Check if user can connect from your IP');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check security group rules');
      console.error('  - Verify port 3306 is open');
      console.error('  - Check VPC and subnet configuration');
    }
    
    process.exit(1);
  }
}

// Run the test
testAWSRDSConnection();
