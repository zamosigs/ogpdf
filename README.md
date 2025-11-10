# OG PDF - Professional PDF Tools

A production-ready SaaS application for comprehensive PDF manipulation built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

### Core PDF Operations
- **Merge PDFs**: Combine multiple PDF files into a single document
- **Split PDFs**: Split PDFs by page ranges or extract specific pages
- **Compress PDFs**: Reduce file size while maintaining quality
- **Edit PDFs**: Rotate, delete, duplicate pages, add text, watermarks, and annotations
- **OCR Text Extraction**: Extract text from images and scanned PDFs with multi-language support
- **Image to PDF**: Convert multiple images to PDF documents
- **PDF to Images**: Convert PDF pages to image files (JPG, PNG, WebP)

### Technical Features
- **Real-time PDF Preview**: Interactive PDF viewer with zoom, rotation, and navigation
- **Drag & Drop Upload**: Intuitive file upload with support for multiple files
- **Batch Processing**: Process multiple files simultaneously
- **Automatic Cleanup**: Files are automatically deleted after 1 hour
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Type Safety**: Built with TypeScript for robust development

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN/UI** - Modern component library
- **React PDF** - PDF.js integration for preview
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **PDF-lib** - PDF manipulation library
- **Sharp** - High-performance image processing
- **Tesseract.js** - OCR text extraction
- **Multer** - File upload handling
- **JSZip** - ZIP file creation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ogpdf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   No environment variables are required for basic functionality.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment variables** (if needed)
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add any required variables

### Other Platforms

The application can also be deployed to:
- **Railway**: Connect your GitHub repository
- **Render**: Deploy as a web service
- **Netlify**: Deploy with Next.js support

## 📚 API Documentation

### Endpoints

All API endpoints are located under `/api/pdf/` and accept `multipart/form-data` requests.

#### Merge PDFs
```http
POST /api/pdf/merge
Content-Type: multipart/form-data

files: File[] (2+ PDF files)
```

#### Split PDF
```http
POST /api/pdf/split
Content-Type: multipart/form-data

file: File (1 PDF file)
pageRanges: string (e.g., "1-3,5,7-9")
```

#### Compress PDF
```http
POST /api/pdf/compress
Content-Type: multipart/form-data

file: File (1 PDF file)
quality: number (0.1-1.0, default: 0.8)
```

#### Edit PDF
```http
POST /api/pdf/edit
Content-Type: multipart/form-data

file: File (1 PDF file)
action: string (rotate|delete|duplicate|addText|addWatermark|rearrange)
pageNumber: number (1-based)
text: string (for addText/addWatermark)
x: number (for addText)
y: number (for addText)
rotation: number (0|90|180|270)
newOrder: string (comma-separated page numbers for rearrange)
```

#### OCR Text Extraction
```http
POST /api/pdf/ocr
Content-Type: multipart/form-data

file: File (1 PDF or image file)
language: string (language code, default: "eng")
```

#### Convert Images to PDF
```http
POST /api/pdf/jpg-to-pdf
Content-Type: multipart/form-data

files: File[] (1+ image files)
pageSize: string (A4|A3|Letter|Legal, default: "A4")
```

#### Convert PDF to Images
```http
POST /api/pdf/pdf-to-jpg
Content-Type: multipart/form-data

file: File (1 PDF file)
quality: number (10-100, default: 90)
format: string (jpeg|png|webp, default: "jpeg")
```

### Response Format

**Success Response:**
- Content-Type: `application/pdf` or `application/zip`
- File download with appropriate filename

**Error Response:**
```json
{
  "error": "Error message"
}
```

## 🧪 Testing the API

### Using curl

```bash
# Merge PDFs
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  --output merged.pdf

# Split PDF
curl -X POST http://localhost:3000/api/pdf/split \
  -F "file=@document.pdf" \
  -F "pageRanges=1-3,5,7-9" \
  --output split.zip

# Compress PDF
curl -X POST http://localhost:3000/api/pdf/compress \
  -F "file=@large.pdf" \
  -F "quality=0.7" \
  --output compressed.pdf
```

### Using Postman

1. Create a new POST request
2. Set URL to `http://localhost:3000/api/pdf/{endpoint}`
3. Go to Body tab
4. Select "form-data"
5. Add files and parameters
6. Send request

## 🏗 Project Structure

```
ogpdf/
├── app/                    # Next.js App Router
│   ├── api/pdf/           # API routes
│   │   ├── merge/         # Merge PDFs endpoint
│   │   ├── split/         # Split PDF endpoint
│   │   ├── compress/      # Compress PDF endpoint
│   │   ├── edit/          # Edit PDF endpoint
│   │   ├── ocr/           # OCR endpoint
│   │   ├── jpg-to-pdf/    # Image to PDF endpoint
│   │   └── pdf-to-jpg/    # PDF to Images endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # ShadCN/UI components
│   ├── file-upload.tsx   # File upload component
│   ├── pdf-preview.tsx   # PDF preview component
│   └── pdf-tools.tsx     # PDF tools component
├── lib/                  # Utility functions
│   ├── utils.ts          # General utilities
│   └── file-cleanup.ts   # File cleanup system
├── temp/                 # Temporary file storage
├── public/               # Static assets
├── package.json          # Dependencies
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🔧 Configuration

### File Upload Limits
- Maximum file size: 50MB (configurable in `next.config.js`)
- Maximum files per request: 10
- Supported formats: PDF, JPG, PNG, GIF, WebP

### File Cleanup
- Files are automatically deleted after 1 hour
- Cleanup runs every hour
- Manual cleanup available via API

### OCR Languages
Supported languages include:
- English (eng)
- Spanish (spa)
- French (fra)
- German (deu)
- Italian (ita)
- Portuguese (por)
- And many more...

## 🚨 Error Handling

The application includes comprehensive error handling:

- **File Validation**: Checks file types and sizes
- **API Validation**: Validates request parameters
- **Processing Errors**: Graceful handling of PDF processing errors
- **User Feedback**: Toast notifications for success/error states
- **Logging**: Console logging for debugging

## 🔒 Security

- **File Type Validation**: Only allows safe file types
- **Size Limits**: Prevents large file uploads
- **Automatic Cleanup**: No permanent file storage
- **Input Sanitization**: All inputs are validated and sanitized
- **CORS Protection**: Configured for production use

## 🚀 Performance

- **Serverless Architecture**: Scales automatically
- **Optimized Images**: Sharp for efficient image processing
- **Lazy Loading**: Components load on demand
- **Caching**: Browser caching for static assets
- **Compression**: Gzip compression enabled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@ogpdf.com or create an issue in the GitHub repository.

## 🗺 Roadmap

### Phase 2 (Future)
- User authentication and accounts
- Payment integration
- Cloud storage integration
- Advanced PDF editing features
- Batch processing improvements
- API rate limiting
- Advanced OCR features
- PDF form filling
- Digital signatures

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
