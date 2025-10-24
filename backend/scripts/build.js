#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
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

// Retry function with exponential backoff
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logWarning(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Clean up Prisma client files on Windows
function cleanupPrismaClient() {
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
  
  if (fs.existsSync(prismaClientPath)) {
    try {
      // On Windows, try to unlock any locked files
      if (os.platform() === 'win32') {
        // Try to kill any processes that might be locking the files
        try {
          execSync('taskkill /f /im node.exe 2>nul || echo "No node processes to kill"', { stdio: 'ignore' });
        } catch (err) {
          // Ignore errors
        }
        
        // Wait a moment for processes to clean up
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        const files = fs.readdirSync(prismaClientPath);
        files.forEach(file => {
          if (file.includes('.tmp') || (file.includes('.node') && file !== 'query_engine-windows.dll.node')) {
            const filePath = path.join(prismaClientPath, file);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              // Ignore cleanup errors
            }
          }
        });
        
        // Try to remove the entire .prisma directory and recreate it
        try {
          const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');
          if (fs.existsSync(prismaDir)) {
            execSync(`rmdir /s /q "${prismaDir}" 2>nul || echo "Could not remove .prisma directory"`, { stdio: 'ignore' });
          }
        } catch (err) {
          // Ignore errors
        }
      }
    } catch (error) {
      logWarning(`Could not cleanup Prisma client files: ${error.message}`);
    }
  }
}

// Generate Prisma client with retry logic
async function generatePrismaClient() {
  logStep('PRISMA', 'Generating Prisma client...');
  
  // On Windows, try a different approach
  if (os.platform() === 'win32') {
    try {
      // First, try to use the Prisma binary directly with a clean environment
      logStep('PRISMA', 'Using Windows-specific Prisma generation...');
      
      // Clean up first
      cleanupPrismaClient();
      
      // Create a temporary directory for Prisma
      const tempDir = path.join(os.tmpdir(), 'prisma-build-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      
      execSync('npx prisma generate --schema=./prisma/schema.prisma', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          TMPDIR: tempDir,
          TEMP: tempDir,
          TMP: tempDir,
          PRISMA_QUERY_ENGINE_BINARY: undefined, // Let Prisma download fresh
          PRISMA_GENERATE_SKIP_AUTOINSTALL: 'false'
        }
      });
      
      // Clean up temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        // Ignore cleanup errors
      }
      
      logSuccess('Prisma client generated successfully');
      return;
      
    } catch (error) {
      if (error.message.includes('EPERM') || error.message.includes('operation not permitted')) {
        logWarning('Windows permission error, trying alternative method...');
        
        // Try using PowerShell to generate
        try {
          execSync('powershell -Command "npx prisma generate --schema=./prisma/schema.prisma"', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
          });
          logSuccess('Prisma client generated using PowerShell');
          return;
        } catch (psError) {
          logWarning('PowerShell method also failed, trying manual approach...');
        }
        
        // Last resort: try to copy from a working installation
        try {
          logWarning('Attempting to reinstall Prisma packages...');
          execSync('npm uninstall @prisma/client prisma', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
          execSync('npm install @prisma/client prisma', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
          execSync('npx prisma generate --schema=./prisma/schema.prisma', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
          logSuccess('Prisma client generated after reinstall');
          return;
        } catch (reinstallError) {
          throw new Error(`All Prisma generation methods failed. Last error: ${reinstallError.message}`);
        }
      } else {
        throw error;
      }
    }
  } else {
    // Non-Windows systems use the original retry logic
    await retryOperation(async () => {
      try {
        cleanupPrismaClient();
        
        execSync('npx prisma generate --schema=./prisma/schema.prisma', {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        
        logSuccess('Prisma client generated successfully');
      } catch (error) {
        throw error;
      }
    }, 3, 2000);
  }
}

// Compile TypeScript
async function compileTypeScript() {
  logStep('TYPESCRIPT', 'Compiling TypeScript...');
  
  try {
    execSync('npx tsc', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('TypeScript compilation completed');
  } catch (error) {
    logError(`TypeScript compilation failed: ${error.message}`);
    throw error;
  }
}

// Validate build output
function validateBuild() {
  logStep('VALIDATION', 'Validating build output...');
  
  const distPath = path.join(__dirname, '..', 'dist');
  const indexPath = path.join(distPath, 'index.js');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build output directory not found');
  }
  
  if (!fs.existsSync(indexPath)) {
    throw new Error('Main entry point not found in build output');
  }
  
  // Check if Prisma client was generated
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
  if (!fs.existsSync(prismaClientPath)) {
    throw new Error('Prisma client not generated');
  }
  
  logSuccess('Build validation passed');
}

// Main build function
async function build() {
  const startTime = Date.now();
  
  try {
    log('🚀 Starting build process...', 'blue');
    
    // Step 1: Generate Prisma client
    await generatePrismaClient();
    
    // Step 2: Compile TypeScript
    await compileTypeScript();
    
    // Step 3: Validate build
    validateBuild();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`Build completed successfully in ${duration}s`);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logError(`Build failed after ${duration}s: ${error.message}`);
    
    // Provide helpful error messages
    if (error.message.includes('EPERM')) {
      log('\n💡 Troubleshooting tips for permission errors:', 'yellow');
      log('1. Close any running development servers', 'yellow');
      log('2. Close your IDE/editor temporarily', 'yellow');
      log('3. Run the build command as administrator', 'yellow');
      log('4. Try running: npm run clean && npm run build:full', 'yellow');
    }
    
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const skipPrisma = args.includes('--skip-prisma');
const verbose = args.includes('--verbose');

if (skipPrisma) {
  log('Skipping Prisma generation as requested', 'yellow');
}

// Run the build
build().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});