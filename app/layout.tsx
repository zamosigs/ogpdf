import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/lib/polyfills'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OG PDF - Professional PDF Tools',
  description: 'A comprehensive PDF manipulation tool for merging, splitting, compressing, editing, and converting PDFs. Free, secure, and easy to use.',
  keywords: 'PDF, merge, split, compress, edit, OCR, convert, tools, free PDF editor, PDF merger, PDF splitter',
  authors: [{ name: 'Ali Zain' }],
  creator: 'Ali Zain',
  publisher: 'OG PDF',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ogpdf.com',
    title: 'OG PDF - Professional PDF Tools',
    description: 'Free online PDF tools for merging, splitting, compressing, editing, and converting PDFs. No registration required.',
    siteName: 'OG PDF',
    images: [
      {
        url: '/logo/light.png',
        width: 256,
        height: 256,
        alt: 'OG PDF Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OG PDF - Professional PDF Tools',
    description: 'Free online PDF tools for merging, splitting, compressing, editing, and converting PDFs.',
    images: ['/logo/light.png'],
    creator: '@ogpdf',
  },
  icons: {
    icon: [
      { url: '/logo/logo.svg', type: 'image/svg+xml' },
      { url: '/logo/light.png', sizes: '256x256', type: 'image/png' },
      { url: '/logo/light.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo/light.png', sizes: '128x128', type: 'image/png' },
      { url: '/logo/light.png', sizes: '96x96', type: 'image/png' },
      { url: '/logo/light.png', sizes: '64x64', type: 'image/png' },
      { url: '/logo/light.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo/light.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logo/logo.svg',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo/logo.svg" />
        <link rel="alternate icon" type="image/png" sizes="96x96" href="/logo/light.png" />
        <link rel="alternate icon" type="image/png" sizes="64x64" href="/logo/light.png" />
        <link rel="alternate icon" type="image/png" sizes="48x48" href="/logo/light.png" />
        <link rel="alternate icon" type="image/png" sizes="32x32" href="/logo/light.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                  
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fallback to light mode if there's an error
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
