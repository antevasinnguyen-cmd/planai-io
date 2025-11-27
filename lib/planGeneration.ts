/**
 * Advanced Plan Generation with Micro-tasks
 * Generates detailed financial plans with daily/weekly/monthly tasks
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { selectModel, TaskType } from './modelSelection'
import { getMicroTasksSystemPrompt, getFinancialPlanSystemPrompt } from './prompts'

// Small utility: clamp a number between [lo, hi]
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))
const shouldRetry = (err: any): boolean => {
  try {
    const e = err || {}
    const msg: string = String((e?.message || e?.toString || '') && (e.message || e.toString()))
    const status: number | undefined = (e?.status || e?.code)
    if (status && [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status))) return true
    if (/timeout|timed out|ECONNRESET|ENETRESET|EHOSTUNREACH|ENOTFOUND|connection reset by peer|incomplete envelope|protocol error/i.test(msg)) return true
  } catch {}
  return false
}

async function aiTextWithFallback(
  system: string | null | undefined,
  user: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const OPENAI_ATTEMPTS = 2
  for (let i = 0; i < OPENAI_ATTEMPTS; i++) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const messages: any[] = system
        ? [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        : [{ role: 'user', content: user }]
      const c = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: Math.min(maxTokens, 2000)
      })
      const text = c.choices?.[0]?.message?.content || ''
      if (text && text.trim().length > 0) return text
    } catch (err) {
      if (i < OPENAI_ATTEMPTS - 1 && shouldRetry(err)) {
        await sleep(500 * (i + 1))
        continue
      }
      break
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key missing')
  const CLAUDE_ATTEMPTS = 2
  for (let j = 0; j < CLAUDE_ATTEMPTS; j++) {
    try {
      const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const resp = await claude.messages.create({
        model: 'claude-3-5-haiku-20241022',
        system: system || undefined,
        max_tokens: Math.min(maxTokens, 2000),
        temperature,
        messages: [
          { role: 'user', content: user }
        ]
      })
      const c0: any = resp.content?.[0]
      const text = c0 && c0.type === 'text' ? String(c0.text || '') : ''
      if (text && text.trim().length > 0) return text
      throw new Error('Empty Claude response')
    } catch (err) {
      if (j < CLAUDE_ATTEMPTS - 1 && shouldRetry(err)) {
        await sleep(500 * (j + 1))
        continue
      }
      throw err
    }
  }
  throw new Error('All model providers failed')
}

export interface MicroTask {
  priority: 'P0' | 'P1' | 'P2'
  task: string
  duration: string
  description?: string
}

export interface DailyTasks {
  weekday: {
    tasks: MicroTask[]
  }
  weekend: {
    tasks: MicroTask[]
  }
}

export interface WeeklyChecklist {
  tasks: string[]
}

export interface MonthlyChecklist {
  tasks: string[]
}

export interface DetailedPlan {
  summary: string
  analysis: string
  problems: string
  solutions: string
  roadmap: string
  microTasks: DailyTasks
  weeklyChecklist: WeeklyChecklist
  monthlyChecklist: MonthlyChecklist
  learningResources: string
  spiritualAnalysis: string
  insights: string
}

/**
 * Generate micro-tasks for a financial plan
 */
export const generateMicroTasks = async (
  userProfile: any,
  goal: string,
  timeline: string
): Promise<DailyTasks> => {
  try {
    const prompt = `Tạo danh sách micro-tasks hàng ngày chi tiết cho người dùng:

Thông tin:
- Mục tiêu: ${goal}
- Thời gian: ${timeline}
- Thu nhập: ${userProfile.current_income?.toLocaleString()} VNĐ/tháng
- Kỹ năng: ${userProfile.occupation}
- Thời gian có sẵn: ${userProfile.available_hours || '10-15'} giờ/tuần

Tạo tasks cho ngày làm việc (Thứ 2-5) và cuối tuần (Thứ 6-7).
Mỗi task phải có:
- priority: P0 (bắt buộc), P1 (quan trọng), P2 (tùy chọn)
- task: Mô tả task
- duration: Thời gian ước tính (phút/giờ)
- description: Chi tiết thêm

Trả về JSON hợp lệ theo cấu trúc:
{
  "weekday": {
    "tasks": [
      {
        "priority": "P0",
        "task": "...",
        "duration": "...",
        "description": "..."
      }
    ]
  },
  "weekend": {
    "tasks": [...]
  }
}`

    const response = await aiTextWithFallback(getMicroTasksSystemPrompt(), prompt, 1400, 0.7)
    
    try {
      const text = String(response || '')
      const fence = /```json\s*([\s\S]*?)```/i.exec(text)
      const jsonStr = fence ? fence[1] : text
      return JSON.parse(jsonStr)
    } catch {
      return {
        weekday: {
          tasks: [
            {
              priority: 'P0',
              task: 'Làm việc trên mục tiêu chính',
              duration: '2-3 giờ',
              description: 'Tập trung vào công việc chính để đạt mục tiêu',
            },
            {
              priority: 'P1',
              task: 'Ghi chép tiến độ',
              duration: '15 phút',
              description: 'Cập nhật tiến độ hàng ngày',
            },
          ],
        },
        weekend: {
          tasks: [
            {
              priority: 'P0',
              task: 'Học kỹ năng mới',
              duration: '1-2 giờ',
              description: 'Học một kỹ năng liên quan đến mục tiêu',
            },
            {
              priority: 'P1',
              task: 'Lập kế hoạch tuần sau',
              duration: '30 phút',
              description: 'Chuẩn bị cho tuần tiếp theo',
            },
          ],
        },
      }
    }
  } catch (error) {
    console.error('Error generating micro-tasks:', error)
    return {
      weekday: {
        tasks: [],
      },
      weekend: {
        tasks: [],
      },
    }
  }
}

/**
 * Generate weekly checklist
 */
export const generateWeeklyChecklist = async (goal: string): Promise<WeeklyChecklist> => {
  try {
    const prompt = `Tạo checklist hàng tuần (5-7 items) cho mục tiêu: ${goal}

Mỗi item phải:
- Cụ thể & có thể đo lường được
- Liên quan đến mục tiêu chính
- Có thể hoàn thành trong 1 tuần

Trả về JSON:
{
  "tasks": ["item 1", "item 2", ...]
}`

    const response = await aiTextWithFallback('Bạn là trợ lý lập kế hoạch. Trả về JSON hợp lệ.', prompt, 800, 0.7)
    
    try {
      return JSON.parse(response)
    } catch {
      return {
        tasks: [
          'Hoàn thành các task hàng ngày',
          'Kiểm tra tiến độ tuần',
          'Học kỹ năng mới',
          'Cập nhật kế hoạch',
          'Ghi chép kết quả',
        ],
      }
    }
  } catch (error) {
    console.error('Error generating weekly checklist:', error)
    return {
      tasks: [],
    }
  }
}

/**
 * Generate monthly checklist
 */
export const generateMonthlyChecklist = async (goal: string): Promise<MonthlyChecklist> => {
  try {
    const prompt = `Tạo checklist hàng tháng (5-7 items) cho mục tiêu: ${goal}

Mỗi item phải:
- Đo lường tiến độ hàng tháng
- Liên quan đến mục tiêu chính
- Giúp điều chỉnh kế hoạch

Trả về JSON:
{
  "tasks": ["item 1", "item 2", ...]
}`
    const response = await aiTextWithFallback('Bạn là trợ lý lập kế hoạch. Trả về JSON hợp lệ.', prompt, 800, 0.7)
    
    try {
      const text = String(response || '')
      const fence = /```json\s*([\s\S]*?)```/i.exec(text)
      const jsonStr = fence ? fence[1] : text
      return JSON.parse(jsonStr)
    } catch {
      return {
        tasks: [
          'Đánh giá tiến độ tháng',
          'Điều chỉnh kế hoạch nếu cần',
          'Học 1 khóa online hoàn chỉnh',
          'Gặp gỡ mentor hoặc bạn có kinh nghiệm',
          'Cập nhật kế hoạch & mục tiêu',
        ],
      }
    }
  } catch (error) {
    console.error('Error generating monthly checklist:', error)
    return {
      tasks: [],
    }
  }
}

