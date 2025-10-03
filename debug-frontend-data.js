// Debug script to check frontend data loading
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugFrontendData() {
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
    
    console.log('\n🔍 Testing All Master Data APIs...');
    
    // Test all endpoints that the frontend calls
    const [brandsRes, materialsRes, modelsRes, ioSizesRes, setPressuresRes] = await Promise.all([
      axios.get(`${BASE_URL}/master-data/brands`, { headers }),
      axios.get(`${BASE_URL}/master-data/materials`, { headers }),
      axios.get(`${BASE_URL}/master-data/models`, { headers }),
      axios.get(`${BASE_URL}/master-data/io-sizes`, { headers }),
      axios.get(`${BASE_URL}/master-data/set-pressures`, { headers })
    ]);
    
    console.log('\n📊 API Response Summary:');
    console.log('Brands:', brandsRes.data.success ? `✅ ${brandsRes.data.data.length} items` : '❌ Failed');
    console.log('Materials:', materialsRes.data.success ? `✅ ${materialsRes.data.data.length} items` : '❌ Failed');
    console.log('Models:', modelsRes.data.success ? `✅ ${modelsRes.data.data.length} items` : '❌ Failed');
    console.log('IO Sizes:', ioSizesRes.data.success ? `✅ ${ioSizesRes.data.data.raw?.length || 0} combinations` : '❌ Failed');
    console.log('Set Pressures:', setPressuresRes.data.success ? `✅ ${setPressuresRes.data.data.length} items` : '❌ Failed');
    
    console.log('\n🔧 Detailed Model Data:');
    if (modelsRes.data.success && modelsRes.data.data.length > 0) {
      console.log('Sample models:');
      modelsRes.data.data.slice(0, 3).forEach((model, idx) => {
        console.log(`  ${idx + 1}. ID: ${model.id}, Name: "${model.name}", Brand: "${model.brand}"`);
      });
      
      console.log('\nAll models:');
      modelsRes.data.data.forEach(model => {
        console.log(`  - ${model.name} (Brand: ${model.brand || 'null'})`);
      });
    } else {
      console.log('❌ No models found or API failed');
    }
    
    console.log('\n🔗 Detailed IO Sizes Data:');
    if (ioSizesRes.data.success) {
      const ioData = ioSizesRes.data.data;
      console.log('Raw combinations:', ioData.raw?.length || 0);
      console.log('Inlet sizes:', ioData.inletSizes?.length || 0);
      console.log('Outlet sizes:', ioData.outletSizes?.length || 0);
      console.log('Grouped keys:', Object.keys(ioData.grouped || {}).length);
      
      if (ioData.grouped) {
        console.log('\nGrouped structure:');
        Object.keys(ioData.grouped).slice(0, 3).forEach(inlet => {
          console.log(`  "${inlet}" → [${ioData.grouped[inlet].join(', ')}]`);
        });
      }
    }
    
    console.log('\n🎯 Brand-Model Relationships:');
    if (brandsRes.data.success && modelsRes.data.success) {
      brandsRes.data.data.forEach(brand => {
        const modelsForBrand = modelsRes.data.data.filter(model => model.brand === brand.name);
        console.log(`  ${brand.name}: ${modelsForBrand.length} models`);
        if (modelsForBrand.length > 0) {
          console.log(`    - ${modelsForBrand.map(m => m.name).join(', ')}`);
        }
      });
    }
    
    console.log('\n📝 Frontend Issues to Check:');
    console.log('1. Model dropdown: Check if models array is populated');
    console.log('2. Model filtering: Check if brand matching works correctly');
    console.log('3. IO sizes: Check if grouped structure is available');
    console.log('4. Year format: Check if YYYY/MM display works');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugFrontendData();
