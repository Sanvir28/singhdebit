#!/usr/bin/env node

// Deployment script for GitHub Pages
// This script replaces environment variable placeholders with actual values

const fs = require('fs');
const path = require('path');

// Read environment variables
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID;

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID || !FIREBASE_APP_ID) {
    console.error('Missing required environment variables:');
    console.error('- FIREBASE_API_KEY:', FIREBASE_API_KEY ? '✓' : '✗');
    console.error('- FIREBASE_PROJECT_ID:', FIREBASE_PROJECT_ID ? '✓' : '✗');
    console.error('- FIREBASE_APP_ID:', FIREBASE_APP_ID ? '✓' : '✗');
    process.exit(1);
}

// Replace placeholders in firebase-config.js
const configPath = path.join(__dirname, 'firebase-config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

configContent = configContent
    .replace(/\{\{FIREBASE_API_KEY\}\}/g, FIREBASE_API_KEY)
    .replace(/\{\{FIREBASE_PROJECT_ID\}\}/g, FIREBASE_PROJECT_ID)
    .replace(/\{\{FIREBASE_APP_ID\}\}/g, FIREBASE_APP_ID);

fs.writeFileSync(configPath, configContent);

console.log('✓ Firebase configuration updated successfully');
console.log('✓ Ready for GitHub Pages deployment');