/** @type {import('next').NextConfig} */

// Polyfill for Promise.withResolvers (required for Node.js < v22)
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'canvas', 'pdf-lib', 'jszip', 'tesseract.js']
  },
  serverRuntimeConfig: {
    // Increase memory for serverless functions
    maxDuration: 60,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // PDF.js configuration
    if (!isServer) {
      config.resolve.alias['pdfjs-dist'] = require.resolve('pdfjs-dist');
    }
    
    // Sharp configuration for serverless
    if (isServer) {
      config.externals.push('sharp');
    }
    
    return config;
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
