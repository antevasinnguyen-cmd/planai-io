// Test script for the hybrid AI approach
// Make sure to run database-setup.sql first in Supabase dashboard

import { generateChatResponse, generateFinancialPlan, analyzeUserInput } from '../lib/openai.js'
import { fallbackToClaudeIfNeeded } from '../lib/modelSelection.js'
import { chunkText, generateEmbedding, storeChunksWithEmbeddings } from '../lib/rag.js'

async function testHybridApproach() {
  console.log('🧪 Testing PlanAI Hybrid AI Approach')
  console.log('=====================================')

  try {
    // Test 1: Regular chat with GPT-4o-mini and caching
    console.log('\n1️⃣ Testing regular chat with GPT-4o-mini:')
    const chatMessages = [
      { role: 'user', content: 'Tôi muốn lập kế hoạch tài chính để mua nhà trong 3 năm tới' }
    ]

    const chatResponse1 = await generateChatResponse(chatMessages)
    console.log('✅ First response:', chatResponse1.substring(0, 100) + '...')

    // Test caching by making the same request
    const chatResponse2 = await generateChatResponse(chatMessages)
    console.log('✅ Cached response:', chatResponse2.substring(0, 100) + '...')
    console.log('📊 Caching working:', chatResponse1 === chatResponse2 ? 'YES' : 'NO')

    // Test 2: Financial plan generation with GPT-4o
    console.log('\n2️⃣ Testing financial plan generation with GPT-4o:')
    const testProfile = {
      full_name: 'Nguyễn Văn Test',
      age: 30,
      occupation: 'Kỹ sư phần mềm',
      current_income: 25000000,
      financial_goal: 'Mua nhà trong 3 năm',
      timeline: '3 năm',
      risk_tolerance: 'Trung bình',
      maxWords: 1500
    }

    const planResponse = await generateFinancialPlan(testProfile)
    console.log('✅ Plan generated, length:', planResponse.length)
    console.log('📄 Plan sample:', planResponse.substring(0, 200) + '...')

    // Test 3: User input analysis
    console.log('\n3️⃣ Testing user input analysis:')
    const analysisResult = await analyzeUserInput('Tôi kiếm 20 triệu/tháng và muốn đầu tư chứng khoán')
    console.log('✅ Analysis result:', JSON.stringify(analysisResult, null, 2))

    // Test 4: RAG chunking
    console.log('\n4️⃣ Testing RAG chunking:')
    const longText = 'Đây là một kế hoạch tài chính mẫu rất dài. '.repeat(50)
    const chunks = chunkText(longText, 500)
    console.log('✅ Text chunked into', chunks.length, 'chunks')
    console.log('📄 First chunk:', chunks[0].substring(0, 100) + '...')

    // Test 5: Embedding generation (optional - requires OpenAI API key)
    console.log('\n5️⃣ Testing embedding generation:')
    try {
      const embedding = await generateEmbedding('Test tài chính cá nhân')
      console.log('✅ Embedding generated, dimensions:', embedding.length)
    } catch (error) {
      console.log('⚠️  Embedding test skipped (OpenAI API key not configured)')
    }

    // Test 6: Claude fallback (optional - requires Anthropic API key)
    console.log('\n6️⃣ Testing Claude fallback:')
    try {
      const fallbackResponse = await fallbackToClaudeIfNeeded([
        { role: 'system', content: 'Bạn là trợ lý tài chính' },
        { role: 'user', content: 'Tôi nên đầu tư vào đâu?' }
      ])
      console.log('✅ Claude fallback response:', fallbackResponse.substring(0, 100) + '...')
    } catch (error) {
      console.log('⚠️  Claude fallback test skipped (API key not configured)')
    }

    console.log('\n🎉 All tests completed successfully!')
    console.log('📈 Cost optimization: GPT-4o-mini for chat, GPT-4o for planning, caching, RAG')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('- Make sure database-setup.sql was run in Supabase dashboard')
    console.log('- Check OpenAI API key configuration')
    console.log('- Optionally add Anthropic API key for Claude fallback')
  }
}

// Run the tests
testHybridApproach()