/**
 * Generate learning resources with real, working links
 */
export const generateLearningResources = async (
  goal: string,
  occupation: string
): Promise<string> => {
  // Helper: reject link chung chung, youtube.com, example.com, coursera.org...
  const isInvalidLink = (url: string) => /example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com|youtube\.com(\/|$)(?!channel)|coursera\.org(\/|$)|edx\.org(\/|$)|google\.com(\/|$)|linkedin\.com(\/|$)|facebook\.com|tiktok\.com|zalo\.me|vnexpress\.net|dantri\.com|cafef\.vn|kenh14\.vn|vietnamnet\.vn|tuoitre\.vn|thanhnien\.vn|zingnews\.vn|bnews\.vn|vneconomy\.vn|cafebiz\.vn|vietstock\.vn|stockbiz\.vn|cafeland\.vn|webtretho\.com|vozforums\.com|reddit\.com|stackoverflow\.com|github\.com|bitbucket\.org|gitlab\.com/i.test(url)
  // Helper: chỉ cho phép brandcamp.asia nếu là web Việt Nam
  const isAllowedVietnamese = (url: string) => url.includes('brandcamp.asia')

  try {
    const prompt = `Tạo danh sách tài liệu học tập CHI TIẾT, CHỈ LẤY LINK THẬT, cho mục tiêu: ${goal}
Ngành: ${occupation}

QUAN TRỌNG:
- Chỉ lấy link thật, KHÔNG lấy link chung chung (youtube.com, example.com, coursera.org, v.v.).
- Link YouTube PHẢI là link kênh uy tín (≥10.000 sub, tiếng Anh, đúng kỹ năng, có tên kênh rõ ràng, KHÔNG dùng link video lẻ).
- Không gợi ý web Việt Nam trừ https://www.brandcamp.asia/.
- ƯU TIÊN nguồn nước ngoài, tiếng Anh, web uy tín (Coursera, Google, LinkedIn Learning, Skillshare, TED, v.v.).
- Nếu không có link thật, PHẢI ghi rõ từ khoá tìm kiếm (tối thiểu 5 từ khoá liên quan) và nền tảng uy tín để user tự tra cứu.
- GHI RÕ TÊN khoá học/video/sách, mô tả chi tiết, và link phải đúng với tên đó. Nếu không chắc link, chỉ ghi từ khoá và nền tảng.
- Bao gồm mô tả chi tiết về nội dung, lợi ích, lý do chọn, và cách áp dụng.

Cấu trúc bắt buộc:

## 📚 PHẦN 1: KỸ NĂNG TÀI CHÍNH CỐ LỖI
1. [Tên khóa học]
   - Link: [URL đầy đủ hoặc ghi rõ TỪ KHOÁ TÌM KIẾM nếu không có link]
   - Mục tiêu: [Mô tả chi tiết]
   - Thời lượng: [Thời gian học]
   - Lý do chọn: [Tại sao phù hợp]
   - Cách áp dụng: [Cách sử dụng vào công việc]

## 🚀 PHẦN 2: KỸ NĂNG CHUYÊN MÔN THEO NGÀNH
[Tương tự như trên]

## 📖 PHẦN 3: SÁCH THAM KHẢO
[Tương tự như trên]

## 🎥 PHẦN 4: YOUTUBE CHANNELS
[Tương tự như trên]

## 💡 PHẦN 5: CÔNG CỤ HỖ TRỢ
[Tương tự như trên]

Format: Markdown với headings rõ ràng, đầy đủ thông tin, link hoạt động 100% hoặc từ khoá tìm kiếm rõ ràng.`

    let resources = await aiTextWithFallback('Bạn là chuyên gia tư vấn học tập. Cung cấp tài liệu chất lượng cao với link thực tế, hoạt động được. Mỗi tài liệu phải có mô tả chi tiết và link trực tiếp.', prompt, 2500, 0.7)

    // Nếu phát hiện link chung chung hoặc link Việt Nam không phải brandcamp, thay thế bằng từ khoá tìm kiếm
    resources = resources.replace(/\bhttps?:\/\/(www\.)?(example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com|youtube\.com(?!\/channel)|coursera\.org|edx\.org|google\.com|linkedin\.com|facebook\.com|tiktok\.com|zalo\.me|vnexpress\.net|dantri\.com|cafef\.vn|kenh14\.vn|vietnamnet\.vn|tuoitre\.vn|thanhnien\.vn|zingnews\.vn|bnews\.vn|vneconomy\.vn|cafebiz\.vn|vietstock\.vn|stockbiz\.vn|cafeland\.vn|webtretho\.com|vozforums\.com|reddit\.com|stackoverflow\.com|github\.com|bitbucket\.org|gitlab\.com)\S*/gi, '[TỪ KHOÁ TÌM KIẾM: vui lòng tra cứu trên nền tảng uy tín quốc tế như Coursera, Google, LinkedIn Learning, TED, Brandcamp.asia]')
    // Không cho phép web Việt Nam trừ brandcamp.asia
    resources = resources.replace(/\bhttps?:\/\/(www\.)?(?!brandcamp\.asia)[a-zA-Z0-9-]+\.vn\S*/gi, '[TỪ KHOÁ TÌM KIẾM: vui lòng tra cứu trên nền tảng uy tín quốc tế như Coursera, Google, LinkedIn Learning, TED, Brandcamp.asia]')

    // Nếu không có link thật, ép AI phải sinh từ khoá tìm kiếm
    if (!resources.includes('http')) {
      resources += '\n\n[TỪ KHOÁ TÌM KIẾM: vui lòng tra cứu trên Coursera, Google, LinkedIn Learning, TED, Brandcamp.asia với các từ khoá liên quan đến mục tiêu và kỹ năng của bạn]'
    }

    // Detect placeholder or fake links and try to regenerate if necessary
    const hasFakeLinks = /(example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com)/i.test(resources)
    if (hasFakeLinks) {
      console.warn('Generated resources contain placeholder/fake URLs - attempting to regenerate with stronger prompt')
      
      try {
        // Try again with more forceful prompt
        const retryPrompt = `Tạo danh sách tài liệu học tập với LINK THỰC TẾ (KHÔNG PHẢI example.com) cho: ${goal}
Ngành: ${occupation}
\n\nLỖI NGHIÊM TRỌNG: Link giả/placeholder đã được phát hiện trong response trước đó.\n\nQUAN TRỌNG:\n- MỖI tài liệu PHẢI có link CÓ THẬT đến trang web thực tế (Coursera, edX, Khan Academy, LinkedIn Learning, Udemy)\n- TUYỆT ĐỐI KHÔNG dùng example.com, placeholder.com, domain.com, etc.\n- Nếu không chắc chắn về URL, hãy sử dụng link thực tế đến trang chủ khoá học\n\nCấu trúc giống như trước.`
        
        const retryResources = await aiTextWithFallback('Bạn là chuyên gia tư vấn học tập. Cung cấp tài liệu với link THỰC TẾ (KHÔNG PHẢI example.com). Nếu không chắc về URL cụ thể, dùng trang chủ của nguồn thực tế.', retryPrompt, 2500, 0.7)
        
        // Use retry resources only if they don't contain placeholder links
        if (!/(example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com)/i.test(retryResources)) {
          return retryResources
        }
      } catch (retryError) {
        console.error('Error during resource regeneration:', retryError)
        // Fall through to original resources if retry fails
      }
    }
    
    return resources
  } catch (error) {
    console.error('Error generating learning resources:', error)
    return 'Không thể tạo danh sách tài liệu. Vui lòng thử lại.'
  }
}

