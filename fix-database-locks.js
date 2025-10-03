// Fix database lock issues and test report creation
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseLocks() {
  console.log('🔧 Fixing database lock issues...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Check current processes
    console.log('\n🔍 Checking active processes...');
    const [processes] = await connection.query('SHOW PROCESSLIST');
    
    console.log(`Found ${processes.length} processes:`);
    processes.forEach(proc => {
      if (proc.Command !== 'Sleep') {
        console.log(`  Process ${proc.Id}: ${proc.User}@${proc.Host} - ${proc.Command} (${proc.Time}s)`);
        if (proc.Info) {
          console.log(`    Query: ${proc.Info.substring(0, 100)}...`);
        }
      }
    });

    // Kill any long-running processes from our user
    console.log('\n🔄 Checking for long-running processes...');
    const longRunning = processes.filter(p => 
      p.User === process.env.DB_USER && 
      p.Command !== 'Sleep' && 
      p.Time > 10 &&
      p.Id !== connection.threadId
    );

    if (longRunning.length > 0) {
      console.log(`⚠️  Found ${longRunning.length} long-running processes. Killing them...`);
      for (const proc of longRunning) {
        try {
          await connection.query(`KILL ${proc.Id}`);
          console.log(`  ✅ Killed process ${proc.Id}`);
        } catch (error) {
          console.log(`  ❌ Failed to kill process ${proc.Id}: ${error.message}`);
        }
      }
    } else {
      console.log('  ✅ No long-running processes found');
    }

    // Check table locks
    console.log('\n🔒 Checking table locks...');
    try {
      const [locks] = await connection.query('SHOW OPEN TABLES WHERE In_use > 0');
      if (locks.length === 0) {
        console.log('  ✅ No locked tables');
      } else {
        console.log(`  ⚠️  Found ${locks.length} locked tables:`);
        locks.forEach(lock => {
          console.log(`    ${lock.Database}.${lock.Table} - In use: ${lock.In_use}`);
        });
      }
    } catch (error) {
      console.log(`  ⚠️  Could not check table locks: ${error.message}`);
    }

    // Test a simple insert to check if locks are cleared
    console.log('\n🧪 Testing database write operations...');
    
    try {
      // Test transaction
      await connection.beginTransaction();
      
      // Try to insert a test record
      const testReportNumber = `TEST-${Date.now()}`;
      await connection.query(
        `INSERT INTO pop_test_headers (
          report_number, operator_id, operator_name, company,
          equipment_no, ref_no, test_medium, ambient_temp,
          test_date, next_test_date, master_pressure_gauge,
          calibration_cert, gauge_due_date, \`range\`,
          make_model, calibrate_company, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testReportNumber, 1, 'Test User', 'Test Company',
          'TEST-EQUIP', 'KSE-031025-99', 'N2', '(23±5)°C',
          '2025-10-03', '2028-04-03', 'TEST-GAUGE',
          'TEST-CERT', '2025-10-01', '(0~600) psi',
          'Test/Model', 'Test Company', 'Test insert'
        ]
      );
      
      // Rollback the test transaction
      await connection.rollback();
      console.log('  ✅ Database write test successful');
      
    } catch (error) {
      await connection.rollback();
      console.log(`  ❌ Database write test failed: ${error.message}`);
      
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        console.log('  🚨 Lock timeout still occurring. Trying to fix...');
        
        // Try to unlock tables
        try {
          await connection.query('UNLOCK TABLES');
          console.log('  ✅ Tables unlocked');
        } catch (unlockError) {
          console.log(`  ⚠️  Could not unlock tables: ${unlockError.message}`);
        }
      }
    }

    // Check innodb status for more details
    console.log('\n📊 Checking InnoDB status...');
    try {
      const [status] = await connection.query('SHOW ENGINE INNODB STATUS');
      const statusText = status[0].Status;
      
      // Look for deadlock information
      if (statusText.includes('DEADLOCK')) {
        console.log('  ⚠️  Deadlock detected in InnoDB status');
        const deadlockSection = statusText.split('LATEST DETECTED DEADLOCK')[1];
        if (deadlockSection) {
          console.log('  Deadlock details:', deadlockSection.substring(0, 500) + '...');
        }
      } else {
        console.log('  ✅ No deadlocks detected');
      }
      
      // Look for lock waits
      if (statusText.includes('LOCK WAIT')) {
        console.log('  ⚠️  Lock waits detected');
      } else {
        console.log('  ✅ No lock waits');
      }
      
    } catch (error) {
      console.log(`  ⚠️  Could not check InnoDB status: ${error.message}`);
    }

    await connection.end();
    
    console.log('\n🎯 Summary:');
    console.log('1. Killed any long-running processes');
    console.log('2. Checked for table locks');
    console.log('3. Tested database write operations');
    console.log('4. Checked InnoDB status');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the Node.js server to reset connection pool');
    console.log('2. Try submitting the report again');
    console.log('3. If issue persists, check application transaction handling');

  } catch (error) {
    console.error('❌ Error fixing database locks:', error.message);
  }
}

// Also create a simple test report function
async function testReportCreation() {
  console.log('\n🧪 Testing report creation directly...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await connection.beginTransaction();

    const reportNumber = `TEST-${Date.now()}`;
    const [headerResult] = await connection.query(
      `INSERT INTO pop_test_headers (
        report_number, operator_id, operator_name, company,
        equipment_no, ref_no, test_medium, ambient_temp,
        test_date, next_test_date, master_pressure_gauge,
        calibration_cert, gauge_due_date, \`range\`,
        make_model, calibrate_company, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportNumber, 2, 'Test Operator', 'KryoServe Engineering Pte Ltd',
        'TEST-001', 'KSE-031025-99', 'N2', '(23±5)°C',
        '2025-10-03', '2028-04-03', '22024750',
        'CMS-5009-24', '2025-10-01', '(0~600) psi',
        'Winter/PFP', 'Caltek Pte Ltd', 'Test report'
      ]
    );

    const headerId = headerResult.insertId;

    // Insert test valve
    await connection.query(
      `INSERT INTO pop_test_valves (
        header_id, valve_index,
        serial_number, brand, year_of_manufacture, material_type, model,
        inlet_size, outlet_size, coefficient_discharge,
        set_pressure, input_pressure, pop_pressure, reset_pressure,
        pop_tolerance, reset_tolerance, pop_result, reset_result, overall_result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        headerId, 1,
        'TEST-VALVE-001', 'Baitu', '2024/01', 'Stainless Steel', 'DA20-C1',
        '1"', '1"', '1200nm3/h',
        22.0, 23.0, 22.5, 21.8,
        '2.3%', '0.9%', 'Passed', 'Satisfactory', 'Passed'
      ]
    );

    await connection.commit();
    console.log(`✅ Test report created successfully with ID: ${headerId}`);
    
    // Clean up test data
    await connection.query('DELETE FROM pop_test_valves WHERE header_id = ?', [headerId]);
    await connection.query('DELETE FROM pop_test_headers WHERE id = ?', [headerId]);
    console.log('✅ Test data cleaned up');

    await connection.end();

  } catch (error) {
    console.error('❌ Test report creation failed:', error.message);
    if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
      console.log('🚨 Lock timeout confirmed - database has locking issues');
    }
  }
}

// Run both functions
async function runDiagnostics() {
  await fixDatabaseLocks();
  await testReportCreation();
}

runDiagnostics();
