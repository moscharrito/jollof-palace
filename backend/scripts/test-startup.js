#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing server startup...');

const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

let output = '';
let hasStarted = false;

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text.trim());
  
  if (text.includes('Server running on port') || text.includes('🚀')) {
    hasStarted = true;
    console.log('✅ Server started successfully!');
    serverProcess.kill('SIGTERM');
  }
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  console.error('STDERR:', text.trim());
  
  // Check for critical errors that would prevent startup
  if (text.includes('ECONNREFUSED') && text.includes('Redis')) {
    console.error('❌ Redis connection error detected');
  }
});

serverProcess.on('close', (code) => {
  if (hasStarted) {
    console.log('✅ Startup test completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Server failed to start properly');
    console.error('Output:', output);
    process.exit(1);
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  if (!hasStarted) {
    console.error('❌ Startup test timed out');
    serverProcess.kill('SIGKILL');
    process.exit(1);
  }
}, 15000);