// --- Smoke tests: validate output content without altering behavior
export function smokeCheckPlanContent(content: string, tier: string = 'free'): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  const text = String(content || '')
  const has = (re: RegExp) => re.test(text)
  const wc = text.trim().split(/\s+/).length
  const min = tier === 'free' ? 3000 : 20000
  const max = tier === 'free' ? 5000 : 50000
  if (wc < min) issues.push(`word_count_below_min:${wc}<${min}`)
  if (wc > max) issues.push(`word_count_above_max:${wc}>${max}`)
  if (has(/VALIDATION/i)) issues.push('banned:VALIDATION')
  if (has(/Giả định/i)) issues.push('banned:Gia_dinh')
  if (has(/Kiểm\s*tra/i)) issues.push('banned:Kiem_tra')
  if (has(/```mermaid[\s\S]*?```/i)) issues.push('banned:mermaid_block')
  if (has(/\|\s*[-:]+\s*\|/)) issues.push('banned:markdown_table')
  if (has(/example\.com|placeholder|\[URL cụ thể\]/i)) issues.push('banned:placeholder_or_fake_link')
  return { ok: issues.length === 0, issues }
}

/**
 * Format micro-tasks for display
 */
export const formatMicroTasks = (tasks: DailyTasks): string => {
  let formatted = '📝 MICRO-TASKS HÀNG NGÀY:\n\n'

  formatted += '**Thứ 2-5 (Ngày làm việc):**\n'
  tasks.weekday.tasks.forEach((task) => {
    formatted += `- ${task.priority}: ${task.task} (${task.duration})\n`
    if (task.description) {
      formatted += `  ${task.description}\n`
    }
  })

  formatted += '\n**Thứ 6-7 (Cuối tuần):**\n'
  tasks.weekend.tasks.forEach((task) => {
    formatted += `- ${task.priority}: ${task.task} (${task.duration})\n`
    if (task.description) {
      formatted += `  ${task.description}\n`
    }
  })

  return formatted
}

/**
 * Format checklists for display
 */
export const formatChecklists = (
  weekly: WeeklyChecklist,
  monthly: MonthlyChecklist
): string => {
  let formatted = '✅ CHECKLIST:\n\n'

  formatted += '**Hàng tuần:**\n'
  weekly.tasks.forEach((task) => {
    formatted += `- [ ] ${task}\n`
  })

  formatted += '\n**Hàng tháng:**\n'
  monthly.tasks.forEach((task) => {
    formatted += `- [ ] ${task}\n`
  })

  return formatted
}

/**
 * Creates a structured analytical report from raw user input.
 * This acts as the "Analytical Brain" to standardize data before plan generation.
 */
