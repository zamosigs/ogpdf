#!/bin/bash

# OG PDF Deployment Script
# This script helps deploy the application to various platforms

echo "🚀 OG PDF Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint check
echo "🧹 Running linter..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "🚀 Deployment Options:"
echo "1. Vercel: Run 'vercel' command"
echo "2. Railway: Connect GitHub repository"
echo "3. Render: Deploy as web service"
echo "4. Netlify: Deploy with Next.js support"
echo ""
echo "📚 For detailed deployment instructions, see README.md"
