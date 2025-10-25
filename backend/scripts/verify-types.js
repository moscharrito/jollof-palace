#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TypeScript type definitions...');

const requiredTypes = [
  '@types/express',
  '@types/node',
  '@types/bcryptjs',
  '@types/cors',
  '@types/jsonwebtoken'
];

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

let allTypesFound = true;

requiredTypes.forEach(typePkg => {
  const typePath = path.join(nodeModulesPath, typePkg);
  if (fs.existsSync(typePath)) {
    console.log(`✅ ${typePkg} found`);
  } else {
    console.log(`❌ ${typePkg} NOT found`);
    allTypesFound = false;
  }
});

if (allTypesFound) {
  console.log('🎉 All required type definitions are available!');
  process.exit(0);
} else {
  console.log('❌ Some type definitions are missing!');
  process.exit(1);
}