const createAnalyticalReport = async (collectedInfo: any, goal: string): Promise<any> => {
  // CRITICAL: Include chat_summary for full context extraction
  const chatContext = collectedInfo.chat_summary || '';
  const userInputSummary = `
MỤC TIÊU: ${goal}

DỮ LIỆU TỪ FORM:
${JSON.stringify(collectedInfo, null, 2)}

TOÀN BỘ NỘI DUNG CHAT CỦA NGƯỜI DÙNG (QUAN TRỌNG - ĐỌC KỸ MỌI CON SỐ):
${chatContext}
`;

  const systemPrompt = `
Bạn là một chuyên gia phân tích dữ liệu tài chính. Nhiệm vụ của bạn là đọc một khối dữ liệu thô từ người dùng và chuyển đổi nó thành một bản báo cáo JSON có cấu trúc chặt chẽ. TUYỆT ĐỐI chỉ trả về JSON, không có bất kỳ văn bản nào khác.

CẤU TRÚC JSON ĐẦU RA BẮT BUỘC:
{
  "analysis": {
    "current_income": {
      "min": number | null,
      "max": number | null,
      "average": number | null,
      "text": string
    },
    "current_savings": number | null,
    "asset_goals": [
      { "item": string, "value": number, "timeline": string }
    ],
    "total_asset_goal": number,
    "income_goal": number | null,
    "timeline": string | null,
    "skills": string[] | null,
    "occupation": string | null,
    "location": string | null,
    "readiness": string | null
  }
}

QUY TẮC TRÍCH XUẤT (TUÂN THỦ TUYỆT ĐỐI - KHÔNG BỎ SÓT BẤT KỲ CON SỐ/KỸ NĂNG NÀO):

1.  **current_income**: 
    - Đọc KỸ chat để tìm "thu nhập", "kiếm được", "earning".
    - Nếu là khoảng (vd: "8 - 10 triệu", "8-10tr"), điền "min", "max", "average".
    - Nếu là một số, điền "average".
    - Chuyển đổi: "triệu" = 1,000,000; "tỷ" = 1,000,000,000; "tr" = 1,000,000.
    - VÍ DỤ: "8 đến 10 triệu" → min: 8000000, max: 10000000, average: 9000000.

2.  **current_savings** (CỰC KỲ QUAN TRỌNG - PHÂN BIỆT HIỆN TẠI VS MỤC TIÊU):
    - ⚠️ **PHÂN BIỆT RÕ RÀNG**:
      * "đang có X tiết kiệm", "hiện có X", "hiện tại có X tiết kiệm", "số dư X" → ĐÂY LÀ current_savings (HIỆN TẠI)
      * "có tài khoản tiết kiệm X", "tiết kiệm X", "mục tiêu tiết kiệm X" → ĐÂY LÀ asset_goals (MỤC TIÊU), KHÔNG phải current_savings
    
    - **VÍ DỤ QUAN TRỌNG**:
      * "Mục tiêu: mua nhà 3 tỷ, xe 800tr, có tài khoản tiết kiệm 10 tỷ" 
        → current_savings: 0 (vì "có tài khoản tiết kiệm 10 tỷ" là MỤC TIÊU, không phải hiện tại)
        → asset_goals: [{"item": "nhà", "value": 3000000000}, {"item": "xe", "value": 800000000}, {"item": "tài khoản tiết kiệm", "value": 10000000000}]
      
      * "Hiện tại đang có 300 triệu tiết kiệm, muốn có 10 tỷ"
        → current_savings: 300000000 (vì "đang có 300 triệu" là HIỆN TẠI)
        → asset_goals: [{"item": "tiết kiệm mục tiêu", "value": 10000000000}]
    
    - **CHỈ GHI NHẬN current_savings KHI**:
      * Có từ khoá chỉ hiện tại: "đang có", "hiện có", "hiện tại có", "số dư hiện tại"
      * KHÔNG có từ khoá mục tiêu: "muốn", "mục tiêu", "cần", "dự định"
    
    - Nhận dạng đơn vị: "triệu", "tr" = 1.000.000; "tỷ", "ty", "bn" = 1.000.000.000.
    - Nếu KHÔNG tìm thấy tiết kiệm HIỆN TẠI, trả về 0 (không phải null).
    - ⚠️ **LƯU Ý**: Đa số trường hợp "có tài khoản tiết kiệm X" là MỤC TIÊU, KHÔNG phải current_savings!

3.  **asset_goals**: 
    - Liệt kê TẤT CẢ các mục tiêu tích lũy tài sản (nhà, xe, tiết kiệm mục tiêu).
    - **BAO GỒM**: "có tài khoản tiết kiệm X", "tiết kiệm X", "mục tiêu tiết kiệm X" (đây là MỤC TIÊU, không phải hiện tại).
    - TÍNH TỔNG chúng vào "total_asset_goal".
    - **VÍ DỤ QUAN TRỌNG**: 
      * "Mục tiêu: mua nhà 3 tỷ, xe 800 triệu, có tài khoản tiết kiệm 10 tỷ" 
        → asset_goals: [{"item": "nhà", "value": 3000000000}, {"item": "xe", "value": 800000000}, {"item": "tài khoản tiết kiệm", "value": 10000000000}]
        → total_asset_goal: 13800000000
        → current_savings: 0 (vì không có thông tin về tiết kiệm HIỆN TẠI)

4.  **income_goal**: 
    - Ghi nhận mục tiêu thu nhập (vd: "kiếm 1 tỷ/tháng", "thu nhập 1 tỷ").
    - Đây là PHƯƠNG TIỆN, KHÔNG cộng vào "total_asset_goal".
    - VÍ DỤ: "mục tiêu kiếm 1 tỷ/tháng" → income_goal: 1000000000.

5.  **Luôn trả về số**: Mọi giá trị tiền tệ phải là kiểu number (VÍ DỤ: 300000000), KHÔNG phải string.

6.  **location**: Chỉ điền nếu người dùng nêu rõ (ví dụ: "TP.HCM", "Hà Nội", "Sài Gòn"). Nếu không có, trả về null.

7.  **skills**:
    - Trích xuất mảng kỹ năng từ chat hoặc mô tả tự do. Tách theo dấu phẩy/dấu chấm/phép liệt kê.
    - Nhận diện các biến thể phổ biến: "marketing", "digital marketing", "chạy ads", "quảng cáo Facebook/Google", "tiktok", "youtube", "sáng tạo nội dung", "content", "làm sản phẩm", "product", "SEO", "email marketing", "growth".
    - Chuẩn hoá về dạng chữ thường tiếng Việt/Anh, loại bỏ trùng lặp.
    - Ví dụ: "Có kinh nghiệm marketing, chạy ads, làm tiktok/youtube, sáng tạo nội dung, làm sản phẩm" → ["marketing", "chạy ads", "tiktok", "youtube", "sáng tạo nội dung", "làm sản phẩm"].

8.  **KIỂM TRA LẠI**: Sau khi trích xuất, đọc lại chat một lần nữa để đảm bảo KHÔNG bỏ sót bất kỳ con số nào về tiền (thu nhập, tiết kiệm, mục tiêu) và KHÔNG bỏ sót kỹ năng/kinh nghiệm người dùng đã nêu.
`;

  try {
    const completionText = await aiTextWithFallback(
      systemPrompt,
      `Dữ liệu thô: ${userInputSummary}`,
      1800,
      0.0
    )
    const jsonResponse = completionText && completionText.trim()
    if (jsonResponse) {
      let payload = jsonResponse
      const fence = /```json\s*([\s\S]*?)```/i.exec(jsonResponse) || /```\s*([\s\S]*?)```/i.exec(jsonResponse)
      if (fence && fence[1]) {
        payload = fence[1].trim()
      } else if (!jsonResponse.trim().startsWith('{')) {
        // Try slicing between first { and last }
        const first = jsonResponse.indexOf('{')
        const last = jsonResponse.lastIndexOf('}')
        if (first >= 0 && last > first) payload = jsonResponse.slice(first, last + 1)
      }
      const parsed = JSON.parse(payload)
      // Only warn if chat mentions CURRENT savings (not goal) but extraction returned 0
      const hasCurrentSavingsKeywords = /(đang\s*có|đã\s*có|hiện\s*có|hiện\s*tại.*?có|số\s*dư).*?(\d+).*?(triệu|tỷ|tr)/i.test(chatContext)
      if (parsed.analysis?.current_savings === 0 && hasCurrentSavingsKeywords) {
        console.warn('⚠️ ANALYTICAL BRAIN WARNING: current_savings = 0 but chat mentions CURRENT savings with keywords like "đang có", "hiện có". Re-check extraction.')
      }
      return parsed
    }
    throw new Error('AI response was empty.')
  } catch (error) {
    console.error('Error creating analytical report:', error)
    return {
      analysis: {
        current_income: { average: collectedInfo.income || 0, text: String(collectedInfo.income || '') },
        current_savings: collectedInfo.current_savings || collectedInfo.savings || 0,
        asset_goals: [{ item: goal, value: 0, timeline: collectedInfo.timeline }],
        total_asset_goal: 0,
        income_goal: null,
        timeline: collectedInfo.timeline || null,
        skills: Array.isArray(collectedInfo.skills) ? collectedInfo.skills : (collectedInfo.skills ? [collectedInfo.skills] : []),
        occupation: collectedInfo.occupation || null,
        location: collectedInfo.location || null,
        readiness: collectedInfo.readiness || null,
      }
    }
  }
};

/**
 * Extract robust data from collected info with strong fallbacks
 */
function extractRobustData(collectedInfo: any, goal: string): any {
  const chatSummary = String(collectedInfo?.chat_summary || '')
  
  // Extract income with multiple fallback patterns
  let income = { min: 0, max: 0, average: 0 }
  const incomePatterns = [
    /(\d+(?:[.,]\d+)?)\s*[-–—tới đến]\s*(\d+(?:[.,]\d+)?)\s*(?:triệu)?\s*(?:VN[DĐ]|đồng)?\/tháng/i,
    /thu nhập[^\d]*(\d+(?:[.,]\d+)?)\s*[-–—tới đến]\s*(\d+(?:[.,]\d+)?)\s*(?:triệu)?/i,
    /lương[^\d]*(\d+(?:[.,]\d+)?)\s*[-–—tới đến]\s*(\d+(?:[.,]\d+)?)\s*(?:triệu)?/i,
    /(\d+(?:[.,]\d+)?)\s*(?:triệu)?\s*(?:VN[DĐ]|đồng)?\/tháng/i
  ]
  
  for (const pattern of incomePatterns) {
    const match = chatSummary.match(pattern)
    if (match) {
      if (match[2]) {
        income.min = parseFloat(match[1].replace(/,/g, '.')) * 1000000
        income.max = parseFloat(match[2].replace(/,/g, '.')) * 1000000
      } else {
        income.average = parseFloat(match[1].replace(/,/g, '.')) * 1000000
      }
      break
    }
  }
  
  // Extract timeline with fallback
  let timeline = ''
  const timelinePatterns = [
    /(\d+)\s*[-–—tới đến]\s*(\d+)\s*năm/i,
    /trong\s*(\d+)\s*năm/i,
    /timeline[^\d]*(\d+)\s*[-–—tới đến]\s*(\d+)\s*năm/i
  ]
  
  for (const pattern of timelinePatterns) {
    const match = chatSummary.match(pattern)
    if (match) {
      if (match[2]) {
        timeline = `${match[1]} – ${match[2]} năm`
      } else {
        timeline = `${match[1]} năm`
      }
      break
    }
  }
  
  // Extract savings
  let savings = 0
  const savingsPatterns = [
    /tiết kiệm[^\d]*(\d+(?:[.,]\d+)?)\s*(?:triệu|tỷ)?/i,
    /tài khoản[^\d]*(\d+(?:[.,]\d+)?)\s*(?:triệu|tỷ)?/i,
    /có\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tỷ)?/i
  ]
  
  for (const pattern of savingsPatterns) {
    const match = chatSummary.match(pattern)
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, '.'))
      if (match[0].includes('tỷ')) {
        savings = num * 1000000000
      } else {
        savings = num * 1000000
      }
      break
    }
  }
  
  return {
    ...collectedInfo,
    income,
    timeline: timeline || '2 – 3 năm',
    current_savings: savings || collectedInfo.current_savings,
    goal
  }
}

