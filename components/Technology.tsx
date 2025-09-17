'use client'

import { Brain, Database, Zap, Shield, Globe, Cpu } from 'lucide-react'

const technologies = [
  {
    name: 'GPT-5',
    description: 'AI Language Model tiên tiến',
    icon: Brain,
    color: 'from-green-500 to-emerald-600'
  },
  {
    name: 'Claude Opus',
    description: 'AI Assistant thông minh',
    icon: Cpu,
    color: 'from-purple-500 to-violet-600'
  },
  {
    name: 'Grok',
    description: 'Real-time AI Processing',
    icon: Zap,
    color: 'from-orange-500 to-red-600'
  },
  {
    name: 'Google Gemini',
    description: 'Multimodal AI Platform',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    name: 'DeepSeek',
    description: 'Advanced Reasoning AI',
    icon: Cpu,
    color: 'from-teal-500 to-cyan-600'
  },
  {
    name: 'OpenAI o1',
    description: 'Chain-of-Thought Reasoning',
    icon: Zap,
    color: 'from-rose-500 to-pink-600'
  },
  {
    name: 'Supabase',
    description: 'Backend-as-a-Service',
    icon: Database,
    color: 'from-emerald-500 to-green-600'
  },
  {
    name: 'Vercel',
    description: 'Cloud Platform',
    icon: Globe,
    color: 'from-gray-700 to-gray-900'
  },
  {
    name: 'Enterprise Security',
    description: 'Bảo mật cấp doanh nghiệp',
    icon: Shield,
    color: 'from-indigo-500 to-blue-600'
  }
]

export default function Technology() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Công Nghệ Tiên Tiến Được Áp Dụng
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            PlanAI sử dụng những công nghệ AI và cloud computing hàng đầu thế giới để mang đến trải nghiệm tốt nhất
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${tech.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <tech.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tech.name}
              </h3>
              
              <p className="text-gray-600">
                {tech.description}
              </p>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          ))}
        </div>

        {/* Technology Stack Highlight */}
        <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Kiến Trúc Hệ Thống Hiện Đại
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto whitespace-nowrap">
              Được xây dựng trên nền tảng cloud-native với khả năng mở rộng không giới hạn và độ tin cậy 99.9%
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="bg-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-primary-400 mb-2">99.9%</div>
                <div className="text-gray-300">Uptime</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">&lt;200ms</div>
                <div className="text-gray-300">Response Time</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">256-bit</div>
                <div className="text-gray-300">Encryption</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-gray-300">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
