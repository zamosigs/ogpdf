#!/usr/bin/env node

/**
 * Create Test Files Script
 * Generates sample PDF and image files for testing
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createSamplePDF() {
  console.log('📄 Creating sample PDF...');
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Title
  page.drawText('OG PDF Test Document', {
    x: 50,
    y: 750,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Content
  const content = [
    'This is a sample PDF document created for testing OG PDF functionality.',
    '',
    'Features tested:',
    '• PDF merging',
    '• PDF splitting',
    '• PDF compression',
    '• PDF editing',
    '• OCR text extraction',
    '',
    'This document contains multiple pages to test various operations.',
    'You can use this file to test the API endpoints.',
  ];
  
  let y = 700;
  content.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: y,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    y -= 20;
  });
  
  // Add a second page
  const page2 = pdfDoc.addPage([595, 842]);
  page2.drawText('Page 2 - Additional Content', {
    x: 50,
    y: 750,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page2.drawText('This is the second page of the test document.', {
    x: 50,
    y: 700,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  
  const testDir = path.join(__dirname, '../test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(testDir, 'sample.pdf'), pdfBytes);
  console.log('✅ Sample PDF created: test-files/sample.pdf');
}

async function createSampleImage() {
  console.log('🖼️ Creating sample image...');
  
  // Create a simple SVG image instead of using canvas
  const svgContent = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0" stroke="#333" stroke-width="2"/>
      <text x="200" y="80" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="#333">OG PDF Test Image</text>
      <text x="200" y="120" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">This is a sample image for testing</text>
      <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">OCR functionality and image to PDF</text>
      <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">conversion features.</text>
      <rect x="50" y="200" width="100" height="60" fill="#4CAF50"/>
      <circle cx="300" cy="230" r="40" fill="#2196F3"/>
    </svg>
  `;
  
  const testDir = path.join(__dirname, '../test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Save as SVG instead of JPG
  fs.writeFileSync(path.join(testDir, 'sample.svg'), svgContent);
  console.log('✅ Sample image created: test-files/sample.svg');
  console.log('💡 Note: Using SVG instead of JPG to avoid canvas dependency');
}

async function main() {
  console.log('🚀 Creating test files for OG PDF');
  console.log('==================================');
  
  try {
    await createSamplePDF();
    await createSampleImage();
    
    console.log('');
    console.log('🎉 Test files created successfully!');
    console.log('You can now run: npm run test:api');
  } catch (error) {
    console.error('❌ Error creating test files:', error.message);
    process.exit(1);
  }
}

main();
