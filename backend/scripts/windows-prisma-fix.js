#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// This script specifically handles Windows Prisma generation issues

function log(message) {
  console.log(`[PRISMA-FIX] ${message}`);
}

function forceKillNodeProcesses() {
  try {
    log('Attempting to kill any hanging Node.js processes...');
    execSync('taskkill /f /im node.exe /t 2>nul', { stdio: 'ignore' });
    execSync('taskkill /f /im tsx.exe /t 2>nul', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors - processes might not exist
  }
}

function removePrismaFiles() {
  const prismaPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  
  try {
    log('Removing existing Prisma client files...');
    
    if (fs.existsSync(prismaPath)) {
      // Use Windows rmdir command for better file handle management
      execSync(`rmdir /s /q "${prismaPath}"`, { stdio: 'ignore' });
    }
    
    // Also remove any temp files
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const files = fs.readdirSync(nodeModulesPath);
      files.forEach(file => {
        if (file.startsWith('.prisma') || file.includes('prisma-tmp')) {
          const filePath = path.join(nodeModulesPath, file);
          try {
            execSync(`rmdir /s /q "${filePath}" 2>nul || del /f /q "${filePath}" 2>nul`, { stdio: 'ignore' });
          } catch (err) {
            // Ignore
          }
        }
      });
    }
    
    log('Prisma files removed successfully');
  } catch (error) {
    log(`Warning: Could not remove all Prisma files: ${error.message}`);
  }
}

function generatePrismaWithWorkaround() {
  try {
    log('Generating Prisma client with Windows workaround...');
    
    // Set Windows-specific environment variables
    const env = {
      ...process.env,
      PRISMA_QUERY_ENGINE_BINARY: undefined,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'false',
      TMPDIR: path.join(os.tmpdir(), 'prisma-windows-' + Date.now()),
      TEMP: path.join(os.tmpdir(), 'prisma-windows-' + Date.now()),
      TMP: path.join(os.tmpdir(), 'prisma-windows-' + Date.now())
    };
    
    // Create temp directories
    fs.mkdirSync(env.TMPDIR, { recursive: true });
    
    // Use cmd.exe directly to avoid PowerShell issues
    execSync('cmd /c "npx prisma generate"', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env
    });
    
    // Clean up temp directory
    try {
      fs.rmSync(env.TMPDIR, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
    
    log('Prisma client generated successfully!');
    return true;
    
  } catch (error) {
    log(`Prisma generation failed: ${error.message}`);
    return false;
  }
}

function main() {
  if (os.platform() !== 'win32') {
    log('This script is only for Windows systems');
    process.exit(0);
  }
  
  log('Starting Windows Prisma fix...');
  
  // Step 1: Kill any hanging processes
  forceKillNodeProcesses();
  
  // Step 2: Wait for processes to clean up
  log('Waiting for processes to clean up...');
  setTimeout(() => {
    // Step 3: Remove Prisma files
    removePrismaFiles();
    
    // Step 4: Wait a bit more
    setTimeout(() => {
      // Step 5: Generate Prisma client
      const success = generatePrismaWithWorkaround();
      
      if (success) {
        log('Windows Prisma fix completed successfully!');
        process.exit(0);
      } else {
        log('Windows Prisma fix failed. You may need to:');
        log('1. Close all Node.js processes and IDEs');
        log('2. Run as Administrator');
        log('3. Try: npm run clean:all && npm install && npm run build');
        process.exit(1);
      }
    }, 2000);
  }, 3000);
}

main();