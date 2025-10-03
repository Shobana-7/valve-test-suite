// Script to export local database for AWS RDS migration
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
require('dotenv').config();

const execAsync = util.promisify(exec);

async function exportLocalDatabase() {
  console.log('🔄 Starting local database export for AWS RDS migration...');
  
  try {
    // Database connection details
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    };

    console.log(`📊 Connecting to local database: ${dbConfig.database}`);
    
    // Test connection first
    const connection = await mysql.createConnection(dbConfig);
    
    // Get database statistics
    console.log('\n📈 Database Statistics:');
    
    const [tables] = await connection.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_rows DESC
    `, [dbConfig.database]);
    
    console.log('Tables and row counts:');
    tables.forEach(table => {
      console.log(`  ${table.table_name}: ${table.table_rows} rows (${table.size_mb} MB)`);
    });
    
    // Get total database size
    const [dbSize] = await connection.query(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'total_size_mb'
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [dbConfig.database]);
    
    console.log(`\n💾 Total database size: ${dbSize[0].total_size_mb} MB`);
    
    await connection.end();
    
    // Export database using mysqldump
    console.log('\n🔄 Exporting database with mysqldump...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `valve_test_suite_backup_${timestamp}.sql`;
    const schemaFile = `valve_test_suite_schema_${timestamp}.sql`;
    
    // Full backup with data
    const dumpCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} --routines --triggers --single-transaction --lock-tables=false ${dbConfig.database}`;
    
    console.log('Creating full backup...');
    const { stdout: fullBackup } = await execAsync(dumpCommand);
    await fs.writeFile(backupFile, fullBackup);
    console.log(`✅ Full backup saved: ${backupFile}`);
    
    // Schema only backup
    const schemaCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} --no-data --routines --triggers ${dbConfig.database}`;
    
    console.log('Creating schema backup...');
    const { stdout: schemaBackup } = await execAsync(schemaCommand);
    await fs.writeFile(schemaFile, schemaBackup);
    console.log(`✅ Schema backup saved: ${schemaFile}`);
    
    // Create AWS-compatible version (remove DEFINER statements)
    console.log('Creating AWS-compatible version...');
    const awsCompatibleFile = `valve_test_suite_aws_${timestamp}.sql`;
    const awsCompatibleContent = fullBackup.replace(/DEFINER=[^*]*\*/g, '*');
    await fs.writeFile(awsCompatibleFile, awsCompatibleContent);
    console.log(`✅ AWS-compatible backup saved: ${awsCompatibleFile}`);
    
    // Create environment template for AWS
    const envTemplate = `# AWS RDS Configuration Template
# Replace the endpoint with your actual RDS endpoint
DB_HOST=valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=valve_test_suite

# SSL Configuration (recommended for production)
DB_SSL=true
DB_SSL_CA=rds-ca-2019-root.pem

# Original local configuration (backup)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=valve_test_suite
`;
    
    await fs.writeFile('.env.aws-template', envTemplate);
    console.log('✅ AWS environment template saved: .env.aws-template');
    
    // Create import script
    const importScript = `#!/bin/bash
# AWS RDS Import Script
# Usage: ./import-to-aws.sh <RDS_ENDPOINT> <USERNAME> <PASSWORD>

if [ $# -ne 3 ]; then
    echo "Usage: $0 <RDS_ENDPOINT> <USERNAME> <PASSWORD>"
    echo "Example: $0 valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com admin MyPassword123"
    exit 1
fi

RDS_ENDPOINT=$1
USERNAME=$2
PASSWORD=$3
DATABASE_NAME="valve_test_suite"
BACKUP_FILE="${awsCompatibleFile}"

echo "🔄 Importing database to AWS RDS..."
echo "Endpoint: $RDS_ENDPOINT"
echo "Database: $DATABASE_NAME"
echo "Backup file: $BACKUP_FILE"

# Test connection
echo "🔍 Testing connection..."
mysql -h $RDS_ENDPOINT -u $USERNAME -p$PASSWORD -e "SELECT VERSION();" || {
    echo "❌ Connection failed!"
    exit 1
}

# Create database
echo "📝 Creating database..."
mysql -h $RDS_ENDPOINT -u $USERNAME -p$PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;"

# Import data
echo "📥 Importing data..."
mysql -h $RDS_ENDPOINT -u $USERNAME -p$PASSWORD $DATABASE_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Import completed successfully!"
    
    # Verify import
    echo "🔍 Verifying import..."
    mysql -h $RDS_ENDPOINT -u $USERNAME -p$PASSWORD $DATABASE_NAME -e "
        SELECT 
            table_name,
            table_rows
        FROM information_schema.tables 
        WHERE table_schema = '$DATABASE_NAME'
        ORDER BY table_rows DESC;
    "
else
    echo "❌ Import failed!"
    exit 1
fi
`;
    
    await fs.writeFile('import-to-aws.sh', importScript);
    console.log('✅ Import script saved: import-to-aws.sh');
    
    // Make import script executable (on Unix systems)
    try {
      await execAsync('chmod +x import-to-aws.sh');
    } catch (error) {
      console.log('ℹ️  Note: Run "chmod +x import-to-aws.sh" to make the script executable');
    }
    
    console.log('\n🎉 Database export completed successfully!');
    console.log('\n📋 Files created:');
    console.log(`  📄 ${backupFile} - Full database backup`);
    console.log(`  📄 ${schemaFile} - Schema only backup`);
    console.log(`  📄 ${awsCompatibleFile} - AWS-compatible backup`);
    console.log(`  📄 .env.aws-template - Environment configuration template`);
    console.log(`  📄 import-to-aws.sh - Import script for AWS RDS`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Create AWS RDS MySQL instance');
    console.log('2. Update .env.aws-template with your RDS endpoint');
    console.log('3. Run: ./import-to-aws.sh <RDS_ENDPOINT> <USERNAME> <PASSWORD>');
    console.log('4. Update your application .env file');
    console.log('5. Test application connectivity');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
exportLocalDatabase();
