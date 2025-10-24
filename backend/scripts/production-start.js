#!/usr/bin/env node

const path = require('path');

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting production server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Platform:', process.platform);

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set the following environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`- ${envVar}`);
  });
  process.exit(1);
}

// Check if build output exists
const distPath = path.join(__dirname, '..', 'dist', 'index.js');
const fs = require('fs');

if (!fs.existsSync(distPath)) {
  console.error('❌ Build output not found at:', distPath);
  console.error('Please run "npm run build" first');
  process.exit(1);
}

console.log('✅ Environment validation passed');
console.log('✅ Build output found');

// Start the server
try {
  require(distPath);
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}