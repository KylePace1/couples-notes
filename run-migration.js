#!/usr/bin/env node

/**
 * Run Database Migration
 *
 * This script runs the schema-update.sql file against your Supabase database.
 *
 * WARNING: You need your SERVICE ROLE key (not anon key) to run this.
 * Find it in: Supabase Dashboard > Settings > API > service_role key
 *
 * Usage:
 *   node run-migration.js YOUR_SERVICE_ROLE_KEY
 *
 * Or set it as an environment variable:
 *   export SUPABASE_SERVICE_KEY="your-service-role-key"
 *   node run-migration.js
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://ihjkbjntjuctpdsccuxg.supabase.co';
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('Error: Service role key required!');
  console.error('');
  console.error('Usage:');
  console.error('  node run-migration.js YOUR_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Or set environment variable:');
  console.error('  export SUPABASE_SERVICE_KEY="your-key"');
  console.error('  node run-migration.js');
  console.error('');
  console.error('Find your service role key in:');
  console.error('  Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Read SQL file
const sql = fs.readFileSync('./schema-update.sql', 'utf8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Execute each statement
let completed = 0;

statements.forEach((statement, index) => {
  const data = JSON.stringify({ query: statement + ';' });

  const options = {
    hostname: 'ihjkbjntjuctpdsccuxg.supabase.co',
    port: 443,
    path: '/rest/v1/rpc/exec',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  };

  const req = https.request(options, (res) => {
    let response = '';

    res.on('data', (chunk) => {
      response += chunk;
    });

    res.on('end', () => {
      completed++;

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log(`✓ Statement ${index + 1}/${statements.length} executed successfully`);
      } else {
        console.error(`✗ Statement ${index + 1}/${statements.length} failed:`, response);
      }

      if (completed === statements.length) {
        console.log('\n✓ Migration complete!');
      }
    });
  });

  req.on('error', (error) => {
    console.error(`✗ Error executing statement ${index + 1}:`, error.message);
    completed++;
  });

  req.write(data);
  req.end();
});
