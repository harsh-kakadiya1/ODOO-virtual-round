#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Expense Management System...\n');

// Check if .env file exists in server directory
const serverEnvPath = path.join(__dirname, 'server', '.env');
const serverEnvExamplePath = path.join(__dirname, 'server', 'env.example');

if (!fs.existsSync(serverEnvPath)) {
  if (fs.existsSync(serverEnvExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(serverEnvExamplePath, serverEnvPath);
    console.log('✅ .env file created! Please update the values in server/.env\n');
  } else {
    console.log('⚠️  No env.example file found. Please create server/.env manually\n');
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Install dependencies
console.log('📦 Installing dependencies...\n');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('\n✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Update server/.env with your MongoDB URI and JWT secret');
console.log('2. Start MongoDB service');
console.log('3. Run: npm run dev');
console.log('\nThe application will be available at:');
console.log('- Frontend: http://localhost:3000');
console.log('- Backend API: http://localhost:5000');