/**
 * Create clean analytical report without validation text
 */
async function createCleanAnalyticalReport(data: any, goal: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  // Format income for display
  let incomeText = ''
  if (data.income.min && data.income.max) {
    incomeText = `${(data.income.min/1000000).toFixed(0)} – ${(data.income.max/1000000).toFixed(0)} triệu VNĐ/tháng`
  } else if (data.income.average) {
    incomeText = `${(data.income.average/1000000).toFixed(0)} triệu VNĐ/tháng`
  } else if (data.current_income) {
    incomeText = `${(data.current_income/1000000).toFixed(0)} triệu VNĐ/tháng`
  } else {
    incomeText = '7 – 10 triệu VNĐ/tháng'
  }
  
  const prompt = `Phân tích thông tin người dùng và tạo báo cáo:

Thông tin:
- Mục tiêu: ${goal}
- Thu nhập: ${incomeText}
- Tiết kiệm: ${data.current_savings ? (data.current_savings/1000000).toFixed(0) + ' triệu VNĐ' : 'Chưa có'}
- Timeline: ${data.timeline}
- Tuổi: ${data.age || 25}
- Kỹ năng: ${data.skills || 'Đang phát triển'}

Tạo phân tích JSON:
{
  "current_income": <số tiền VNĐ/tháng>,
  "current_savings": <số tiền VNĐ>,  
  "goal": "<mục tiêu>",
  "timeline": "<thời gian>",
  "risk_tolerance": "<mức độ>",
  "skills": ["<kỹ năng>"]
}

LƯU Ý: Chỉ trả về JSON, không có text khác.`
  
  try {
    const response = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
    
    const content = response.choices[0].message.content || '{}'
    let analysis = JSON.parse(content)
    
    // Ensure all fields have values
    analysis = {
      current_income: analysis.current_income || data.income.average || data.income.min || 7000000,
      current_savings: analysis.current_savings || data.current_savings || 0,
      goal: analysis.goal || goal,
      timeline: analysis.timeline || data.timeline,
      risk_tolerance: analysis.risk_tolerance || 'moderate',
      skills: analysis.skills || []
    }
    
    return { analysis }
  } catch (error) {
    // Fallback if API fails
    return {
      analysis: {
        current_income: data.income.average || 7000000,
        current_savings: data.current_savings || 0,
        goal: goal,
        timeline: data.timeline,
        risk_tolerance: 'moderate',
        skills: data.skills ? data.skills.split(',') : []
      }
    }
  }
}

