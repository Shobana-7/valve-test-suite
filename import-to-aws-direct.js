// Direct Node.js script to import database to AWS RDS
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importToAWS() {
  const RDS_ENDPOINT = 'valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com';
  const USERNAME = 'admin';
  const PASSWORD = 'Valvetest#25';
  const DATABASE_NAME = 'valve_test_suite';
  const BACKUP_FILE = 'valve_test_suite_backup_2025-10-03T16-36-31-817Z.sql';

  console.log('🔄 Importing database to AWS RDS...');
  console.log(`Endpoint: ${RDS_ENDPOINT}`);
  console.log(`Database: ${DATABASE_NAME}`);
  console.log(`Backup file: ${BACKUP_FILE}`);

  try {
    // Test connection first
    console.log('\n🔍 Testing connection...');
    const testConnection = await mysql.createConnection({
      host: RDS_ENDPOINT,
      user: USERNAME,
      password: PASSWORD,
      connectTimeout: 10000
    });
    
    console.log('✅ Connection successful');
    
    // Check if database exists, create if not
    console.log('\n📝 Creating database...');
    await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\``);
    console.log(`✅ Database ${DATABASE_NAME} ready`);
    
    await testConnection.end();
    
    // Connect to the specific database for import
    console.log('\n📥 Importing data...');
    const importConnection = await mysql.createConnection({
      host: RDS_ENDPOINT,
      user: USERNAME,
      password: PASSWORD,
      database: DATABASE_NAME,
      multipleStatements: true,
      connectTimeout: 10000
    });
    
    // Read and execute SQL file
    const sql = fs.readFileSync(BACKUP_FILE, 'utf8');
    console.log(`📄 SQL file size: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // Split SQL into individual statements to avoid issues
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      try {
        await importConnection.query(statement);
        successCount++;
        
        // Show progress every 10 statements
        if ((i + 1) % 10 === 0) {
          console.log(`  Progress: ${i + 1}/${statements.length} statements executed`);
        }
      } catch (error) {
        errorCount++;
        if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
          // Ignore duplicate/exists errors
          console.log(`  ⚠️  Skipped: ${error.message.substring(0, 50)}...`);
        } else {
          console.log(`  ❌ Error in statement ${i + 1}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`  ✅ Successful: ${successCount} statements`);
    console.log(`  ⚠️  Errors/Skipped: ${errorCount} statements`);
    
    // Verify import
    console.log('\n🔍 Verifying import...');
    const [tables] = await importConnection.query(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as table_rows
      FROM information_schema.tables 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [DATABASE_NAME]);
    
    console.log('Tables imported:');
    let totalRows = 0;
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}: ${table.table_rows || 0} rows`);
      totalRows += parseInt(table.table_rows) || 0;
    });
    
    console.log(`\n📈 Total: ${tables.length} tables, ${totalRows} rows`);
    
    // Test sample data
    console.log('\n🧪 Testing sample data...');
    try {
      const [users] = await importConnection.query('SELECT COUNT(*) as count FROM users');
      console.log(`  Users: ${users[0].count} records`);
      
      const [reports] = await importConnection.query('SELECT COUNT(*) as count FROM pop_test_headers');
      console.log(`  POP Test Reports: ${reports[0].count} records`);
      
      const [brands] = await importConnection.query('SELECT COUNT(*) as count FROM valve_brands');
      console.log(`  Valve Brands: ${brands[0].count} records`);
    } catch (error) {
      console.log(`  ⚠️  Sample data test error: ${error.message}`);
    }
    
    await importConnection.end();
    
    console.log('\n🎉 Database import completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Your .env file has been updated with AWS RDS details');
    console.log('2. Run: node test-aws-rds-connection.js');
    console.log('3. Start your application: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check if RDS endpoint is correct');
      console.error('  - Verify RDS instance is running');
      console.error('  - Check internet connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check username and password');
      console.error('  - Verify RDS security group allows connections');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔍 Troubleshooting:');
      console.error('  - Check RDS security group rules');
      console.error('  - Verify port 3306 is open');
      console.error('  - Check if RDS is publicly accessible');
    }
    
    process.exit(1);
  }
}

// Run the import
importToAWS();
