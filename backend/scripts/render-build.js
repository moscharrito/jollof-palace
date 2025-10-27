#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Render build process...');
console.log('Environment:', process.env.NODE_ENV || 'production');

try {
  const projectRoot = path.join(__dirname, '..');
  process.chdir(projectRoot);
  
  console.log('📁 Working directory:', process.cwd());

  // Step 1: Install all dependencies including dev dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');

  // Step 2: Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Step 3: Clean previous build
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned previous build');
  }

  // Step 4: Compile TypeScript with maximum compatibility
  console.log('🔨 Compiling TypeScript...');
  
  // Use the most permissive TypeScript compilation
  execSync('npx tsc --skipLibCheck --noImplicitAny false --strict false --target ES2020 --module commonjs --outDir dist --rootDir src --esModuleInterop --resolveJsonModule', {
    stdio: 'inherit',
    cwd: projectRoot
  });
  
  console.log('✅ TypeScript compiled');

  // Step 5: Verify build output
  const indexPath = path.join(projectRoot, 'dist', 'index.js');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build failed - index.js not found');
  }

  console.log('✅ Build output verified');
  console.log('🎉 Render build completed successfully!');
  
} catch (error) {
  console.error('❌ Render build failed:', error.message);
  
  // Provide debugging information
  console.error('\n🔍 Debug Information:');
  try {
    console.error('Node version:', process.version);
    console.error('NPM version:', execSync('npm --version', { encoding: 'utf8' }).trim());
    console.error('TypeScript version:', execSync('npx tsc --version', { encoding: 'utf8' }).trim());
  } catch (debugError) {
    console.error('Could not get version info:', debugError.message);
  }
  
  process.exit(1);
}