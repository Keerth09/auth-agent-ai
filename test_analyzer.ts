const fs = require('fs');
const path = require('path');

// Manually load .env.local for standard Node.js execution
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        process.env[key.trim()] = value.join('=').trim();
      }
    });
    console.log('✅ Loaded environment from .env.local');
  }
} catch (e) {
  console.warn('⚠️ Failed to load .env.local manually');
}

const { analyzeIntent } = require('./lib/intentAnalyzer');

async function test() {
  try {
    const res = await analyzeIntent("summarize my emails");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
