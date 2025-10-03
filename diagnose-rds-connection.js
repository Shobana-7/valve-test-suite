// Comprehensive RDS connection diagnostics
const mysql = require('mysql2/promise');
const net = require('net');
const dns = require('dns').promises;

async function diagnoseRDSConnection() {
  const endpoint = 'valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com';
  const port = 3306;
  const username = 'admin';
  const password = 'Valvetest#25';

  console.log('🔍 Comprehensive RDS Connection Diagnostics');
  console.log('='.repeat(50));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Port: ${port}`);
  console.log(`Username: ${username}`);
  console.log('='.repeat(50));

  // Test 1: DNS Resolution
  console.log('\n1️⃣ Testing DNS Resolution...');
  try {
    const addresses = await dns.lookup(endpoint);
    console.log(`✅ DNS Resolution: ${addresses.address} (${addresses.family})`);
  } catch (error) {
    console.log(`❌ DNS Resolution Failed: ${error.message}`);
    return;
  }

  // Test 2: TCP Connection
  console.log('\n2️⃣ Testing TCP Connection...');
  const tcpTest = new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('TCP connection timeout (10 seconds)'));
    }, 10000);

    socket.connect(port, endpoint, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve('TCP connection successful');
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  try {
    const tcpResult = await tcpTest;
    console.log(`✅ ${tcpResult}`);
  } catch (error) {
    console.log(`❌ TCP Connection Failed: ${error.message}`);
    console.log('\n🚨 TCP Connection Issues:');
    console.log('This indicates one of the following problems:');
    console.log('1. RDS instance is not publicly accessible');
    console.log('2. Security group is still blocking connections');
    console.log('3. Network ACLs are blocking traffic');
    console.log('4. RDS is in a private subnet without internet gateway');
    console.log('\n📋 Additional Checks Needed:');
    console.log('1. Verify RDS "Publicly accessible" setting is "Yes"');
    console.log('2. Check if RDS is in a public subnet');
    console.log('3. Verify VPC has an Internet Gateway');
    console.log('4. Check Network ACLs (should allow port 3306)');
    return;
  }

  // Test 3: MySQL Connection
  console.log('\n3️⃣ Testing MySQL Connection...');
  try {
    const connection = await mysql.createConnection({
      host: endpoint,
      port: port,
      user: username,
      password: password,
      connectTimeout: 10000
    });

    console.log('✅ MySQL Connection Successful!');
    
    const [result] = await connection.query('SELECT VERSION() as version, NOW() as current_time');
    console.log(`📊 MySQL Version: ${result[0].version}`);
    console.log(`🕐 Server Time: ${result[0].current_time}`);
    
    await connection.end();
    console.log('\n🎉 All tests passed! RDS is ready for use.');
    
  } catch (error) {
    console.log(`❌ MySQL Connection Failed: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🚨 Authentication Error:');
      console.log('- Username or password is incorrect');
      console.log('- Check credentials in AWS RDS console');
    } else {
      console.log('\n🚨 Connection Error:');
      console.log('- TCP connection works but MySQL handshake failed');
      console.log('- This is unusual - check RDS logs');
    }
  }
}

// Additional function to check RDS configuration via AWS CLI (if available)
async function checkRDSConfig() {
  console.log('\n4️⃣ Checking RDS Configuration...');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    // Check if AWS CLI is available
    await execAsync('aws --version');
    console.log('✅ AWS CLI is available');
    
    // Get RDS instance details
    const { stdout } = await execAsync(`aws rds describe-db-instances --db-instance-identifier valve-test-db --region ap-southeast-2 --query "DBInstances[0].{PubliclyAccessible:PubliclyAccessible,VpcId:DBSubnetGroup.VpcId,SubnetGroupName:DBSubnetGroup.DBSubnetGroupName,SecurityGroups:VpcSecurityGroups}" --output json`);
    
    const config = JSON.parse(stdout);
    console.log('\n📋 RDS Configuration:');
    console.log(`   Publicly Accessible: ${config.PubliclyAccessible}`);
    console.log(`   VPC ID: ${config.VpcId}`);
    console.log(`   Subnet Group: ${config.SubnetGroupName}`);
    console.log(`   Security Groups: ${config.SecurityGroups.map(sg => sg.VpcSecurityGroupId).join(', ')}`);
    
    if (!config.PubliclyAccessible) {
      console.log('\n❌ ISSUE FOUND: RDS is not publicly accessible!');
      console.log('📋 Fix: Enable public accessibility in RDS console');
    }
    
  } catch (error) {
    console.log('⚠️  AWS CLI not available or not configured');
    console.log('Manual check required in AWS console');
  }
}

// Run diagnostics
async function runDiagnostics() {
  await diagnoseRDSConnection();
  await checkRDSConfig();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔧 NEXT STEPS:');
  console.log('='.repeat(50));
  console.log('1. If TCP connection fails:');
  console.log('   - Check RDS "Publicly accessible" setting');
  console.log('   - Verify RDS is in public subnet');
  console.log('   - Check VPC Internet Gateway');
  console.log('');
  console.log('2. If MySQL connection fails:');
  console.log('   - Verify username/password');
  console.log('   - Check RDS parameter groups');
  console.log('');
  console.log('3. AWS Console Links:');
  console.log('   RDS: https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2');
  console.log('   VPC: https://ap-southeast-2.console.aws.amazon.com/vpc/home?region=ap-southeast-2');
}

runDiagnostics();
