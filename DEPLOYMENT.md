# OG PDF Deployment Guide

This guide provides step-by-step instructions for deploying the OG PDF application to various platforms.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create test files** (optional)
   ```bash
   npm run create:test-files
   ```

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment Options

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Option 1: Deploy via GitHub (Automatic)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

#### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Link to existing project or create new
   - Set up project settings
   - Deploy

#### Important Vercel Configuration

The project includes a `vercel.json` file with the following settings:
- **Max Duration**: 60 seconds (for heavy PDF processing)
- **Memory**: 3008 MB (maximum available)
- **Node Options**: Increased memory limit for Sharp image processing

#### Troubleshooting Vercel Deployment

If API routes fail on Vercel:

1. **Check Function Logs**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on the failing function
   - Check error logs

2. **Common Issues**
   - **Timeout**: Some operations take longer than 10s default. Vercel.json sets 60s max.
   - **Memory**: Sharp and PDF processing need more memory. Vercel.json sets 3008MB.
   - **Missing Dependencies**: Ensure all packages in package.json are installed

3. **Environment Variables** (if needed)
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add any required variables

**Vercel Configuration:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Railway

Railway provides easy deployment with GitHub integration.

1. **Connect GitHub repository**
   - Go to [Railway](https://railway.app)
   - Sign in with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure deployment**
   - Railway will auto-detect Next.js
   - Set environment variables if needed
   - Deploy

3. **Custom domain** (optional)
   - Go to project settings
   - Add custom domain
   - Configure DNS

### Render

Render offers free hosting for web services.

1. **Create new web service**
   - Go to [Render](https://render.com)
   - Sign in with GitHub
   - Click "New +" > "Web Service"
   - Connect your repository

2. **Configure service**
   - Name: `ogpdf`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Netlify

Netlify supports Next.js with some configuration.

1. **Create new site**
   - Go to [Netlify](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Choose your repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `netlify/functions`

3. **Deploy**
   - Click "Deploy site"
   - Wait for deployment

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_REQUEST=10

# File Cleanup Configuration
FILE_CLEANUP_INTERVAL=3600000  # 1 hour
```

### Optional Environment Variables

```bash
# OCR Configuration
TESSERACT_WORKER_PATH=./node_modules/tesseract.js/dist/worker.min.js

# Development
NODE_ENV=production
```

## 📊 Performance Optimization

### Vercel
- **Edge Functions**: Use for API routes
- **Image Optimization**: Automatic with Next.js
- **CDN**: Global edge network
- **Analytics**: Built-in performance monitoring

### Railway
- **Auto-scaling**: Based on traffic
- **Persistent storage**: For temp files
- **Custom domains**: Free SSL certificates

### Render
- **Static site generation**: For better performance
- **CDN**: Global content delivery
- **Auto-deploy**: From GitHub pushes

## 🔒 Security Considerations

1. **File Upload Limits**
   - Maximum file size: 50MB
   - Allowed file types: PDF, JPG, PNG, GIF, WebP
   - Automatic file cleanup after 1 hour

2. **API Rate Limiting**
   - Consider implementing rate limiting for production
   - Use environment variables for configuration

3. **CORS Configuration**
   - Configure allowed origins
   - Set appropriate headers

4. **Environment Variables**
   - Never commit sensitive data
   - Use platform-specific secret management

## 🧪 Testing Deployment

### Local Testing
```bash
# Start development server
npm run dev

# Test API endpoints
npm run test:api

# Create test files
npm run create:test-files
```

### Production Testing
1. **Health Check**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **API Testing**
   ```bash
   # Test merge endpoint
   curl -X POST https://your-domain.com/api/pdf/merge \
     -F "files=@test.pdf" \
     -F "files=@test2.pdf"
   ```

3. **Frontend Testing**
   - Upload files
   - Test all PDF operations
   - Verify responsive design
   - Check error handling

## 📈 Monitoring and Analytics

### Vercel
- Built-in analytics
- Performance monitoring
- Error tracking
- Real-time logs

### Railway
- Application logs
- Performance metrics
- Error tracking
- Resource usage

### Render
- Application logs
- Performance monitoring
- Uptime monitoring
- Error tracking

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Errors**
   - Verify file upload limits
   - Check CORS configuration
   - Review error logs

3. **Performance Issues**
   - Optimize images
   - Enable compression
   - Use CDN for static assets

4. **File Upload Issues**
   - Check file size limits
   - Verify file type validation
   - Review temporary storage

### Debug Commands

```bash
# Check build
npm run build

# Type check
npm run type-check

# Lint check
npm run lint

# Test API locally
npm run test:api
```

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review error logs
3. Test locally first
4. Contact platform support

For application issues:
1. Check GitHub issues
2. Review README.md
3. Test with sample files
4. Contact development team

---

**Happy Deploying! 🚀**
