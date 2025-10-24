#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// Remove directory recursively
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      logWarning(`Could not remove ${dirPath}: ${error.message}`);
      return false;
    }
  }
  return true;
}

// Clean build artifacts
function cleanBuildArtifacts() {
  log('🧹 Cleaning build artifacts...', 'cyan');
  
  const distPath = path.join(__dirname, '..', 'dist');
  if (removeDirectory(distPath)) {
    logSuccess('Removed dist directory');
  }
  
  // Clean TypeScript build info
  const tsBuildInfoPath = path.join(__dirname, '..', 'tsconfig.tsbuildinfo');
  if (fs.existsSync(tsBuildInfoPath)) {
    try {
      fs.unlinkSync(tsBuildInfoPath);
      logSuccess('Removed TypeScript build info');
    } catch (error) {
      logWarning(`Could not remove TypeScript build info: ${error.message}`);
    }
  }
}

// Clean Prisma artifacts
function cleanPrismaArtifacts() {
  log('🧹 Cleaning Prisma artifacts...', 'cyan');
  
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  if (removeDirectory(prismaClientPath)) {
    logSuccess('Removed Prisma client directory');
  }
  
  // Clean any temporary Prisma files
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    try {
      const files = fs.readdirSync(nodeModulesPath);
      files.forEach(file => {
        if (file.startsWith('.prisma') || file.includes('prisma-tmp')) {
          const filePath = path.join(nodeModulesPath, file);
          try {
            if (fs.statSync(filePath).isDirectory()) {
              removeDirectory(filePath);
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            // Ignore cleanup errors for individual files
          }
        }
      });
    } catch (error) {
      logWarning(`Could not clean temporary Prisma files: ${error.message}`);
    }
  }
}

// Clean node modules (optional)
function cleanNodeModules() {
  log('🧹 Cleaning node_modules...', 'cyan');
  
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (removeDirectory(nodeModulesPath)) {
    logSuccess('Removed node_modules directory');
  }
  
  const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    try {
      fs.unlinkSync(packageLockPath);
      logSuccess('Removed package-lock.json');
    } catch (error) {
      logWarning(`Could not remove package-lock.json: ${error.message}`);
    }
  }
}

// Main clean function
function clean() {
  const args = process.argv.slice(2);
  const cleanAll = args.includes('--all');
  const cleanModules = args.includes('--modules') || cleanAll;
  
  log('🚀 Starting cleanup process...', 'cyan');
  
  // Always clean build artifacts and Prisma
  cleanBuildArtifacts();
  cleanPrismaArtifacts();
  
  // Optionally clean node_modules
  if (cleanModules) {
    cleanNodeModules();
  }
  
  logSuccess('Cleanup completed');
  
  if (cleanModules) {
    log('\n💡 Don\'t forget to run "npm install" to reinstall dependencies', 'yellow');
  }
}

// Run the cleanup
clean();