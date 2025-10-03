const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateToPOPTestSchema() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    console.log('🔗 Connected to database');
    console.log('🚀 Starting POP Test Schema Migration...\n');

    // 1. Create pop_test_headers table
    console.log('📋 Creating pop_test_headers table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pop_test_headers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_number VARCHAR(50) UNIQUE NOT NULL,
        operator_id INT NOT NULL,
        operator_name VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        
        -- Test Information
        equipment_no VARCHAR(100) NOT NULL,
        ref_no VARCHAR(50) NOT NULL,
        test_medium VARCHAR(50) DEFAULT 'N2',
        ambient_temp VARCHAR(50) DEFAULT '(23±5)°C',
        test_date DATE NOT NULL,
        next_test_date DATE,
        master_pressure_gauge VARCHAR(50) DEFAULT '22024750',
        calibration_cert VARCHAR(50) DEFAULT 'CMS-5009-24',
        gauge_due_date DATE,
        range_field VARCHAR(50) DEFAULT '(0~600) psi',
        make_model VARCHAR(100) DEFAULT 'Winter/PFP',
        calibrate_company VARCHAR(100) DEFAULT 'Caltek Pte Ltd',
        
        -- Additional Information
        remarks TEXT,
        attachments JSON,
        
        -- Status and Approval
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_report_number (report_number),
        INDEX idx_equipment_no (equipment_no),
        INDEX idx_ref_no (ref_no),
        INDEX idx_operator_id (operator_id),
        INDEX idx_status (status),
        INDEX idx_test_date (test_date)
      )
    `);
    console.log('✅ pop_test_headers table created');

    // 2. Create pop_test_valves table
    console.log('📋 Creating pop_test_valves table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pop_test_valves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        header_id INT NOT NULL,
        valve_index INT NOT NULL,
        
        -- Valve Identification
        serial_number VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        year_of_manufacture INT NOT NULL,
        material_type VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        
        -- Valve Specifications
        inlet_size VARCHAR(50) NOT NULL,
        outlet_size VARCHAR(50) NOT NULL,
        coefficient_discharge VARCHAR(50) NOT NULL,
        
        -- Test Pressures (in Bar)
        set_pressure DECIMAL(10, 2) NOT NULL,
        input_pressure DECIMAL(10, 2) NOT NULL,
        pop_pressure DECIMAL(10, 2) NOT NULL,
        reset_pressure DECIMAL(10, 2) NOT NULL,
        
        -- Calculated Results
        pop_tolerance VARCHAR(20),
        reset_tolerance VARCHAR(20),
        pop_result VARCHAR(20),
        reset_result VARCHAR(20),
        overall_result VARCHAR(20),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (header_id) REFERENCES pop_test_headers(id) ON DELETE CASCADE,
        INDEX idx_header_id (header_id),
        INDEX idx_serial_number (serial_number),
        INDEX idx_overall_result (overall_result)
      )
    `);
    console.log('✅ pop_test_valves table created');

    // 3. Create master data tables
    console.log('📋 Creating master data tables...');
    
    // Brands table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_name VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ valve_brands table created');

    // Models table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(100) NOT NULL,
        brand_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES valve_brands(id) ON DELETE SET NULL,
        INDEX idx_brand_id (brand_id)
      )
    `);
    console.log('✅ valve_models table created');

    // Materials table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_name VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ valve_materials table created');

    // IO Sizes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_io_sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inlet_size VARCHAR(50) NOT NULL,
        outlet_size VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_combination (inlet_size, outlet_size)
      )
    `);
    console.log('✅ valve_io_sizes table created');

    // Set Pressures table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_set_pressures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        set_pressure DECIMAL(10, 2) NOT NULL,
        input_pressure DECIMAL(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ valve_set_pressures table created');

    // Valve Serials table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS valve_serials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        equipment_no VARCHAR(100) NOT NULL,
        serial_number VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_serial (equipment_no, serial_number),
        INDEX idx_equipment_no (equipment_no)
      )
    `);
    console.log('✅ valve_serials table created');

    // 4. Insert sample master data
    console.log('\n📊 Inserting sample master data...');
    
    // Sample brands
    await connection.query(`
      INSERT IGNORE INTO valve_brands (brand_name) VALUES
      ('Crosby'),
      ('Anderson Greenwood'),
      ('Consolidated'),
      ('Farris'),
      ('Leser'),
      ('Spirax Sarco'),
      ('Emerson'),
      ('Pentair')
    `);
    console.log('✅ Sample brands inserted');

    // Sample materials
    await connection.query(`
      INSERT IGNORE INTO valve_materials (material_name) VALUES
      ('Stainless Steel'),
      ('Carbon Steel'),
      ('Bronze'),
      ('Brass'),
      ('Alloy Steel'),
      ('Inconel'),
      ('Hastelloy')
    `);
    console.log('✅ Sample materials inserted');

    // Sample IO sizes
    await connection.query(`
      INSERT IGNORE INTO valve_io_sizes (inlet_size, outlet_size) VALUES
      ('1/2 inch', '3/4 inch'),
      ('3/4 inch', '1 inch'),
      ('1 inch', '1.5 inch'),
      ('1 inch', '2 inch'),
      ('1.5 inch', '2 inch'),
      ('2 inch', '3 inch'),
      ('3 inch', '4 inch'),
      ('4 inch', '6 inch'),
      ('6 inch', '8 inch')
    `);
    console.log('✅ Sample IO sizes inserted');

    // Sample set pressures
    await connection.query(`
      INSERT IGNORE INTO valve_set_pressures (set_pressure, input_pressure) VALUES
      (15.0, 16.0),
      (20.0, 21.0),
      (22.0, 23.0),
      (25.0, 26.0),
      (30.0, 31.0),
      (35.0, 36.0),
      (40.0, 41.0),
      (50.0, 51.0)
    `);
    console.log('✅ Sample set pressures inserted');

    // Sample models for each brand
    const [brands] = await connection.query('SELECT id, brand_name FROM valve_brands');
    
    const modelsByBrand = {
      'Crosby': ['JOS-E', 'JBS-E', 'JLT-E', 'HB-E'],
      'Anderson Greenwood': ['Series 200', 'Series 300', 'Series 400', 'WC6'],
      'Consolidated': ['1900 Series', '1700 Series', '1500 Series'],
      'Farris': ['Series 2600', 'Series 2700', 'Series 3800'],
      'Leser': ['441', '442', '526', '527'],
      'Spirax Sarco': ['A40', 'A42', 'A46'],
      'Emerson': ['8900 Series', '8800 Series'],
      'Pentair': ['Crosby JOS', 'Crosby JBS']
    };

    for (const brand of brands) {
      const models = modelsByBrand[brand.brand_name] || ['Standard Model'];
      for (const model of models) {
        await connection.query(
          'INSERT IGNORE INTO valve_models (model_name, brand_id) VALUES (?, ?)',
          [model, brand.id]
        );
      }
    }
    console.log('✅ Sample models inserted');

    // Sample valve serials
    await connection.query(`
      INSERT IGNORE INTO valve_serials (equipment_no, serial_number) VALUES
      ('SMAU 9220460', 'PSV-001'),
      ('SMAU 9220460', 'PSV-002'),
      ('SMAU 9220460', 'PSV-003'),
      ('SMAU 9220461', 'PSV-101'),
      ('SMAU 9220461', 'PSV-102'),
      ('SMAU 9220462', 'PSV-201'),
      ('SMAU 9220462', 'PSV-202'),
      ('SMAU 9220462', 'PSV-203')
    `);
    console.log('✅ Sample valve serials inserted');

    console.log('\n🎉 POP Test Schema Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Created pop_test_headers table');
    console.log('✅ Created pop_test_valves table');
    console.log('✅ Created 5 master data tables');
    console.log('✅ Inserted sample data for testing');
    console.log('\n🔄 Next steps:');
    console.log('1. Update API routes (server/routes/reports.js)');
    console.log('2. Create master data routes');
    console.log('3. Test the new endpoints');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToPOPTestSchema()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToPOPTestSchema;
