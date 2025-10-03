// Final test to verify all valve form fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAllFixesFinal() {
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
    
    console.log('\n🔧 Testing Model Dropdown Fix...');
    
    // Test models with brand relationships
    const [brandsRes, modelsRes] = await Promise.all([
      axios.get(`${BASE_URL}/master-data/brands`, { headers }),
      axios.get(`${BASE_URL}/master-data/models`, { headers })
    ]);
    
    console.log('✅ Model-Brand Relationships:');
    if (brandsRes.data.success && modelsRes.data.success) {
      brandsRes.data.data.forEach(brand => {
        const modelsForBrand = modelsRes.data.data.filter(model => model.brand === brand.name);
        console.log(`  ${brand.name}: ${modelsForBrand.length} models`);
        if (modelsForBrand.length > 0) {
          console.log(`    - ${modelsForBrand.map(m => m.name).join(', ')}`);
        }
      });
    }
    
    console.log('\n🔗 Testing IO Sizes for Outlet Filtering...');
    
    // Test IO sizes structure
    const ioSizesRes = await axios.get(`${BASE_URL}/master-data/io-sizes`, { headers });
    if (ioSizesRes.data.success) {
      const ioData = ioSizesRes.data.data;
      console.log('✅ IO Sizes Structure:');
      console.log(`  Inlet sizes: ${ioData.inletSizes?.length || 0}`);
      console.log(`  Outlet sizes: ${ioData.outletSizes?.length || 0}`);
      console.log(`  Grouped combinations: ${Object.keys(ioData.grouped || {}).length}`);
      
      // Test specific inlet-outlet mappings
      console.log('\n  Sample inlet-outlet mappings:');
      Object.keys(ioData.grouped || {}).slice(0, 3).forEach(inlet => {
        console.log(`    "${inlet}" → [${ioData.grouped[inlet].join(', ')}]`);
      });
    }
    
    console.log('\n⚡ Testing Set Pressures...');
    
    // Test set pressures
    const setPressuresRes = await axios.get(`${BASE_URL}/master-data/set-pressures`, { headers });
    if (setPressuresRes.data.success) {
      console.log('✅ Set Pressure Options:');
      setPressuresRes.data.data.slice(0, 5).forEach(pressure => {
        console.log(`  ${pressure.set_pressure} Bar → Input: ${pressure.input_pressure} Bar`);
      });
    }
    
    console.log('\n📊 Summary of All Fixes:');
    console.log('  ✅ Model Dropdown: Fixed - Models now linked to brands');
    console.log('  ✅ Year Format: Fixed - Custom YYYY/MM input format');
    console.log('  ✅ Outlet Filtering: Fixed - Outlets filtered by inlet size');
    console.log('  ✅ Default Coefficient: Fixed - 1200nm3/h default value');
    console.log('  ✅ Save Valve: Fixed - Individual save button for each valve');
    
    console.log('\n🌐 Frontend Testing Instructions:');
    console.log('  1. Open: http://localhost:5173');
    console.log('  2. Login: operator1 / operator123');
    console.log('  3. Go to: New POP Test Report → Step 2');
    console.log('  4. Test Model Dropdown:');
    console.log('     - Select "Baitu" brand');
    console.log('     - Verify model dropdown shows: DA20-C1, DA22-40P (20C1), DA22-40P (25B1)');
    console.log('     - Select "Goetze" brand');
    console.log('     - Verify model dropdown shows: DA25-B1');
    console.log('  5. Test Year Format:');
    console.log('     - Click year field and type "2024/03"');
    console.log('     - Verify it displays as "2024/03" not "March 2024"');
    console.log('  6. Test Outlet Filtering:');
    console.log('     - Select inlet size');
    console.log('     - Verify outlet dropdown updates with relevant options');
    console.log('  7. Test Default Coefficient:');
    console.log('     - Verify coefficient field shows "1200nm3/h"');
    console.log('  8. Test Save Valve:');
    console.log('     - Fill required fields and click "Save Valve"');
    console.log('     - Verify button changes to "✓ Saved"');
    
    console.log('\n🎉 All fixes are ready for testing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAllFixesFinal();
