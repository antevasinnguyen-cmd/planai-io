import { Target } from 'lucide-react'
import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ 
  href = '/', 
  size = 'md', 
  showText = true,
  className = ''
}: LogoProps) {
  const sizes = {
    sm: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-base' },
    md: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-2xl' }
  }

  const currentSize = sizes[size]

  const LogoContent = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${currentSize.container} bg-primary-500 rounded-lg flex items-center justify-center group hover:bg-primary-600 transition-colors`}>
        {/* Simple target icon */}
        <Target className={`${currentSize.icon} text-white`} strokeWidth={2.5} />
      </div>
      
      {showText && (
        <span className={`${currentSize.text} font-bold text-primary-600`}>
          PlanAI
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
