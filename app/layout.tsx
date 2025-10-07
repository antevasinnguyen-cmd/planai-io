import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanAI - Biến dữ liệu thô thành bản kế hoạch đáng mơ ước',
  description: 'Webapp SaaS áp dụng AI giúp người dùng lập kế hoạch / xây dựng chiến lược cá nhân hoá cho mục tiêu tài chính, kiếm tiền, tăng thu nhập.',
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
    <html lang="vi" suppressHydrationWarning>
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
