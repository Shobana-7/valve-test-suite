// Simple test script to verify API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const testUser = {
  username: 'operator1',
  password: 'operator123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testMasterDataEndpoints() {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    console.log('\n📊 Testing Master Data Endpoints...');
    
    // Test brands
    console.log('🔍 Testing /api/master-data/brands');
    const brandsResponse = await axios.get(`${BASE_URL}/master-data/brands`, { headers });
    console.log('✅ Brands:', brandsResponse.data.data.length, 'items');
    
    // Test materials
    console.log('🔍 Testing /api/master-data/materials');
    const materialsResponse = await axios.get(`${BASE_URL}/master-data/materials`, { headers });
    console.log('✅ Materials:', materialsResponse.data.data.length, 'items');
    
    // Test models
    console.log('🔍 Testing /api/master-data/models');
    const modelsResponse = await axios.get(`${BASE_URL}/master-data/models`, { headers });
    console.log('✅ Models:', modelsResponse.data.data.length, 'items');
    
    // Test IO sizes
    console.log('🔍 Testing /api/master-data/io-sizes');
    const ioSizesResponse = await axios.get(`${BASE_URL}/master-data/io-sizes`, { headers });
    console.log('✅ IO Sizes:', ioSizesResponse.data.data.raw.length, 'combinations');
    
    // Test set pressures
    console.log('🔍 Testing /api/master-data/set-pressures');
    const setPressuresResponse = await axios.get(`${BASE_URL}/master-data/set-pressures`, { headers });
    console.log('✅ Set Pressures:', setPressuresResponse.data.data.length, 'items');
    
    // Test valve serials
    console.log('🔍 Testing /api/master-data/valve-serials?equipment_no=SMAU 9220460');
    const valveSerialsResponse = await axios.get(`${BASE_URL}/master-data/valve-serials?equipment_no=SMAU 9220460`, { headers });
    console.log('✅ Valve Serials:', valveSerialsResponse.data.data.length, 'items');
    
    return true;
  } catch (error) {
    console.error('❌ Master data test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPOPReportCreation() {
  const headers = { 
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('\n📝 Testing POP Report Creation...');
    
    const testReport = {
      equipment_no: "SMAU 9220460",
      ref_no: "KSE-031025-01",
      test_medium: "N2",
      ambient_temp: "(23±5)°C",
      test_date: "2025-10-03",
      next_test_date: "2028-03-30",
      master_pressure_gauge: "22024750",
      calibration_cert: "CMS-5009-24",
      gauge_due_date: "2025-10-01",
      range: "(0~600) psi",
      make_model: "Winter/PFP",
      calibrate_company: "Caltek Pte Ltd",
      remarks: "Test report created via API",
      valves: [
        {
          serial_number: "PSV-TEST-001",
          brand: "Crosby",
          year_of_manufacture: 2020,
          material_type: "Stainless Steel",
          model: "JOS-E",
          inlet_size: "2 inch",
          outlet_size: "3 inch",
          coefficient_discharge: "0.975",
          set_pressure: 22.0,
          input_pressure: 23.0,
          pop_pressure: 22.5,
          reset_pressure: 21.0,
          pop_tolerance: "2.3%",
          reset_tolerance: "4.5%",
          pop_result: "Passed",
          reset_result: "Satisfactory",
          overall_result: "Passed"
        },
        {
          serial_number: "PSV-TEST-002",
          brand: "Anderson Greenwood",
          year_of_manufacture: 2021,
          material_type: "Carbon Steel",
          model: "Series 200",
          inlet_size: "1 inch",
          outlet_size: "2 inch",
          coefficient_discharge: "0.965",
          set_pressure: 25.0,
          input_pressure: 26.0,
          pop_pressure: 26.0,
          reset_pressure: 22.0,
          pop_tolerance: "4.0%",
          reset_tolerance: "12.0%",
          pop_result: "Failed",
          reset_result: "Failed",
          overall_result: "Failed"
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/reports`, testReport, { headers });
    console.log('✅ POP Report created successfully');
    console.log('📋 Report ID:', response.data.reportId);
    console.log('📋 Report Number:', response.data.reportNumber);
    
    return response.data.reportId;
  } catch (error) {
    console.error('❌ POP Report creation failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    return null;
  }
}

async function testGetReports() {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    console.log('\n📋 Testing Get Reports...');
    
    const response = await axios.get(`${BASE_URL}/reports`, { headers });
    console.log('✅ Reports retrieved successfully');
    console.log('📊 Total reports:', response.data.count);
    
    // Show report types
    const reportTypes = {};
    response.data.reports.forEach(report => {
      const type = report.report_type || 'unknown';
      reportTypes[type] = (reportTypes[type] || 0) + 1;
    });
    
    console.log('📊 Report types:', reportTypes);
    
    return true;
  } catch (error) {
    console.error('❌ Get reports failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Tests failed - could not login');
    return;
  }
  
  // Step 2: Test master data endpoints
  const masterDataSuccess = await testMasterDataEndpoints();
  if (!masterDataSuccess) {
    console.log('❌ Master data tests failed');
    return;
  }
  
  // Step 3: Test POP report creation
  const reportId = await testPOPReportCreation();
  if (!reportId) {
    console.log('❌ POP report creation failed');
    return;
  }
  
  // Step 4: Test get reports
  const getReportsSuccess = await testGetReports();
  if (!getReportsSuccess) {
    console.log('❌ Get reports test failed');
    return;
  }
  
  console.log('\n🎉 All tests completed successfully!');
  console.log('\n✅ Summary:');
  console.log('  - Authentication: Working');
  console.log('  - Master Data APIs: Working');
  console.log('  - POP Report Creation: Working');
  console.log('  - Report Retrieval: Working');
  console.log('\n🔗 You can now test the frontend at: http://localhost:5173');
}

// Run tests
runTests().catch(console.error);
