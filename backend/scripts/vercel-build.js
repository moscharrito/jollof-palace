#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Vercel build process...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Platform:', process.platform);

try {
  // Step 1: Ensure we're in the right directory
  const projectRoot = path.join(__dirname, '..');
  process.chdir(projectRoot);
  console.log('📁 Working directory:', process.cwd());

  // Step 2: Check if TypeScript is available
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    console.log('✅ TypeScript compiler found');
  } catch (error) {
    console.log('⚠️ TypeScript not found via npx, trying direct installation...');
    
    // Try to install TypeScript if not available
    try {
      execSync('npm install typescript@latest', { stdio: 'inherit' });
      console.log('✅ TypeScript installed');
    } catch (installError) {
      console.error('❌ Failed to install TypeScript:', installError.message);
      throw installError;
    }
  }

  // Step 3: Check if Prisma is available
  try {
    execSync('npx prisma --version', { stdio: 'pipe' });
    console.log('✅ Prisma CLI found');
  } catch (error) {
    console.log('⚠️ Prisma not found via npx, trying direct installation...');
    
    try {
      execSync('npm install prisma@latest', { stdio: 'inherit' });
      console.log('✅ Prisma installed');
    } catch (installError) {
      console.error('❌ Failed to install Prisma:', installError.message);
      throw installError;
    }
  }

  // Step 4: Generate Prisma client
  console.log('📦 Generating Prisma client...');
  
  // Check if schema exists
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Prisma schema not found at: ' + schemaPath);
  }
  
  execSync('npx prisma generate --schema=./prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'false'
    }
  });
  console.log('✅ Prisma client generated');

  // Step 5: Compile TypeScript
  console.log('🔨 Compiling TypeScript...');
  
  // Check if tsconfig exists
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found at: ' + tsconfigPath);
  }
  
  execSync('npx tsc', {
    stdio: 'inherit',
    cwd: projectRoot
  });
  console.log('✅ TypeScript compiled');

  // Step 6: Verify build output
  const distPath = path.join(projectRoot, 'dist');
  const indexPath = path.join(distPath, 'index.js');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build output directory not found: ' + distPath);
  }
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('Main entry point not found: ' + indexPath);
  }
  
  console.log('✅ Build output verified');
  console.log('🎉 Vercel build completed successfully!');
  
} catch (error) {
  console.error('❌ Vercel build failed:', error.message);
  
  // Provide helpful debugging information
  console.error('\n🔍 Debug Information:');
  console.error('Node version:', process.version);
  console.error('NPM version:', execSync('npm --version', { encoding: 'utf8' }).trim());
  console.error('Working directory:', process.cwd());
  console.error('Environment variables:');
  console.error('- NODE_ENV:', process.env.NODE_ENV);
  console.error('- VERCEL:', process.env.VERCEL);
  console.error('- CI:', process.env.CI);
  
  process.exit(1);
}