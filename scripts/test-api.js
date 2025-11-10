#!/usr/bin/env node

/**
 * OG PDF API Test Script
 * This script tests all API endpoints to ensure they're working correctly
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test data
const testPdfPath = path.join(__dirname, '../test-files/sample.pdf');
const testImagePath = path.join(__dirname, '../test-files/sample.svg');

async function testEndpoint(endpoint, formData, expectedContentType) {
  try {
    console.log(`🧪 Testing ${endpoint}...`);
    
    const response = await fetch(`${BASE_URL}/api/pdf/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ ${endpoint} failed: ${response.status} - ${error}`);
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes(expectedContentType)) {
      console.log(`✅ ${endpoint} passed`);
      return true;
    } else {
      console.log(`⚠️ ${endpoint} unexpected content type: ${contentType}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting OG PDF API Tests');
  console.log('=============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  const results = [];

  // Test 1: Merge PDFs (requires test files)
  if (fs.existsSync(testPdfPath)) {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testPdfPath));
    formData.append('files', fs.createReadStream(testPdfPath));
    
    results.push(await testEndpoint('merge', formData, 'application/pdf'));
  } else {
    console.log('⚠️ Skipping merge test - no test PDF file found');
  }

  // Test 2: Split PDF
  if (fs.existsSync(testPdfPath)) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    formData.append('pageRanges', '1-2');
    
    results.push(await testEndpoint('split', formData, 'application/zip'));
  } else {
    console.log('⚠️ Skipping split test - no test PDF file found');
  }

  // Test 3: Compress PDF
  if (fs.existsSync(testPdfPath)) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    formData.append('quality', '0.8');
    
    results.push(await testEndpoint('compress', formData, 'application/pdf'));
  } else {
    console.log('⚠️ Skipping compress test - no test PDF file found');
  }

  // Test 4: OCR
  if (fs.existsSync(testImagePath)) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('language', 'eng');
    
    results.push(await testEndpoint('ocr', formData, 'application/json'));
  } else {
    console.log('⚠️ Skipping OCR test - no test image file found');
  }

  // Test 5: JPG to PDF
  if (fs.existsSync(testImagePath)) {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    formData.append('pageSize', 'A4');
    
    results.push(await testEndpoint('jpg-to-pdf', formData, 'application/pdf'));
  } else {
    console.log('⚠️ Skipping JPG to PDF test - no test image file found');
  }

  // Summary
  console.log('');
  console.log('📊 Test Results Summary');
  console.log('======================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
  }
}

// Create test files directory if it doesn't exist
const testDir = path.join(__dirname, '../test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log('📁 Created test-files directory');
  console.log('💡 Add sample.pdf and sample.jpg to test-files/ to run full tests');
}

runTests().catch(console.error);
