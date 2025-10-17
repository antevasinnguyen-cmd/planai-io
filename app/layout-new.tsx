import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context-new'
import AuthSuccessMessage from '@/components/auth-success-message'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanAI - Biến dữ liệu thô thành bản kế hoạch đáng mơ ước',
  description: 'Ứng dụng công nghệ giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập.',
  keywords: 'AI, kế hoạch tài chính, kiếm tiền, tăng thu nhập, Việt Nam, SaaS',
  authors: [{ name: 'PlanAI Team' }],
  openGraph: {
    title: 'PlanAI - AI Financial Planning',
    description: 'Biến dữ liệu thô thành bản kế hoạch đáng mơ ước',
    url: 'https://planai.io',
    siteName: 'PlanAI',
    locale: 'vi_VN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Google Analytics - Global site tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-20FRPF1LFB"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-20FRPF1LFB');
          `}
        </Script>
        <AuthProvider>
          <AuthSuccessMessage />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
