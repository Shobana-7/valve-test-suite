// Script to add sample valve data for testing auto-fill functionality
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleValveData() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    console.log('✅ Connected to database');

    // First, create a sample POP test header
    const reportNumber = `RPT-SAMPLE-${Date.now()}`;
    const [headerResult] = await connection.query(`
      INSERT INTO pop_test_headers (
        report_number, operator_id, operator_name, company,
        equipment_no, ref_no, test_medium, ambient_temp,
        test_date, next_test_date, master_pressure_gauge,
        calibration_cert, gauge_due_date, \`range\`,
        make_model, calibrate_company, remarks, status
      ) VALUES (
        ?, 1, 'Test Operator', 'Test Company',
        'SMAU 9220460', 'KSE-031025-01', 'Air', 25.0,
        '2024-01-15', '2026-07-15', 'Digital Gauge',
        'CAL-2024-001', '2025-01-15', '0-50 Bar',
        'Test Make Model', 'Test Calibration Co', 'Sample test data', 'approved'
      )
    `, [reportNumber]);

    const headerId = headerResult.insertId;
    console.log('✅ Created sample header with ID:', headerId);

    // Sample valve data to insert
    const sampleValves = [
      {
        serial_number: 'PSV-001',
        brand: 'Baitu',
        year_of_manufacture: '2023-06',
        material_type: 'Stainless Steel',
        model: 'DA20-C1',
        inlet_size: '1/2"MNPT-3/4"FNPT',
        outlet_size: '3/4"FNPT',
        coefficient_discharge: '1200nm3/h',
        set_pressure: 22.0,
        input_pressure: 23.0,
        pop_pressure: 22.5,
        reset_pressure: 20.8,
        pop_tolerance: '2.3%',
        reset_tolerance: '5.5%',
        pop_result: 'Passed',
        reset_result: 'Satisfactory',
        overall_result: 'Passed'
      },
      {
        serial_number: 'PSV-002',
        brand: 'Goetze',
        year_of_manufacture: '2024-03',
        material_type: 'Bronze',
        model: 'DA25-B1',
        inlet_size: '1.0"MNPT-1-1/4"FNPT',
        outlet_size: '1-1/4"FNPT',
        coefficient_discharge: '1500nm3/h',
        set_pressure: 25.0,
        input_pressure: 26.0,
        pop_pressure: 25.2,
        reset_pressure: 23.5,
        pop_tolerance: '0.8%',
        reset_tolerance: '6.0%',
        pop_result: 'Passed',
        reset_result: 'Satisfactory',
        overall_result: 'Passed'
      },
      {
        serial_number: 'PSV-003',
        brand: 'Herose',
        year_of_manufacture: '2024-09',
        material_type: 'GG',
        model: 'Herose-06388.1006',
        inlet_size: '1.0"MNPT-1-3/4"FNPT',
        outlet_size: '1-3/4"FNPT',
        coefficient_discharge: '1800nm3/h',
        set_pressure: 30.0,
        input_pressure: 31.0,
        pop_pressure: 30.5,
        reset_pressure: 28.2,
        pop_tolerance: '1.7%',
        reset_tolerance: '6.0%',
        pop_result: 'Passed',
        reset_result: 'Satisfactory',
        overall_result: 'Passed'
      }
    ];

    console.log('\n🔧 Adding sample valve data...');

    for (let i = 0; i < sampleValves.length; i++) {
      const valve = sampleValves[i];
      
      const [result] = await connection.query(`
        INSERT INTO pop_test_valves (
          header_id, valve_index, serial_number, brand, year_of_manufacture,
          material_type, model, inlet_size, outlet_size, coefficient_discharge,
          set_pressure, input_pressure, pop_pressure, reset_pressure,
          pop_tolerance, reset_tolerance, pop_result, reset_result, overall_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        headerId, i + 1, valve.serial_number, valve.brand, valve.year_of_manufacture,
        valve.material_type, valve.model, valve.inlet_size, valve.outlet_size,
        valve.coefficient_discharge, valve.set_pressure, valve.input_pressure,
        valve.pop_pressure, valve.reset_pressure, valve.pop_tolerance,
        valve.reset_tolerance, valve.pop_result, valve.reset_result, valve.overall_result
      ]);

      console.log(`✅ Added valve data for ${valve.serial_number} (${valve.brand} ${valve.model})`);
    }

    // Verify the data
    console.log('\n🔍 Verifying sample data...');
    const [valves] = await connection.query(`
      SELECT serial_number, brand, model, year_of_manufacture, material_type
      FROM pop_test_valves 
      WHERE header_id = ?
      ORDER BY valve_index
    `, [headerId]);

    console.log('Sample valve data added:');
    valves.forEach(valve => {
      console.log(`  - ${valve.serial_number}: ${valve.brand} ${valve.model} (${valve.year_of_manufacture}) - ${valve.material_type}`);
    });

    console.log('\n✅ Sample valve data added successfully!');
    console.log('\n🧪 Testing Instructions:');
    console.log('1. Go to: http://localhost:5173');
    console.log('2. Login: operator1 / operator123');
    console.log('3. New POP Test Report → Step 1: Enter equipment "SMAU 9220460"');
    console.log('4. Step 2: Select valve serials PSV-001, PSV-002, or PSV-003');
    console.log('5. Verify auto-fill works with previous valve data');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleValveData();
