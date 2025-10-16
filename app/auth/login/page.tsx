import { redirect } from 'next/navigation'

export default function AuthLoginPage() {
  // Redirect đến trang login chính
  redirect('/login')
}