// ---
// Simplified Plan Generation V3 - Complete Rewrite
export async function generateLongPlanMultiStep(
  planName: string,
  goal: string,
  collectedInfo: any
): Promise<string> {
  const tier = String(collectedInfo?.tier || 'free')
  
  // Extract data with fallbacks
  const chatSummary = String(collectedInfo?.chat_summary || '')
  let income = '7 – 10 triệu VNĐ/tháng'
  let savings = '0'
  let timeline = '2 – 3 năm'
  let skills: string[] = []
  const ageVal = (typeof collectedInfo?.age === 'number' || typeof collectedInfo?.age === 'string') ? collectedInfo.age : null
  const familyStatusVal = collectedInfo?.family_status || ''
  const riskToleranceVal = collectedInfo?.risk_tolerance || 'moderate'
  const freeHoursPerWeekVal = typeof collectedInfo?.free_hours_per_week === 'number' ? collectedInfo.free_hours_per_week : null
  const debtsVndVal: number | null = typeof collectedInfo?.debts === 'number' ? collectedInfo.debts : null
  const assetsValueVndVal: number | null = typeof collectedInfo?.assets_value === 'number' ? collectedInfo.assets_value : null
  const assetsCategoriesVal: string[] = Array.isArray(collectedInfo?.assets) ? collectedInfo.assets : []
  
  // Analytical Brain: canonicalize data first
  let brain: any = null
  try {
    brain = await createAnalyticalReport(collectedInfo, goal)
  } catch {}

  // Use brain data if available, otherwise fallback to manual extraction
  if (brain?.analysis) {
    if (typeof brain.analysis.current_savings === 'number' && brain.analysis.current_savings > 0) {
      const brainSavings = brain.analysis.current_savings
      savings = brainSavings >= 1_000_000_000
        ? `${(brainSavings / 1_000_000_000).toFixed(1)} tỷ VNĐ`
        : `${Math.round(brainSavings / 1_000_000)} triệu VNĐ`
    }
    if (brain.analysis.current_income?.text) {
      income = brain.analysis.current_income.text
    }
    if (brain.analysis.skills?.length) {
      skills = brain.analysis.skills
    }
    if (brain.analysis.timeline) {
      timeline = brain.analysis.timeline
    }
  } else {
    // Try to extract income (range or single) — fallback if brain missing
    if (!brain?.analysis?.current_income?.text) {
      const incomeMatch =
        chatSummary.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–~]|tới|đến|to)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)?(?:\s*(?:VN[DĐ]|đồng))?\/tháng/i) ||
        chatSummary.match(/thu\s*nhập[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(?:[-–~]|tới|đến|to)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i)
      if (incomeMatch) {
        income = `${incomeMatch[1].replace(/[.,]/g,'')} – ${incomeMatch[2].replace(/[.,]/g,'')} triệu VNĐ/tháng`
      } else {
        const incomeSingle = chatSummary.match(/(?:thu\s*nhập|kiếm|lợi\s*nhuận)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)(?:\s*(?:VN[DĐ]|đồng))?\/tháng/i)
        if (incomeSingle) {
          income = `${incomeSingle[1].replace(/[.,]/g,'')} triệu VNĐ/tháng`
        }
      }
    }

    // Try to extract timeline
    if (!brain?.analysis?.timeline) {
      const timelineMatch = chatSummary.match(/(\d+)\s*(?:[-–~]|tới|đến|to)\s*(\d+)\s*năm/i)
      if (timelineMatch) {
        timeline = `${timelineMatch[1]} – ${timelineMatch[2]} năm`
      } else {
        const timelineSingleMatch = chatSummary.match(/(?:trong|trong\s*vòng)?\s*(\d+)\s*năm/i)
        if (timelineSingleMatch) {
          timeline = `${timelineSingleMatch[1]} năm`
        }
      }
    }
  }
  
  // Try to extract savings (prefer current over target) - only if brain didn't provide it
  let savingsVnd: number | null = null
  if (!brain?.analysis?.current_savings) {
    if (typeof collectedInfo?.current_savings === 'number' && collectedInfo.current_savings > 0) {
      savingsVnd = collectedInfo.current_savings
    } else {
      // Look for explicit current savings indicators
      const currentSavingsMatch = chatSummary.match(/(?:hiện\s*tại|\bđang\s*có|hiện\s*có|số\s*dư)[^\d]{0,30}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr)\s*(?:tiết\s*kiệm|gửi\s*ngân\s*hàng)/i)
      if (currentSavingsMatch) {
        const num = parseFloat(currentSavingsMatch[1].replace(/[.,]/g, ''))
        const unit = (currentSavingsMatch[2] || '').toLowerCase()
        savingsVnd = unit.includes('tỷ') || unit.includes('ty') ? num * 1_000_000_000 : num * 1_000_000
      } else {
        // Only match savings that are NOT in target context
        const isTargetContext = /mục\s*tiêu[^\n]{0,200}(tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm)\s*(\d+)/i.test(chatSummary)
        if (!isTargetContext) {
          const savingsOnly = chatSummary.match(/(?:tiết\s*kiệm|tài\s*khoản\s*tiết\s*kiệm)\s*(?:gửi\s*ngân\s*hàng)?[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr)/i)
          if (savingsOnly) {
            // Double check this is not in a target sentence
            const matchIndex = chatSummary.search(savingsOnly[0])
            const beforeMatch = chatSummary.substring(Math.max(0, matchIndex - 100), matchIndex)
            const afterMatch = chatSummary.substring(matchIndex, matchIndex + 100)
            const hasTargetKeywords = /mục\s*tiêu|trong\s*\d+\s*năm|có\s*\d+|muốn\s*có/i.test(beforeMatch + afterMatch)
            
            if (!hasTargetKeywords) {
              const num2 = parseFloat(savingsOnly[1].replace(/[.,]/g, ''))
              const unit2 = (savingsOnly[2] || '').toLowerCase()
              savingsVnd = unit2.includes('tỷ') || unit2.includes('ty') ? num2 * 1_000_000_000 : num2 * 1_000_000
            }
          }
        }
      }
    }
  }
  if (typeof savingsVnd === 'number' && savingsVnd > 0) {
    savings = savingsVnd >= 1_000_000_000
      ? `${(savingsVnd / 1_000_000_000).toFixed(1)} tỷ VNĐ`
      : `${Math.round(savingsVnd / 1_000_000)} triệu VNĐ`
  }
  
  // Extract skills if available - only if brain didn't provide them
  if (!brain?.analysis?.skills?.length) {
    if (collectedInfo.skills) {
      skills = Array.isArray(collectedInfo.skills) ? collectedInfo.skills : [collectedInfo.skills]
    }
    if (!skills || skills.length === 0) {
      const dict = [
        { re: /digital\s*marketing/i, val: 'digital marketing' },
        { re: /\bmarketing\b/i, val: 'marketing' },
        { re: /chạy\s*ads|quảng\s*cáo|\bads\b/i, val: 'chạy ads' },
        { re: /facebook\s*ads/i, val: 'facebook ads' },
        { re: /google\s*ads/i, val: 'google ads' },
        { re: /tiktok/i, val: 'tiktok' },
        { re: /youtube/i, val: 'youtube' },
        { re: /sáng\s*tạo\s*nội\s*dung|\bcontent\b/i, val: 'sáng tạo nội dung' },
        { re: /làm\s*sản\s*phẩm|\bproduct\b/i, val: 'làm sản phẩm' },
        { re: /\bseo\b/i, val: 'SEO' },
        { re: /email\s*marketing/i, val: 'email marketing' },
        { re: /kinh\s*doanh\s*online/i, val: 'kinh doanh online' },
        { re: /growth/i, val: 'growth' },
      ]
      const set = new Set<string>()
      for (const d of dict) {
        if (d.re.test(chatSummary)) {
          set.add(d.val)
        }
      }
      const line = /(?:kỹ\s*năng|kinh\s*nghiệm)[^:：\-]*[:：\-]?\s*([^\n]+)/i.exec(chatSummary)
      if (line && line[1]) {
        line[1].split(/[\,\|\/;]|\s+và\s+/i).map(s => s.trim()).filter(Boolean).forEach(s => set.add(s))
      }
      skills = Array.from(set).slice(0, 10)
    }
  }
  
  // Build user context
  const fmtVND = (v: number | null | undefined) => {
    if (typeof v !== 'number' || isNaN(v)) return ''
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ VNĐ`
    return `${Math.round(v / 1_000_000)} triệu VNĐ`
  }
  const userContext = `Thông tin người dùng:
- Mục tiêu: ${goal}
- Thu nhập hiện tại: ${income}
- Tiết kiệm hiện có: ${savings}
- Thời gian mục tiêu: ${timeline}
- Kỹ năng: ${skills.join(', ') || 'Đang phát triển'}
${ageVal ? `- Tuổi: ${ageVal}` : ''}
${familyStatusVal ? `- Tình trạng gia đình: ${familyStatusVal}` : ''}
${riskToleranceVal ? `- Mức chịu rủi ro: ${riskToleranceVal}` : ''}
${typeof freeHoursPerWeekVal === 'number' ? `- Giờ rảnh/tuần: ${freeHoursPerWeekVal}` : ''}
${debtsVndVal ? `- Nợ hiện có: ${fmtVND(debtsVndVal)}` : ''}
${assetsValueVndVal ? `- Tổng tài sản: ${fmtVND(assetsValueVndVal)}` : ''}
${assetsCategoriesVal.length ? `- Danh mục tài sản: ${assetsCategoriesVal.join(', ')}` : ''}`
  
  // Use FINANCIAL_PLAN prompt from prompts.ts (includes MANDATORY OUTPUT INSTRUCTION)
  const systemPrompt = getFinancialPlanSystemPrompt()

  // Define sections (Free: 9 mục, Paid: >=24 mục chuyên sâu)
  const baseSections = [
    { key: 'profile', title: '1. Chân dung tài chính cá nhân', weight: 3 },
    { key: 'goals', title: '2. Mục tiêu tài chính & động lực', weight: 2 },
    { key: 'current', title: '3. Hiện trạng & khoảng cách mục tiêu', weight: 3 },
    { key: 'models', title: '4. Mô hình tăng thu nhập phù hợp', weight: 3 },
    { key: 'saving', title: '5. Kế hoạch tiết kiệm & đầu tư', weight: 3 },
    { key: 'plan', title: '6. Kế hoạch hành động & timeline', weight: 4 },
    { key: 'learning', title: '7. Tài liệu học tập & nguồn lực', weight: 2 },
    { key: 'mindset', title: '8. Psychology & Mindset', weight: 2 },
    { key: 'conclusion', title: '9. Kết luận & hành động ngay', weight: 1 }
  ]
  const paidSections = [
    ...baseSections,
    { key: 'budget', title: '10. Ngân sách và phân bổ chi tiêu', weight: 2 },
    { key: 'expenses', title: '11. Phân tích chi phí cố định & biến đổi', weight: 2 },
    { key: 'cashflow', title: '12. Dòng tiền cá nhân & tối ưu hoá', weight: 2 },
    { key: 'income_streams', title: '13. Chiến lược đa nguồn thu', weight: 3 },
    { key: 'pricing_strategy', title: '14. Chiến lược định giá & gói dịch vụ', weight: 2 },
    { key: 'client_acquisition', title: '15. Kênh tìm kiếm & chuyển đổi khách hàng', weight: 3 },
    { key: 'risk_mgmt', title: '16. Quản trị rủi ro & bảo vệ tài chính', weight: 2 },
    { key: 'emergency_fund', title: '17. Quỹ dự phòng & quy tắc an toàn', weight: 2 },
    { key: 'debt_strategy', title: '18. Chiến lược xử lý nợ', weight: 2 },
    { key: 'asset_allocation', title: '19. Phân bổ tài sản theo mức rủi ro', weight: 3 },
    { key: 'tax_planning', title: '20. Thuế & tuân thủ pháp lý cơ bản', weight: 2 },
    { key: 'performance_kpis', title: '21. KPIs & thước đo hiệu suất', weight: 2 },
    { key: 'review_cadence', title: '22. Chu kỳ rà soát & tối ưu kế hoạch', weight: 2 },
    { key: 'contingency_plans', title: '23. Kế hoạch dự phòng khi biến động', weight: 2 },
    { key: 'investment_roadmap', title: '24. Lộ trình đầu tư theo giai đoạn', weight: 3 }
  ]
  const sections = tier === 'free' ? baseSections : paidSections
  
  // Generate section content (multi-step, continues until targetWords reached)
  const generateSectionContent = async (section: any, targetWords: number): Promise<string> => {
    const prompts: any = {
      profile: `Tạo phần Chân dung tài chính cá nhân.
Bắt đầu bằng bullet list:
• Mục tiêu tài chính: ${goal}
• Thu nhập hiện tại: ${income}
• Kỹ năng: ${skills.join(', ') || 'Đang phát triển'}
• Mong muốn: Đạt mục tiêu trong ${timeline}

Sau đó phân tích chi tiết. KHÔNG hiển thị 'Nơi sinh sống' hoặc 'Nghề nghiệp'.`,
      goals: `Phân tích mục tiêu: ${goal}.
Động lực, lý do, tiêu chí SMART, khoảng cách so với hiện tại.`,
      current: `Phân tích hiện trạng:
- Thu nhập: ${income}
- Tiết kiệm: ${savings}
So sánh với mục tiêu và tính khoảng cách cần vượt qua.`,
      models: `Đề xuất mô hình tăng thu nhập phù hợp với kỹ năng ${skills.join(', ')} và mục tiêu ${goal}.`,
      saving: `Lập kế hoạch tiết kiệm và đầu tư để đạt ${goal} trong ${timeline}.`,
      plan: `Tạo kế hoạch hành động chi tiết cho ${timeline}. Chia theo năm, quý, tháng.`,
      learning: `Liệt kê tài liệu học tập. KHÔNG dùng link. Chỉ cung cấp từ khoá tìm kiếm:

★ YouTube:
- "${skills[0] || 'digital marketing'} for beginners"
- "how to ${goal.toLowerCase().replace(/[^a-z0-9 ]/g, '')}"
- "passive income strategies Vietnam"

★ Coursera:
- "financial planning fundamentals"
- "${skills[0] || 'marketing'} specialization"

★ LinkedIn Learning:
- "business growth strategies"
- "personal finance mastery"

★ Google Digital Garage:
- "digital marketing basics"
- "grow your business online"

★ Brandcamp.asia:
- "marketing căn bản"
- "xây dựng thương hiệu cá nhân"`,
      mindset: `Tư vấn tâm lý để đạt ${goal}. Cách vượt khó khăn và duy trì động lực.`,
      conclusion: `Tóm tắt kế hoạch và 3 hành động cần làm ngay để bắt đầu.`,
      // Paid-tier specialized prompts (24+)
      budget: `Xây dựng ngân sách cá nhân thực dụng theo ${timeline}. Chia nhóm chi tiêu 50/30/20 (hoặc tuỳ biến theo rủi ro ${riskToleranceVal}) và bối cảnh ${familyStatusVal || 'cá nhân'}. Nêu rõ:
1) Chi tiêu thiết yếu (ăn ở, đi lại, bảo hiểm cơ bản)
2) Không thiết yếu (giải trí, mua sắm)
3) Tiết kiệm & đầu tư định kỳ
4) Ngưỡng cảnh báo vượt trần từng nhóm và cách điều chỉnh trong tháng ít/ nhiều thu nhập.
Không dùng bảng. Viết hướng dẫn từng bước.
Tận dụng thu nhập hiện tại: ${income}.`,
      expenses: `Phân tích chi phí cố định vs biến đổi dựa trên hoàn cảnh ${familyStatusVal || 'cá nhân'} và mục tiêu ${goal}. Xác định cách cắt giảm 10-20% chi phí biến đổi mà không ảnh hưởng chất lượng sống. Cung cấp checklist rà soát định kỳ không dùng bảng, liệt kê theo gạch đầu dòng.`,
      cashflow: `Mô tả dòng tiền vào/ra theo chu kỳ (lương, thu phụ, chi tiêu, nợ, tiết kiệm). Đề xuất cơ chế “pay-yourself-first” (trích trước ${riskToleranceVal === 'low' ? '25%' : '15%'} thu nhập) và tự động hoá chuyển khoản. Nêu các kịch bản dòng tiền trong tháng tốt/xấu và cách xử lý.`,
      income_streams: `Đề xuất bộ đa nguồn thu phù hợp kỹ năng ${skills.join(', ') || 'đang phát triển'} và thời gian rảnh ${freeHoursPerWeekVal || '10-15'} giờ/tuần: 1) Nguồn chủ lực 2) Nguồn bổ sung 3) Nguồn thụ động. Với mỗi nguồn: mô tả mô hình, bước bắt đầu trong 4-6 tuần, tiêu chí đạt-đủ để mở rộng.`,
      pricing_strategy: `Nếu có dịch vụ/sản phẩm, xây chiến lược định giá theo giá trị. Nêu: định vị, gói, mức giá mỏ neo, ưu đãi giới hạn, và khung “giá tâm lý”. Hướng dẫn A/B test gói trong 4 tuần và tiêu chí điều chỉnh.`,
      client_acquisition: `Xây kênh tìm kiếm & chuyển đổi khách hàng: inbound (nội dung/SEO), outbound (DM/email), network (cộng đồng). Cho mỗi kênh: thông điệp mẫu 3-5 dòng, lịch đăng/tiếp cận hằng tuần, thước đo (CTR, reply rate, booking). Không dùng bảng.`,
      risk_mgmt: `Lập danh mục rủi ro cá nhân: thu nhập giảm, bệnh tật, thị trường, pháp lý. Đề xuất bảo hiểm tối thiểu theo bối cảnh ${familyStatusVal || 'độc thân'} và quỹ dự phòng (xem mục quỹ dự phòng). Đưa checklist ứng phó nhanh khi rủi ro xảy ra.`,
      emergency_fund: `Thiết kế quỹ dự phòng ${familyStatusVal || 'cá nhân'}: ${riskToleranceVal === 'low' ? '6-12' : '3-6'} tháng chi phí thiết yếu. Cách tích luỹ đều đặn, nơi giữ tiền (thanh khoản), nguyên tắc “không đụng vào”, quy trình nạp lại sau khi dùng.`,
      debt_strategy: `Nếu có nợ ${debtsVndVal ? fmtVND(debtsVndVal) : '(nếu có)'}: chọn snowball/avalanche, thương lượng lãi, hợp nhất khoản vay (nếu phù hợp), kỷ luật trả nợ theo tuần/tháng. Đưa timeline dự kiến và tín hiệu cần điều chỉnh.`,
      asset_allocation: `Phân bổ tài sản theo mức rủi ro ${riskToleranceVal}. Không gợi ý tài sản cụ thể, chỉ nêu tỷ lệ mẫu và nguyên tắc cân bằng lại định kỳ (quarterly). Nhấn mạnh quản trị rủi ro và thời gian nắm giữ theo ${timeline}.`,
      tax_planning: `Tổng quan thuế cơ bản cá nhân/kinh doanh nhỏ (ở VN, nói tổng quan; KHÔNG tư vấn pháp lý). Nguyên tắc sổ sách, hoá đơn, ghi nhận chi phí hợp lệ, và thói quen phòng ngừa rủi ro kiểm tra thuế.`,
      performance_kpis: `Đặt KPIs cho thu nhập, tiết kiệm, hiệu suất kênh. Mỗi KPI: định nghĩa, cách đo, tần suất cập nhật, ngưỡng hành động. Không dùng bảng. Viết dạng danh sách rõ ràng.`,
      review_cadence: `Thiết lập chu kỳ rà soát (tuần/tháng/quý): nội dung rà soát, câu hỏi đánh giá, cách cập nhật mục tiêu, cách phản hồi với kết quả không đạt.`,
      contingency_plans: `Kế hoạch dự phòng khi biến động (mất việc, chi phí đột xuất, sụt doanh số). Mô tả “playbook 7-14 ngày” để cắt chi/phục hồi doanh thu.`,
      investment_roadmap: `Lộ trình đầu tư theo giai đoạn, tương thích ${timeline} và mức rủi ro ${riskToleranceVal}. Không nêu mã cụ thể; chỉ nguyên tắc, tỷ lệ, mốc nâng tỷ trọng và cách cân bằng lại. Nêu cách học & thử với số vốn nhỏ trước.`
    }

    const basePrompt = prompts[section.key] || `Phân tích chi tiết về ${section.title}`

    // Helpers
    const wc = (s: string) => (s ? s.trim().split(/\s+/).length : 0)
    const stripRedundantHeadings = (s: string) => {
      const titleRe = new RegExp(`^(?:#{1,3}\\s*)?${section.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, 'im')
      return s
        .replace(titleRe, '')
        .replace(/^#+\s*(Kết luận|Conclusion)\s*$/gim, '')
    }

    const PASS_WORDS = tier === 'free' ? 500 : 1200
    const MAX_PASSES = tier === 'free' ? 2 : 12

    let aggregated = ''
    let pass = 1
    while (wc(aggregated) < targetWords && pass <= MAX_PASSES) {
      const remaining = targetWords - wc(aggregated)
      const chunkTarget = clamp(remaining, 300, PASS_WORDS)
      const userPrompt = pass === 1
        ? `${userContext}\n\nViết phần: ${section.title}\n\n${basePrompt}\n\nĐộ dài: khoảng ${chunkTarget} từ.`
        : `${userContext}\n\nTIẾP TỤC mở rộng phần: ${section.title}\n\nYÊU CẦU QUAN TRỌNG:\n- Không lặp lại nội dung đã viết.\n- Không mở đầu lại, không kết luận lại, không tóm tắt lại.\n- Không nhắc lại tiêu đề.\n- Bổ sung luận điểm mới, ví dụ mới, hướng dẫn chi tiết hơn.\n\nĐộ dài: khoảng ${chunkTarget} từ.`

      try {
        const raw = await aiTextWithFallback(
          systemPrompt,
          userPrompt,
          Math.min(2000, Math.round(chunkTarget * 2)),
          0.7
        )
        let chunk = raw || ''
        chunk = cleanContent(stripRedundantHeadings(chunk))
        // Avoid accidental duplication by trimming overlapping last paragraph
        if (aggregated && chunk && aggregated.endsWith(chunk.slice(0, 50))) {
          chunk = chunk.slice(50)
        }
        aggregated += (aggregated ? '\n\n' : '') + chunk
      } catch (e) {
        console.error(`Error generating ${section.key} (pass ${pass}):`, e)
        if (!aggregated) {
          aggregated = `(Nội dung đang được xử lý)`
        }
        break
      }

      pass++
    }

    return aggregated.trim()
  }
  
  // Clean content function
  const cleanContent = (text: string): string => {
    let cleaned = text
    
    // Remove validation text
    cleaned = cleaned.replace(/VALIDATION[^\n]*/gi, '')
    cleaned = cleaned.replace(/Kiểm tra lần[^\n]*/gi, '')
    cleaned = cleaned.replace(/Giả định:[^\n]*/gi, '')
    
    // Remove placeholders
    cleaned = cleaned.replace(/\[URL cụ thể\]/gi, '')
    cleaned = cleaned.replace(/example\.com/gi, '')
    cleaned = cleaned.replace(/placeholder/gi, '')
    
    // Remove Mermaid blocks and markdown tables
    cleaned = cleaned.replace(/```mermaid[\s\S]*?```/gi, '')
    cleaned = cleaned.replace(/^\|.*$/gm, '')
    cleaned = cleaned.replace(/mermaid/gi, '')
    cleaned = cleaned.replace(/graph\s+(TD|LR)/gi, '')

    // Remove conditional phrases
    cleaned = cleaned.replace(/Nếu timeline[^\n]*/gi, '')
    cleaned = cleaned.replace(/Nếu thời gian[^\n]*/gi, '')
    
    // Remove empty lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    
    return cleaned.trim()
  }
  
  // Calculate word budget
  const MIN_WORDS = tier === 'free' ? 3000 : 20000
  const MAX_WORDS = tier === 'free' ? 5000 : 50000
  const TARGET = Math.min(MAX_WORDS, Math.max(MIN_WORDS, 4000))
  const totalWeight = sections.reduce((s, x) => s + x.weight, 0)
  const wordBudgetFor = (w: number) => Math.round((w / totalWeight) * TARGET)
  
  // Generate all sections
  const parts: string[] = []
  for (const section of sections) {
    const budget = wordBudgetFor(section.weight)
    const content = await generateSectionContent(section, budget)
    parts.push(`## ${section.title}\n\n${content}`)
  }
  
  // Combine plan
  let plan = `# ${planName}\n\n${parts.join('\n\n')}`
  
  // Final cleanup
  plan = cleanContent(plan)

  // QA-pass nhẹ: điều chỉnh dòng mô tả chính theo dữ liệu chuẩn từ Analytical Brain (nếu có)
  try {
    const a = brain?.analysis
    if (a) {
      const toMil = (v: number) => Math.round((v || 0) / 1_000_000)
      const incomeLine = ((): string => {
        if (a.current_income?.min && a.current_income?.max) return `${toMil(a.current_income.min)} – ${toMil(a.current_income.max)} triệu VNĐ/tháng`
        if (a.current_income?.average) return `${toMil(a.current_income.average)} triệu VNĐ/tháng`
        return income
      })()
      const savingsLine = ((): string => {
        const v = a.current_savings
        if (typeof v === 'number') return v >= 1_000_000_000 ? `${(v/1_000_000_000).toFixed(1)} tỷ VNĐ` : `${Math.round(v/1_000_000)} triệu VNĐ`
        return savings
      })()
      const skillsLine = Array.isArray(a.skills) && a.skills.length ? a.skills.join(', ') : skills.join(', ')

      // Thay thế các dòng bullet phổ biến
      plan = plan
        .replace(/^(?:[•\-*])\s*Thu\s*nhập\s*hiện\s*tại:\s*.*$/gim, `• Thu nhập hiện tại: ${incomeLine}`)
        .replace(/^(?:[•\-*])\s*Tiết\s*kiệm.*?:\s*.*$/gim, `• Tiết kiệm hiện có: ${savingsLine}`)
        .replace(/^(?:[•\-*])\s*Kỹ\s*năng:\s*.*$/gim, `• Kỹ năng: ${skillsLine}`)

      // Cập nhật các dòng trong phần “Hiện trạng” nếu gặp định dạng "- Thu nhập:" / "- Tiết kiệm:"
      plan = plan
        .replace(/^[-*]\s*Thu\s*nhập:\s*.*$/gim, `- Thu nhập: ${incomeLine}`)
        .replace(/^[-*]\s*Tiết\s*kiệm:\s*.*$/gim, `- Tiết kiệm: ${savingsLine}`)
    }
  } catch {}
  
  // Ensure minimum length
  const wordCount = plan.split(/\s+/).length
  if (wordCount < MIN_WORDS && tier === 'free') {
    plan += `\n\n## Phụ lục: Chi tiết bổ sung\n\nKế hoạch này được thiết kế đặc biệt cho mục tiêu "${goal}" với timeline ${timeline}.\n\nĐể thành công, bạn cần tập trung vào việc nâng cao kỹ năng ${skills.join(', ')} và tận dụng tối đa thu nhập hiện tại ${income}.\n\nHãy bắt đầu ngay hôm nay với những bước nhỏ nhưng kiên định!`
  }
  // Smoke tests (log-only)
  try {
    const smoke = smokeCheckPlanContent(plan, tier)
    if (!smoke.ok) {
      console.warn('SMOKE_TEST_FAILED', { issues: smoke.issues })
    }
  } catch {}
  
  return plan
}
