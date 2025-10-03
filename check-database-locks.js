// Check for database locks and active transactions
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseLocks() {
  console.log('🔍 Checking database locks and transactions...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Check for active transactions
    console.log('\n📊 Active Transactions:');
    const [transactions] = await connection.query(`
      SELECT 
        trx_id,
        trx_state,
        trx_started,
        trx_requested_lock_id,
        trx_wait_started,
        trx_weight,
        trx_mysql_thread_id,
        trx_query
      FROM information_schema.innodb_trx
    `);
    
    if (transactions.length === 0) {
      console.log('  ✅ No active transactions');
    } else {
      transactions.forEach((trx, index) => {
        console.log(`  Transaction ${index + 1}:`);
        console.log(`    ID: ${trx.trx_id}`);
        console.log(`    State: ${trx.trx_state}`);
        console.log(`    Started: ${trx.trx_started}`);
        console.log(`    Thread ID: ${trx.trx_mysql_thread_id}`);
        console.log(`    Query: ${trx.trx_query || 'None'}`);
      });
    }

    // Check for locks
    console.log('\n🔒 Active Locks:');
    const [locks] = await connection.query(`
      SELECT 
        lock_id,
        lock_trx_id,
        lock_mode,
        lock_type,
        lock_table,
        lock_index,
        lock_space,
        lock_page,
        lock_rec,
        lock_data
      FROM information_schema.innodb_locks
    `);
    
    if (locks.length === 0) {
      console.log('  ✅ No active locks');
    } else {
      locks.forEach((lock, index) => {
        console.log(`  Lock ${index + 1}:`);
        console.log(`    ID: ${lock.lock_id}`);
        console.log(`    Transaction: ${lock.lock_trx_id}`);
        console.log(`    Mode: ${lock.lock_mode}`);
        console.log(`    Table: ${lock.lock_table}`);
        console.log(`    Data: ${lock.lock_data}`);
      });
    }

    // Check for lock waits
    console.log('\n⏳ Lock Waits:');
    const [lockWaits] = await connection.query(`
      SELECT 
        requesting_trx_id,
        requested_lock_id,
        blocking_trx_id,
        blocking_lock_id
      FROM information_schema.innodb_lock_waits
    `);
    
    if (lockWaits.length === 0) {
      console.log('  ✅ No lock waits');
    } else {
      lockWaits.forEach((wait, index) => {
        console.log(`  Lock Wait ${index + 1}:`);
        console.log(`    Requesting: ${wait.requesting_trx_id}`);
        console.log(`    Blocking: ${wait.blocking_trx_id}`);
      });
    }

    // Check process list
    console.log('\n🔄 Active Processes:');
    const [processes] = await connection.query('SHOW PROCESSLIST');
    
    const activeProcesses = processes.filter(p => p.Command !== 'Sleep');
    if (activeProcesses.length === 0) {
      console.log('  ✅ No active processes (besides current)');
    } else {
      activeProcesses.forEach((proc, index) => {
        console.log(`  Process ${index + 1}:`);
        console.log(`    ID: ${proc.Id}`);
        console.log(`    User: ${proc.User}`);
        console.log(`    Command: ${proc.Command}`);
        console.log(`    Time: ${proc.Time}s`);
        console.log(`    State: ${proc.State || 'None'}`);
        console.log(`    Info: ${proc.Info || 'None'}`);
      });
    }

    // Check table status
    console.log('\n📋 Table Status:');
    const [tableStatus] = await connection.query(`
      SHOW TABLE STATUS FROM ${process.env.DB_NAME} 
      WHERE Name IN ('pop_test_headers', 'pop_test_valves', 'valve_serials')
    `);
    
    tableStatus.forEach(table => {
      console.log(`  ${table.Name}:`);
      console.log(`    Engine: ${table.Engine}`);
      console.log(`    Rows: ${table.Rows}`);
      console.log(`    Auto_increment: ${table.Auto_increment}`);
    });

    // Kill any long-running transactions if needed
    console.log('\n🔧 Checking for long-running transactions...');
    const [longRunning] = await connection.query(`
      SELECT 
        Id, User, Host, db, Command, Time, State, Info
      FROM information_schema.processlist 
      WHERE Command != 'Sleep' 
      AND Time > 30
      AND User = ?
    `, [process.env.DB_USER]);

    if (longRunning.length > 0) {
      console.log('  ⚠️  Found long-running processes:');
      longRunning.forEach(proc => {
        console.log(`    Process ${proc.Id}: ${proc.Command} (${proc.Time}s)`);
      });
      
      console.log('\n💡 To kill long-running processes, run:');
      longRunning.forEach(proc => {
        console.log(`    KILL ${proc.Id};`);
      });
    } else {
      console.log('  ✅ No long-running transactions');
    }

    await connection.end();
    
    console.log('\n🎯 Recommendations:');
    console.log('1. If there are active transactions, they may be causing locks');
    console.log('2. Check application code for uncommitted transactions');
    console.log('3. Consider restarting the database connection pool');
    console.log('4. Monitor for deadlocks in application logs');

  } catch (error) {
    console.error('❌ Error checking database locks:', error.message);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      console.log('\n💡 Note: Some information_schema tables require additional privileges');
      console.log('Try running basic checks instead...');
      
      // Basic connection test
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        });
        
        const [result] = await connection.query('SELECT 1 as test');
        console.log('✅ Basic database connection works');
        
        await connection.end();
      } catch (basicError) {
        console.error('❌ Basic database connection failed:', basicError.message);
      }
    }
  }
}

checkDatabaseLocks();
