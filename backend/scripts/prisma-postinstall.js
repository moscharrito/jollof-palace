#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// Check if Prisma schema exists
function checkPrismaSchema() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  return fs.existsSync(schemaPath);
}

// Generate Prisma client with error handling
async function generatePrismaClient() {
  if (!checkPrismaSchema()) {
    logWarning('Prisma schema not found, skipping client generation');
    return;
  }

  log('🔄 Generating Prisma client...', 'cyan');
  
  try {
    // Set environment variables for better Windows compatibility
    const env = {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true'
    };
    
    // On Windows, use a different temp directory
    if (os.platform() === 'win32') {
      env.TMPDIR = path.join(os.tmpdir(), 'prisma-postinstall-' + Date.now());
    }
    
    execSync('npx prisma generate --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env
    });
    
    logSuccess('Prisma client generated successfully');
    
  } catch (error) {
    if (error.message.includes('EPERM') || error.message.includes('operation not permitted')) {
      logWarning('Permission error during Prisma generation');
      logWarning('This is common on Windows systems and usually resolves on retry');
      
      // Try once more with a delay
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        execSync('npx prisma generate --schema=./prisma/schema.prisma --generator client', {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        logSuccess('Prisma client generated successfully on retry');
      } catch (retryError) {
        logError('Prisma generation failed on retry');
        logWarning('You may need to run "npm run db:generate" manually');
        // Don't fail the postinstall process
      }
    } else {
      logError(`Prisma generation failed: ${error.message}`);
      logWarning('You may need to run "npm run db:generate" manually');
      // Don't fail the postinstall process
    }
  }
}

// Main postinstall function
async function postinstall() {
  // Skip in CI environments or when explicitly disabled
  if (process.env.CI || process.env.SKIP_PRISMA_GENERATE) {
    log('Skipping Prisma generation (CI environment or explicitly disabled)', 'yellow');
    return;
  }
  
  // Skip if this is a production deployment without schema
  if (process.env.NODE_ENV === 'production' && !checkPrismaSchema()) {
    log('Skipping Prisma generation (production without schema)', 'yellow');
    return;
  }
  
  try {
    await generatePrismaClient();
  } catch (error) {
    logError(`Postinstall failed: ${error.message}`);
    // Don't fail the npm install process
    process.exit(0);
  }
}

// Run postinstall
postinstall().catch(error => {
  logError(`Unexpected error in postinstall: ${error.message}`);
  process.exit(0); // Don't fail npm install
});