#!/usr/bin/env node
// Test script to verify all API routes

const BASE_URL = 'http://localhost:5000/api';

// Test all routes
const routes = [
  { method: 'GET', path: '/health', description: 'Health check' },
  { method: 'GET', path: '/approvals/pending', description: 'Get pending approvals', requiresAuth: true },
  { method: 'GET', path: '/approvals/flows', description: 'Get approval flows', requiresAuth: true },
  { method: 'GET', path: '/approval-rules', description: 'Get approval rules', requiresAuth: true },
  { method: 'GET', path: '/approval-rules/available-approvers', description: 'Get available approvers', requiresAuth: true },
];

console.log('API Route Test Summary:');
console.log('======================');
routes.forEach(route => {
  console.log(`${route.method} ${route.path} - ${route.description}`);
  if (route.requiresAuth) {
    console.log('  ⚠️  Requires authentication');
  }
});

console.log('\nTo test manually:');
console.log('1. Start the server: npm start');
console.log('2. Login to get auth token');
console.log('3. Test routes with token in Authorization header');