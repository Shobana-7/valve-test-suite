# AWS RDS Import Script for PowerShell
param(
    [Parameter(Mandatory=$true)]
    [string]$RdsEndpoint,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$DatabaseName = "valve_test_suite"
$BackupFile = "valve_test_suite_backup_2025-10-03T16-36-31-817Z.sql"

Write-Host "🔄 Importing database to AWS RDS..." -ForegroundColor Blue
Write-Host "Endpoint: $RdsEndpoint" -ForegroundColor Green
Write-Host "Database: $DatabaseName" -ForegroundColor Green
Write-Host "Backup file: $BackupFile" -ForegroundColor Green

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Blue
$testScript = @"
const mysql=require('mysql2/promise');
(async()=>{
  try{
    const c=await mysql.createConnection({
      host:'$RdsEndpoint',
      user:'$Username',
      password:'$Password'
    });
    console.log('✅ Connection successful');
    await c.end();
  }catch(e){
    console.error('❌ Connection failed:',e.message);
    process.exit(1);
  }
})();
"@

node -e $testScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Connection test failed!" -ForegroundColor Red
    exit 1
}

# Import data
Write-Host "📥 Importing data..." -ForegroundColor Blue
$importScript = @"
const mysql=require('mysql2/promise');
const fs=require('fs');
(async()=>{
  try{
    const c=await mysql.createConnection({
      host:'$RdsEndpoint',
      user:'$Username',
      password:'$Password',
      multipleStatements:true
    });
    const sql=fs.readFileSync('$BackupFile','utf8');
    await c.query(sql);
    console.log('✅ Import completed successfully!');
    await c.end();
  }catch(e){
    console.error('❌ Import failed:',e.message);
    process.exit(1);
  }
})();
"@

node -e $importScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Import failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database import completed successfully!" -ForegroundColor Green
