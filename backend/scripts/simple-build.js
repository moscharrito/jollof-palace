#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting simple build process...');

try {
  // Step 1: Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate --schema=./prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Prisma client generated');

  // Step 2: Compile TypeScript
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ TypeScript compiled');

  console.log('🎉 Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}