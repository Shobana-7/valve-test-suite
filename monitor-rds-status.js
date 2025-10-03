// Monitor RDS status during modification
const net = require('net');
const dns = require('dns').promises;

async function monitorRDS() {
  const endpoint = 'valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com';
  const port = 3306;
  
  console.log('🔄 Monitoring RDS status during modification...');
  console.log(`Endpoint: ${endpoint}`);
  console.log('Press Ctrl+C to stop monitoring\n');
  
  let lastIP = null;
  let consecutiveSuccesses = 0;
  
  const checkStatus = async () => {
    try {
      // Check DNS resolution
      const addresses = await dns.lookup(endpoint);
      const currentIP = addresses.address;
      
      if (lastIP !== currentIP) {
        console.log(`📍 IP Changed: ${lastIP || 'Unknown'} → ${currentIP}`);
        lastIP = currentIP;
        
        // Check if it's a public IP
        if (currentIP.startsWith('172.31.') || currentIP.startsWith('10.') || currentIP.startsWith('192.168.')) {
          console.log(`   🔒 Private IP (${currentIP}) - Still not publicly accessible`);
        } else {
          console.log(`   🌐 Public IP (${currentIP}) - Now publicly accessible!`);
        }
      }
      
      // Test TCP connection
      const tcpTest = new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('timeout'));
        }, 3000);

        socket.connect(port, endpoint, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve(true);
        });

        socket.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      try {
        await tcpTest;
        consecutiveSuccesses++;
        console.log(`✅ [${new Date().toLocaleTimeString()}] TCP Connection: SUCCESS (${consecutiveSuccesses} consecutive)`);
        
        if (consecutiveSuccesses >= 3) {
          console.log('\n🎉 RDS is now accessible! Running full connection test...');
          
          // Run the full diagnostic
          const { exec } = require('child_process');
          exec('node diagnose-rds-connection.js', (error, stdout, stderr) => {
            console.log(stdout);
            if (error) console.error(stderr);
            
            console.log('\n🚀 Ready to import database!');
            console.log('Run: node import-to-aws-direct.js');
            process.exit(0);
          });
          return;
        }
        
      } catch (error) {
        consecutiveSuccesses = 0;
        console.log(`❌ [${new Date().toLocaleTimeString()}] TCP Connection: FAILED (${error.message})`);
      }
      
    } catch (error) {
      console.log(`❌ [${new Date().toLocaleTimeString()}] DNS Resolution: FAILED (${error.message})`);
    }
  };
  
  // Initial check
  await checkStatus();
  
  // Check every 10 seconds
  const interval = setInterval(checkStatus, 10000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Monitoring stopped');
    clearInterval(interval);
    process.exit(0);
  });
}

console.log('🔧 RDS Modification Instructions:');
console.log('1. Go to: https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2');
console.log('2. Click: Databases → valve-test-db');
console.log('3. Click: "Modify" button');
console.log('4. Set: "Public access" = "Publicly accessible" = Yes');
console.log('5. Click: "Continue" → "Apply immediately" → "Modify DB instance"');
console.log('6. Wait for modification to complete (2-5 minutes)');
console.log('\nStarting monitoring in 5 seconds...\n');

setTimeout(monitorRDS, 5000);
