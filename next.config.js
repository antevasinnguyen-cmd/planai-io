/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'planai.io'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SEPAY_API_KEY: process.env.SEPAY_API_KEY,
    GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
  },
}

module.exports = nextConfig
