// scripts/configure-do-app.js
// PURPOSE: Configure DigitalOcean App Platform environment variables
// Usage: node scripts/configure-do-app.js

const https = require('https');

// DO API Token - this should be provided as an environment variable
const DO_API_TOKEN = process.env.DO_API_TOKEN;

if (!DO_API_TOKEN) {
  console.error('❌ Error: DO_API_TOKEN environment variable is required');
  console.log('\nUsage: DO_API_TOKEN=your-token node scripts/configure-do-app.js');
  process.exit(1);
}

// App configuration
const APP_ID = 'e0c1c3e1-7e0a-4e68-8b0c-84e5a6f6f1e1'; // You'll need to replace this with actual app ID

const newEnvVars = [
  // Database - set via DO App Platform config or manually
  { 
    key: 'DATABASE_URL', 
    scope: 'RUN_TIME', 
    type: 'SECRET',
    value: '${db.DATABASE_URL}' // Reference to attached DB component
  },
  // JWT Secret
  { 
    key: 'JWT_SECRET', 
    scope: 'RUN_TIME',
    type: 'SECRET',
    value: 'synoptic-prod-' + require('crypto').randomBytes(32).toString('hex')
  },
  // AI Provider
  { key: 'AI_PROVIDER', scope: 'RUN_TIME', value: 'gradient' },
  // DO Gradient AI Model Access Key - This needs to be set manually in DO console
  { key: 'DO_GRADIENT_API_KEY', scope: 'RUN_TIME', type: 'SECRET' },
  // PDF Service
  { key: 'PDF_SERVICE_URL', scope: 'RUN_TIME', value: 'http://synoptic-pdf:3000' },
];

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.digitalocean.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DO_API_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getApps() {
  console.log('📋 Fetching apps...');
  const result = await makeRequest('GET', '/v2/apps');
  
  if (result.status !== 200) {
    console.error('❌ Failed to fetch apps:', result.data);
    return [];
  }
  
  return result.data.apps || [];
}

async function getAppSpec(appId) {
  console.log(`📋 Fetching app spec for ${appId}...`);
  const result = await makeRequest('GET', `/v2/apps/${appId}`);
  
  if (result.status !== 200) {
    console.error('❌ Failed to fetch app:', result.data);
    return null;
  }
  
  return result.data.app;
}

async function main() {
  try {
    // List all apps
    const apps = await getApps();
    
    if (apps.length === 0) {
      console.log('No apps found.');
      return;
    }
    
    console.log('\n📌 Found apps:');
    apps.forEach((app, i) => {
      console.log(`  ${i + 1}. ${app.spec?.name || app.id}`);
      console.log(`     ID: ${app.id}`);
      console.log(`     URL: ${app.live_url || 'N/A'}`);
    });
    
    // Find synoptic app
    const synopticApp = apps.find(a => 
      a.spec?.name?.toLowerCase().includes('synoptic') || 
      (a.live_url && a.live_url.includes('synoptic'))
    );
    
    if (synopticApp) {
      console.log(`\n✅ Found Synoptic app:`);
      console.log(`   ID: ${synopticApp.id}`);
      console.log(`   Name: ${synopticApp.spec?.name}`);
      console.log(`   URL: ${synopticApp.live_url}`);
      
      // Print required env vars
      console.log('\n🔧 Environment variables to configure:');
      newEnvVars.forEach(env => {
        const type = env.type === 'SECRET' ? '(SECRET)' : '';
        const value = env.value && !env.type?.includes('SECRET') ? `= ${env.value.slice(0, 40)}...` : '';
        console.log(`   - ${env.key} ${type} ${value}`);
      });
      
      console.log('\n📝 To update, manually configure these in the DO App Platform console');
      console.log(`   or use: doctl apps update ${synopticApp.id} --spec synoptic.yaml`);
    } else {
      console.log('\n⚠️ Could not find Synoptic app. Manual configuration required.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
