// Get your current public IP address for AWS security group configuration
const https = require('https');

function getPublicIP() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ipify.org',
      port: 443,
      path: '/',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data.trim());
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function showIPInfo() {
  console.log('🔍 Getting your public IP address for AWS security group...');
  
  try {
    const ip = await getPublicIP();
    console.log(`\n📍 Your Public IP: ${ip}`);
    console.log(`\n🛡️  Security Group Configuration:`);
    console.log(`   For Testing (less secure):`);
    console.log(`   - Source: 0.0.0.0/0`);
    console.log(`   - Description: Allow all IPs (testing only)`);
    console.log(`\n   For Production (more secure):`);
    console.log(`   - Source: ${ip}/32`);
    console.log(`   - Description: Allow only your IP`);
    
    console.log(`\n🔧 AWS Console Steps:`);
    console.log(`1. Go to: https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2`);
    console.log(`2. Click: Databases → valve-test-db`);
    console.log(`3. Click: Connectivity & security tab`);
    console.log(`4. Click: Security Group link`);
    console.log(`5. Click: Edit inbound rules`);
    console.log(`6. Add rule:`);
    console.log(`   - Type: MySQL/Aurora`);
    console.log(`   - Port: 3306`);
    console.log(`   - Source: 0.0.0.0/0 (for testing) or ${ip}/32 (for production)`);
    console.log(`7. Save rules`);
    
    console.log(`\n✅ After fixing security group, test with:`);
    console.log(`   node test-rds-connection-simple.js`);
    
  } catch (error) {
    console.error('❌ Failed to get IP:', error.message);
    console.log('\n💡 Alternative ways to get your IP:');
    console.log('1. Visit: https://whatismyipaddress.com/');
    console.log('2. Google: "what is my ip"');
    console.log('3. Command: curl ifconfig.me');
  }
}

showIPInfo();
