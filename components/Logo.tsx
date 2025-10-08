import { Sparkles } from 'lucide-react'
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
    sm: { container: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-base' },
    md: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-2xl' }
  }

  const currentSize = sizes[size]

  const LogoContent = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${currentSize.container} bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 relative overflow-hidden group`}>
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Main icon */}
        <Sparkles className={`${currentSize.icon} text-white relative z-10`} />
        
        {/* Small target dot */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
      </div>
      
      {showText && (
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
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
