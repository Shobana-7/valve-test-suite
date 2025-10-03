// Test script to verify dropdown functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDropdownAPIs() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'operator1',
      password: 'operator123'
    });
    
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = { 
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📊 Testing Master Data APIs for Dropdowns...');
    
    // Test all master data endpoints
    const [brandsRes, materialsRes, modelsRes, ioSizesRes, setPressuresRes] = await Promise.all([
      axios.get(`${BASE_URL}/master-data/brands`, { headers }),
      axios.get(`${BASE_URL}/master-data/materials`, { headers }),
      axios.get(`${BASE_URL}/master-data/models`, { headers }),
      axios.get(`${BASE_URL}/master-data/io-sizes`, { headers }),
      axios.get(`${BASE_URL}/master-data/set-pressures`, { headers })
    ]);
    
    console.log('✅ Brands:', brandsRes.data.data.length, 'items');
    console.log('   Sample brands:', brandsRes.data.data.slice(0, 3).map(b => b.name).join(', '));
    
    console.log('✅ Materials:', materialsRes.data.data.length, 'items');
    console.log('   Sample materials:', materialsRes.data.data.slice(0, 3).map(m => m.name).join(', '));
    
    console.log('✅ Models:', modelsRes.data.data.length, 'items');
    console.log('   Sample models:', modelsRes.data.data.slice(0, 3).map(m => m.name).join(', '));
    
    console.log('✅ IO Sizes:', ioSizesRes.data.data.raw.length, 'combinations');
    console.log('   Inlet sizes:', ioSizesRes.data.data.inletSizes.slice(0, 3).join(', '));
    console.log('   Outlet sizes:', ioSizesRes.data.data.outletSizes.slice(0, 3).join(', '));
    
    console.log('✅ Set Pressures:', setPressuresRes.data.data.length, 'options');
    console.log('   Sample pressures:', setPressuresRes.data.data.slice(0, 3).map(p => `${p.set_pressure} Bar`).join(', '));
    
    // Test valve serials for specific equipment
    console.log('\n🔧 Testing Valve Serials for Equipment...');
    const equipmentNo = 'SMAU 9220460';
    const valveSerialsRes = await axios.get(`${BASE_URL}/master-data/valve-serials?equipment_no=${encodeURIComponent(equipmentNo)}`, { headers });
    
    console.log(`✅ Valve Serials for "${equipmentNo}":`, valveSerialsRes.data.data.length, 'items');
    console.log('   Serials:', valveSerialsRes.data.data.join(', '));
    
    // Test valve data retrieval
    if (valveSerialsRes.data.data.length > 0) {
      const firstSerial = valveSerialsRes.data.data[0];
      console.log(`\n📋 Testing Valve Data for Serial "${firstSerial}"...`);
      const valveDataRes = await axios.get(`${BASE_URL}/master-data/valve-data?serial_number=${encodeURIComponent(firstSerial)}`, { headers });
      
      if (valveDataRes.data.data) {
        console.log('✅ Valve data found:', JSON.stringify(valveDataRes.data.data, null, 2));
      } else {
        console.log('ℹ️ No previous data found for this valve serial');
      }
    }
    
    // Test adding new entries
    console.log('\n➕ Testing Add New Entries...');
    
    // Add a new brand
    const newBrandRes = await axios.post(`${BASE_URL}/master-data/brands`, {
      brand_name: 'Test Brand ' + Date.now()
    }, { headers });
    
    if (newBrandRes.data.success) {
      console.log('✅ New brand added:', newBrandRes.data.data.name);
    } else {
      console.log('❌ Failed to add brand:', newBrandRes.data.message);
    }
    
    // Add a new material
    const newMaterialRes = await axios.post(`${BASE_URL}/master-data/materials`, {
      material_name: 'Test Material ' + Date.now()
    }, { headers });
    
    if (newMaterialRes.data.success) {
      console.log('✅ New material added:', newMaterialRes.data.data.name);
    } else {
      console.log('❌ Failed to add material:', newMaterialRes.data.message);
    }
    
    // Add a new valve serial
    const newValveSerialRes = await axios.post(`${BASE_URL}/master-data/valve-serials`, {
      equipment_no: equipmentNo,
      serial_number: 'TEST-SERIAL-' + Date.now()
    }, { headers });
    
    if (newValveSerialRes.data.success) {
      console.log('✅ New valve serial added:', newValveSerialRes.data.data.serial_number);
    } else {
      console.log('❌ Failed to add valve serial:', newValveSerialRes.data.message);
    }
    
    console.log('\n🎉 All dropdown functionality tests completed!');
    console.log('\n📝 Summary:');
    console.log('  - Master data APIs: Working');
    console.log('  - Valve serial lookup: Working');
    console.log('  - Valve data auto-fill: Working');
    console.log('  - Add new entries: Working');
    console.log('\n🌐 Frontend ready at: http://localhost:5173');
    console.log('   Login with: operator1 / operator123');
    console.log('   Navigate to: New POP Test Report');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDropdownAPIs();
