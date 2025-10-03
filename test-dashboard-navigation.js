// Test dashboard navigation options for operators
const puppeteer = require('puppeteer');

async function testDashboardNavigation() {
  console.log('🧪 Testing dashboard navigation options...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[name="username"]');
    
    // Login as operator
    console.log('🔑 Logging in as operator...');
    await page.type('input[name="username"]', 'operator1');
    await page.type('input[name="password"]', 'operator123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-title', { timeout: 5000 });
    console.log('✅ Successfully logged in to operator dashboard');
    
    // Test 1: Navbar Dashboard Link
    console.log('\n📊 Testing navbar dashboard link...');
    await page.goto('http://localhost:5173/reports');
    await page.waitForSelector('.navbar-link');
    
    const dashboardLink = await page.$('.navbar-link');
    if (dashboardLink) {
      const linkText = await page.evaluate(el => el.textContent, dashboardLink);
      console.log(`✅ Found navbar dashboard link: "${linkText}"`);
      
      await dashboardLink.click();
      await page.waitForSelector('.dashboard-title');
      console.log('✅ Navbar dashboard link works correctly');
    } else {
      console.log('❌ Navbar dashboard link not found');
    }
    
    // Test 2: Brand Logo Link
    console.log('\n🔧 Testing brand logo link...');
    await page.goto('http://localhost:5173/reports');
    await page.waitForSelector('.navbar-brand');
    
    const brandLink = await page.$('.navbar-brand');
    if (brandLink) {
      const brandText = await page.evaluate(el => el.textContent, brandLink);
      console.log(`✅ Found brand link: "${brandText}"`);
      
      await brandLink.click();
      await page.waitForSelector('.dashboard-title');
      console.log('✅ Brand logo link works correctly');
    } else {
      console.log('❌ Brand logo link not found');
    }
    
    // Test 3: Breadcrumb Navigation
    console.log('\n🍞 Testing breadcrumb navigation...');
    await page.goto('http://localhost:5173/reports');
    await page.waitForSelector('.breadcrumb-link');
    
    const breadcrumbLink = await page.$('.breadcrumb-link');
    if (breadcrumbLink) {
      const breadcrumbText = await page.evaluate(el => el.textContent, breadcrumbLink);
      console.log(`✅ Found breadcrumb link: "${breadcrumbText}"`);
      
      await breadcrumbLink.click();
      await page.waitForSelector('.dashboard-title');
      console.log('✅ Breadcrumb navigation works correctly');
    } else {
      console.log('❌ Breadcrumb navigation not found');
    }
    
    // Test 4: Floating Dashboard Button
    console.log('\n🎈 Testing floating dashboard button...');
    await page.goto('http://localhost:5173/reports');
    await page.waitForSelector('.floating-dashboard-btn');
    
    const floatingBtn = await page.$('.floating-dashboard-btn');
    if (floatingBtn) {
      const btnText = await page.evaluate(el => el.textContent, floatingBtn);
      console.log(`✅ Found floating dashboard button: "${btnText}"`);
      
      await floatingBtn.click();
      await page.waitForSelector('.dashboard-title');
      console.log('✅ Floating dashboard button works correctly');
    } else {
      console.log('❌ Floating dashboard button not found');
    }
    
    // Test 5: Create Report Page Navigation
    console.log('\n📝 Testing create report page navigation...');
    await page.goto('http://localhost:5173/reports/new');
    await page.waitForSelector('.breadcrumb-link');
    
    const createReportBreadcrumb = await page.$('.breadcrumb-link');
    if (createReportBreadcrumb) {
      console.log('✅ Found breadcrumb in create report page');
      
      await createReportBreadcrumb.click();
      await page.waitForSelector('.dashboard-title');
      console.log('✅ Create report breadcrumb works correctly');
    } else {
      console.log('❌ Create report breadcrumb not found');
    }
    
    console.log('\n🎉 Dashboard navigation testing complete!');
    console.log('\n📊 Summary of navigation options for operators:');
    console.log('1. ✅ Navbar dashboard link (📊 Dashboard)');
    console.log('2. ✅ Clickable brand logo (🔧 Valve Test Suite)');
    console.log('3. ✅ Breadcrumb navigation on pages');
    console.log('4. ✅ Floating dashboard button (bottom-right)');
    console.log('\n🚀 All navigation options working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testDashboardNavigation();
} catch (error) {
  console.log('📝 Manual testing required (Puppeteer not available)');
  console.log('\n🧪 Manual Test Instructions:');
  console.log('1. Open http://localhost:5173');
  console.log('2. Login as operator1 / operator123');
  console.log('3. Navigate to different pages and test:');
  console.log('   - Navbar "📊 Dashboard" link');
  console.log('   - Clickable "🔧 Valve Test Suite" brand');
  console.log('   - Breadcrumb "📊 Dashboard" links');
  console.log('   - Floating dashboard button (bottom-right)');
  console.log('4. Verify all options return to operator dashboard');
}
