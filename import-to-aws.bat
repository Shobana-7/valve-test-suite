@echo off
REM AWS RDS Import Script for Windows
REM Usage: import-to-aws.bat <RDS_ENDPOINT> <USERNAME> <PASSWORD>

if "%~3"=="" (
    echo Usage: %0 ^<RDS_ENDPOINT^> ^<USERNAME^> ^<PASSWORD^>
    echo Example: %0 valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com admin MyPassword123
    exit /b 1
)

set RDS_ENDPOINT=%1
set USERNAME=%2
set PASSWORD=%3
set DATABASE_NAME=valve_test_suite
set BACKUP_FILE=valve_test_suite_backup_2025-10-03T16-36-31-817Z.sql

echo 🔄 Importing database to AWS RDS...
echo Endpoint: %RDS_ENDPOINT%
echo Database: %DATABASE_NAME%
echo Backup file: %BACKUP_FILE%

REM Test connection using Node.js
echo 🔍 Testing connection...
node -e "const mysql=require('mysql2/promise');(async()=>{try{const c=await mysql.createConnection({host:'%RDS_ENDPOINT%',user:'%USERNAME%',password:'%PASSWORD%'});console.log('✅ Connection successful');await c.end();}catch(e){console.error('❌ Connection failed:',e.message);process.exit(1);}})();"

if errorlevel 1 (
    echo ❌ Connection test failed!
    exit /b 1
)

REM Import using Node.js
echo 📥 Importing data...
node -e "const mysql=require('mysql2/promise');const fs=require('fs');(async()=>{try{const c=await mysql.createConnection({host:'%RDS_ENDPOINT%',user:'%USERNAME%',password:'%PASSWORD%',multipleStatements:true});const sql=fs.readFileSync('%BACKUP_FILE%','utf8');await c.query(sql);console.log('✅ Import completed successfully!');await c.end();}catch(e){console.error('❌ Import failed:',e.message);process.exit(1);}})();"

if errorlevel 1 (
    echo ❌ Import failed!
    exit /b 1
)

echo ✅ Database import completed successfully!
