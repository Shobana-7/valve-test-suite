// Simple RDS connection test
const mysql = require('mysql2/promise');

async function testConnection() {
  const config = {
    host: 'valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'Valvetest#25',
    connectTimeout: 10000,
    acquireTimeout: 10000
  };

  console.log('🔍 Testing AWS RDS Connection...');
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.user}`);
  console.log(`Region: ap-southeast-2 (Sydney)`);

  try {
    console.log('\n⏳ Attempting connection...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    
    const [result] = await connection.query('SELECT VERSION() as version, NOW() as current_time');
    console.log(`📊 MySQL Version: ${result[0].version}`);
    console.log(`🕐 Server Time: ${result[0].current_time}`);
    
    await connection.end();
    console.log('\n🎉 RDS connection test passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('Error Code:', error.code);
    
    console.log('\n🔧 Troubleshooting Steps:');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n🚨 TIMEOUT ERROR - Security Group Issue');
      console.log('This usually means the RDS security group is blocking connections.');
      console.log('\n📋 Fix Steps:');
      console.log('1. Go to AWS Console → RDS → Databases → valve-test-db');
      console.log('2. Click on "Connectivity & security" tab');
      console.log('3. Click on the Security Group link');
      console.log('4. Edit inbound rules:');
      console.log('   - Type: MySQL/Aurora');
      console.log('   - Port: 3306');
      console.log('   - Source: 0.0.0.0/0 (for testing) or your IP');
      console.log('5. Save the rule and try again');
      
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🚨 DNS/ENDPOINT ERROR');
      console.log('The RDS endpoint cannot be found.');
      console.log('\n📋 Fix Steps:');
      console.log('1. Verify RDS instance is running');
      console.log('2. Check the endpoint spelling');
      console.log('3. Ensure RDS is in ap-southeast-2 region');
      
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🚨 AUTHENTICATION ERROR');
      console.log('Username or password is incorrect.');
      console.log('\n📋 Fix Steps:');
      console.log('1. Verify username: admin');
      console.log('2. Verify password: Valvetest#25');
      console.log('3. Check if user exists in RDS');
      
    } else {
      console.log('\n🚨 UNKNOWN ERROR');
      console.log('Please check:');
      console.log('1. RDS instance status');
      console.log('2. Network connectivity');
      console.log('3. AWS region settings');
    }
    
    console.log('\n🌐 AWS Console Links:');
    console.log('RDS Dashboard: https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2');
    console.log('Security Groups: https://ap-southeast-2.console.aws.amazon.com/ec2/home?region=ap-southeast-2#SecurityGroups:');
    
    process.exit(1);
  }
}

testConnection();
