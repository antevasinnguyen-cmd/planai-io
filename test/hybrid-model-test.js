// Test script for hybrid model approach
require('dotenv').config({ path: '.env.local' });

const { generateChatResponse, generateFinancialPlan, analyzeUserInput } = require('../lib/openai');
const { fallbackToClaudeIfNeeded } = require('../lib/modelSelection');
const { generateClaudeResponse } = require('../lib/claude');
const { chunkText, retrieveRelevantChunks, enhanceQueryWithRAG } = require('../lib/rag');

// Test data
const userId = 'test-user-id';
const testMessages = [
  { role: 'user', content: 'Tôi muốn lập kế hoạch tài chính để mua nhà trong 5 năm tới' }
];

const testUserProfile = {
  full_name: 'Nguyễn Văn A',
  age: 30,
  occupation: 'Kỹ sư phần mềm',
  current_income: 25000000,
  financial_goal: 'Mua nhà trong 5 năm tới',
  timeline: '5 năm',
  risk_tolerance: 'Trung bình',
  maxWords: 1000
};

// Test functions
async function runTests() {
  console.log('=== TESTING HYBRID MODEL APPROACH ===');
  
  try {
    console.log('\n1. Testing chat response with GPT-4o-mini:');
    const chatResponse = await generateChatResponse(testMessages);
    console.log('Chat response:', chatResponse.substring(0, 100) + '...');
    
    console.log('\n2. Testing financial plan generation with GPT-4o:');
    const planResponse = await generateFinancialPlan(testUserProfile);
    console.log('Plan response length:', planResponse.length);
    console.log('Plan sample:', planResponse.substring(0, 100) + '...');
    
    console.log('\n3. Testing user input analysis:');
    const analysisResponse = await analyzeUserInput('Tôi đang kiếm 25 triệu/tháng và muốn mua nhà trong 5 năm');
    console.log('Analysis response:', JSON.stringify(analysisResponse, null, 2));
    
    console.log('\n4. Testing Claude fallback:');
    const fallbackResponse = await fallbackToClaudeIfNeeded([
      { role: 'system', content: 'Bạn là trợ lý tài chính' },
      { role: 'user', content: 'Tôi nên đầu tư vào đâu với 100 triệu?' }
    ]);
    console.log('Fallback response:', fallbackResponse.substring(0, 100) + '...');
    
    console.log('\n5. Testing RAG chunking:');
    const chunks = chunkText('Đây là một kế hoạch tài chính dài. '.repeat(50), 200);
    console.log('Number of chunks:', chunks.length);
    console.log('First chunk:', chunks[0]);
    
    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
