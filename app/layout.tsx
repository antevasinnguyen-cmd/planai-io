import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanAI - Biến dữ liệu thô thành bản kế hoạch đáng mơ ước',
  description: 'Ứng dụng công nghệ giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập.',
  keywords: 'AI, kế hoạch tài chính, kiếm tiền, tăng thu nhập, Việt Nam, SaaS',
  authors: [{ name: 'PlanAI Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#4F46E5',
  openGraph: {
    title: 'PlanAI - AI Financial Planning',
    description: 'Biến dữ liệu thô thành bản kế hoạch đáng mơ ước',
    url: 'https://planai.io',
    siteName: 'PlanAI',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PlanAI - AI Financial Planning',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <title>PlanAI - Biến dữ liệu thô thành bản kế hoạch đáng mơ ước</title>
        <meta name="description" content="Ứng dụng công nghệ giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập." />
        <meta name="keywords" content="AI, kế hoạch tài chính, kiếm tiền, tăng thu nhập, Việt Nam, SaaS" />
        <meta name="author" content="PlanAI Team" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#4F46E5" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="PlanAI - AI Financial Planning" />
        <meta property="og:description" content="Biến dữ liệu thô thành bản kế hoạch đáng mơ ước" />
        <meta property="og:url" content="https://planai.io" />
        <meta property="og:site_name" content="PlanAI" />
        <meta property="og:locale" content="vi_VN" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="PlanAI - AI Financial Planning" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-20FRPF1LFB"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-20FRPF1LFB');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
