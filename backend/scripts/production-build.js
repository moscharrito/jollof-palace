#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting production build...');
console.log('Environment:', process.env.NODE_ENV || 'production');

try {
  const projectRoot = path.join(__dirname, '..');
  process.chdir(projectRoot);
  
  // Verify type definitions
  console.log('🔍 Verifying type definitions...');
  execSync('node scripts/verify-types.js', { stdio: 'inherit' });
  console.log('✅ Type definitions verified');
  
  // Clean previous build
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned previous build');
  }

  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Compile TypeScript with production config
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.prod.json', { stdio: 'inherit' });
  console.log('✅ TypeScript compiled');

  // Verify build
  if (!fs.existsSync('dist/index.js')) {
    throw new Error('Build failed - index.js not found');
  }

  console.log('🎉 Production build completed successfully!');
  
} catch (error) {
  console.error('❌ Production build failed:', error.message);
  process.exit(1);
}