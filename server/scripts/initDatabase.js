const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'valve_test_suite'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'valve_test_suite'}' created/verified`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'valve_test_suite'}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role ENUM('operator', 'admin', 'supervisor') NOT NULL DEFAULT 'operator',
        company VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);
    console.log('✅ Users table created');

    // Create test_reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_number VARCHAR(50) UNIQUE NOT NULL,
        operator_id INT NOT NULL,
        operator_name VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        
        valve_tag_number VARCHAR(100),
        valve_manufacturer VARCHAR(100),
        valve_model VARCHAR(100),
        valve_size VARCHAR(50),
        valve_type VARCHAR(100),
        set_pressure DECIMAL(10, 2),
        set_pressure_unit VARCHAR(20),
        
        test_date DATE NOT NULL,
        test_location VARCHAR(200),
        test_medium VARCHAR(100),
        test_temperature DECIMAL(10, 2),
        test_temperature_unit VARCHAR(20),
        
        opening_pressure DECIMAL(10, 2),
        closing_pressure DECIMAL(10, 2),
        seat_tightness VARCHAR(100),
        test_result ENUM('pass', 'fail', 'conditional') DEFAULT 'pass',
        
        remarks TEXT,
        attachments JSON,
        
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_report_number (report_number),
        INDEX idx_operator_id (operator_id),
        INDEX idx_status (status),
        INDEX idx_test_date (test_date)
      )
    `);
    console.log('✅ Test reports table created');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const operatorPassword = await bcrypt.hash('operator123', 10);
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);

    // Insert default users
    await connection.query(`
      INSERT IGNORE INTO users (username, password, name, email, role, company) VALUES
      ('admin', ?, 'System Administrator', 'admin@valvetest.com', 'admin', 'Valve Test Suite'),
      ('operator1', ?, 'John Operator', 'operator@valvetest.com', 'operator', 'ABC Company'),
      ('supervisor1', ?, 'Jane Supervisor', 'supervisor@valvetest.com', 'supervisor', 'ABC Company')
    `, [adminPassword, operatorPassword, supervisorPassword]);
    console.log('✅ Default users created');

    // Insert sample test reports
    const [users] = await connection.query('SELECT id, name, company FROM users WHERE username = ?', ['operator1']);
    
    if (users.length > 0) {
      const operator = users[0];
      const reportNumber1 = `RPT-${Date.now()}-1`;
      const reportNumber2 = `RPT-${Date.now()}-2`;
      
      await connection.query(`
        INSERT IGNORE INTO test_reports (
          report_number, operator_id, operator_name, company,
          valve_tag_number, valve_manufacturer, valve_model, valve_size, valve_type,
          set_pressure, set_pressure_unit,
          test_date, test_location, test_medium, test_temperature, test_temperature_unit,
          opening_pressure, closing_pressure, seat_tightness, test_result, remarks, status
        ) VALUES
        (?, ?, ?, ?, 'PSV-001', 'Crosby', 'JOS-E', '2x3', 'Spring Loaded', 150.0, 'PSI', '2025-09-25', 'Plant A', 'Steam', 350.0, 'F', 152.5, 145.0, 'Tight', 'pass', 'Test completed successfully', 'approved'),
        (?, ?, ?, ?, 'PSV-002', 'Anderson Greenwood', 'Series 200', '1x2', 'Pilot Operated', 200.0, 'PSI', '2025-09-28', 'Plant B', 'Air', 70.0, 'F', 202.0, 195.0, 'Tight', 'pass', 'Valve in good condition', 'pending')
      `, [reportNumber1, operator.id, operator.name, operator.company, reportNumber2, operator.id, operator.name, operator.company]);
      
      console.log('✅ Sample test reports created');
    }

    console.log('\n🎉 Database initialization completed successfully!\n');
    console.log('Default users created:');
    console.log('  Admin:      username: admin      password: admin123');
    console.log('  Operator:   username: operator1  password: operator123');
    console.log('  Supervisor: username: supervisor1 password: supervisor123\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();

