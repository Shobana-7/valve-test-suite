// Test report submission to verify the fix
const axios = require('axios');

async function testReportSubmission() {
  console.log('🧪 Testing POP test report submission...');
  
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'operator1',
      password: 'operator123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Prepare test report data
    const reportData = {
      equipment_no: 'TEST-SUBMIT-001',
      ref_no: 'KSE-031025-99',
      test_medium: 'N2',
      ambient_temp: '(23±5)°C',
      test_date: '2025-10-03',
      next_test_date: '2028-04-03',
      master_pressure_gauge: '22024750',
      calibration_cert: 'CMS-5009-24',
      gauge_due_date: '2025-10-01',
      range: '(0~600) psi',
      make_model: 'Winter/PFP',
      calibrate_company: 'Caltek Pte Ltd',
      remarks: 'Test submission after lock fix',
      valves: [
        {
          serial_number: 'TEST-VALVE-001',
          brand: 'Baitu',
          year_of_manufacture: '2024/01',
          material_type: 'Stainless Steel',
          model: 'DA20-C1',
          inlet_size: '1"',
          outlet_size: '1"',
          coefficient_discharge: '1200nm3/h',
          set_pressure: 22.0,
          input_pressure: 23.0,
          pop_pressure: 22.5,
          reset_pressure: 21.8,
          pop_tolerance: '2.3%',
          reset_tolerance: '0.9%',
          pop_result: 'Passed',
          reset_result: 'Satisfactory',
          overall_result: 'Passed'
        },
        {
          serial_number: 'TEST-VALVE-002',
          brand: 'Goetze',
          year_of_manufacture: '2024/03',
          material_type: 'Bronze',
          model: 'DA25-B1',
          inlet_size: '1.5"',
          outlet_size: '1.5"',
          coefficient_discharge: '1500nm3/h',
          set_pressure: 25.0,
          input_pressure: 26.0,
          pop_pressure: 25.3,
          reset_pressure: 24.7,
          pop_tolerance: '1.2%',
          reset_tolerance: '1.2%',
          pop_result: 'Passed',
          reset_result: 'Satisfactory',
          overall_result: 'Passed'
        }
      ]
    };
    
    // Submit the report
    console.log('📤 Submitting test report...');
    const submitResponse = await axios.post(
      'http://localhost:5000/api/reports',
      reportData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('✅ Report submission successful!');
    console.log(`📊 Report ID: ${submitResponse.data.reportId}`);
    console.log(`📋 Report Number: ${submitResponse.data.reportNumber}`);
    
    // Verify the report was created by fetching it
    console.log('🔍 Verifying report creation...');
    const reportId = submitResponse.data.reportId;
    
    const fetchResponse = await axios.get(
      `http://localhost:5000/api/reports/${reportId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const report = fetchResponse.data.report;
    console.log('✅ Report verification successful!');
    console.log(`📋 Equipment No: ${report.equipment_no}`);
    console.log(`📋 Ref No: ${report.ref_no}`);
    console.log(`📋 Valves: ${report.valves ? report.valves.length : 0}`);
    
    if (report.valves && report.valves.length > 0) {
      report.valves.forEach((valve, index) => {
        console.log(`  Valve ${index + 1}: ${valve.serial_number} (${valve.overall_result})`);
      });
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('✅ Database lock issue has been resolved');
    console.log('✅ Report submission is working correctly');
    console.log('✅ Users can now submit POP test reports');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('🚨 Request timeout - server may be slow or unresponsive');
    } else if (error.response) {
      console.log(`🚨 Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.message?.includes('Lock wait timeout')) {
        console.log('🚨 Lock timeout still occurring - may need database restart');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Cannot connect to server - ensure backend is running on port 5000');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend server is running: npm run dev');
    console.log('2. Check server logs for errors');
    console.log('3. Verify database connection is working');
    console.log('4. If lock timeout persists, restart MySQL service');
  }
}

testReportSubmission();
