// Test application connection to AWS RDS
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAppConnection() {
  console.log('🔍 Testing Application Connection to AWS RDS...');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
  
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
  
  try {
    console.log('\n⏳ Testing connection...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection successful!');
    
    // Test basic query
    const [result] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${result[0].version}`);
    
    // Test application tables
    console.log('\n🧪 Testing application tables...');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`  Users: ${users[0].count} records`);
    
    const [reports] = await connection.query('SELECT COUNT(*) as count FROM pop_test_headers');
    console.log(`  POP Test Reports: ${reports[0].count} records`);
    
    const [brands] = await connection.query('SELECT COUNT(*) as count FROM valve_brands');
    console.log(`  Valve Brands: ${brands[0].count} records`);
    
    // Test a sample login query (like the app would do)
    console.log('\n🔐 Testing authentication query...');
    const [authTest] = await connection.query('SELECT id, username, role FROM users WHERE username = ? LIMIT 1', ['operator1']);
    if (authTest.length > 0) {
      console.log(`  ✅ Found user: ${authTest[0].username} (${authTest[0].role})`);
    } else {
      console.log(`  ⚠️  No test user found`);
    }
    
    await connection.end();
    
    console.log('\n🎉 All application tests passed!');
    console.log('\n🚀 Your application should now work with AWS RDS');
    console.log('Start with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔧 Authentication Issue:');
      console.log('The credentials in .env might not match the RDS instance');
      console.log('\nPossible solutions:');
      console.log('1. Verify password in AWS RDS console');
      console.log('2. Reset RDS master password');
      console.log('3. Check if user exists in database');
      
      console.log('\n📋 Current .env configuration:');
      console.log(`DB_HOST=${dbConfig.host}`);
      console.log(`DB_USER=${dbConfig.user}`);
      console.log(`DB_PASSWORD=${dbConfig.password}`);
      console.log(`DB_NAME=${dbConfig.database}`);
      
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n🔧 Database Issue:');
      console.log('The database name might not exist');
      console.log('Try connecting without specifying database first');
      
    } else {
      console.log('\n🔧 Other Issue:');
      console.log('Check RDS instance status and configuration');
    }
    
    process.exit(1);
  }
}

testAppConnection();
