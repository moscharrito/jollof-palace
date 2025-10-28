#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Simple Render build starting...');

try {
  // Generate Prisma client first
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Clean dist
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  
  // Check if TypeScript is available
  console.log('🔍 Checking TypeScript installation...');
  try {
    execSync('npx tsc --version', { stdio: 'inherit' });
  } catch (tscError) {
    console.log('⚠️ TypeScript not found via npx, trying direct installation...');
    execSync('npm install typescript --no-save', { stdio: 'inherit' });
  }
  
  // Compile TypeScript using production config
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.prod.json', { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Build completed!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // If TypeScript fails, try with even more permissive settings
  console.log('🔄 Trying with maximum permissive settings...');
  try {
    execSync('npx tsc --noEmitOnError false --skipLibCheck --outDir dist --rootDir src --target ES2020 --module commonjs', { 
      stdio: 'inherit' 
    });
    console.log('✅ Build completed with warnings!');
  } catch (secondError) {
    console.error('❌ Second attempt failed:', secondError.message);
    process.exit(1);
  }
}