/**
 * Advanced Plan Generation with Micro-tasks
 * Generates detailed financial plans with daily/weekly/monthly tasks
 */

import OpenAI from 'openai'
import { selectModel, TaskType } from './modelSelection'
import { getMicroTasksSystemPrompt } from './prompts'

// Small utility: clamp a number between [lo, hi]
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [
        {
          role: 'system',
          content: getMicroTasksSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    
    try {
      return JSON.parse(response)
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Tạo checklist hàng tuần (5-7 items) cho mục tiêu: ${goal}

Mỗi item phải:
- Cụ thể & có thể đo lường được
- Liên quan đến mục tiêu chính
- Có thể hoàn thành trong 1 tuần

Trả về JSON:
{
  "tasks": ["item 1", "item 2", ...]
}`

    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Tạo checklist hàng tháng (5-7 items) cho mục tiêu: ${goal}

Mỗi item phải:
- Đo lường tiến độ hàng tháng
- Liên quan đến mục tiêu chính
- Giúp điều chỉnh kế hoạch

Trả về JSON:
{
  "tasks": ["item 1", "item 2", ...]
}`

    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    
    try {
      return JSON.parse(response)
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
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Tạo danh sách tài liệu học tập CHI TIẾT và CÓ LINK THỰC TẾ cho mục tiêu: ${goal}
Ngành: ${occupation}

QUAN TRỌNG:
- Mỗi tài liệu PHẢI kiểm tra chéo nguồn, link phải đúng với tên/mô tả, và thực sự liên quan tới kỹ năng/mục tiêu.
- KHÔNG dùng link chung chung (ví dụ: youtube.com, google.com, coursera.org, v.v.)
- Link YouTube PHẢI dẫn tới kênh uy tín (≥10.000 sub, tiếng Anh, đúng kỹ năng, có tên kênh rõ ràng, KHÔNG dùng link video ngẫu nhiên hoặc channel nhỏ).
- Không gợi ý tài liệu/web Việt Nam trừ https://www.brandcamp.asia/.
- ƯU TIÊN nguồn nước ngoài, tiếng Anh, web uy tín nhất (Coursera, Google, LinkedIn Learning, Skillshare, TED, v.v.).
- Luôn LIỆT KÊ từ khoá tìm kiếm để user tự tra cứu nếu không chắc link (tối thiểu 5 từ khoá liên quan).
- Nếu không chắc chắn về link, chuyển sang PHƯƠNG ÁN B: Đề xuất nền tảng uy tín, hướng dẫn user tự tìm kiếm với từ khoá, mô tả rõ user sẽ học được gì.
- GHI RÕ TÊN khoá học/video/sách, mô tả chi tiết, và link phải đúng với tên đó. Nếu không chắc link, ghi chú rõ ràng.
- Bao gồm mô tả chi tiết về nội dung, lợi ích, và lý do chọn của mỗi tài liệu hoặc gợi ý tìm kiếm.

Cấu trúc bắt buộc:

## 📚 PHẦN 1: KỸ NĂNG TÀI CHÍNH CỐ LỖI
1. [Tên khóa học]
   - Link: [URL đầy đủ]
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

Format: Markdown với headings rõ ràng, đầy đủ thông tin, link hoạt động 100%`

    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia tư vấn học tập. Cung cấp tài liệu chất lượng cao với link thực tế, hoạt động được. Mỗi tài liệu phải có mô tả chi tiết và link trực tiếp.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2500,
      temperature: 0.7,
    })

    const resources = completion.choices[0]?.message?.content || 'Không có tài liệu'
    
    // Validate that response contains real, working links
    if (!resources.includes('http')) {
      console.warn('Generated resources may not contain valid links')
    }
    
    // Detect placeholder or fake links and try to regenerate if necessary
    const hasFakeLinks = /(example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com)/i.test(resources)
    if (hasFakeLinks) {
      console.warn('Generated resources contain placeholder/fake URLs - attempting to regenerate with stronger prompt')
      
      try {
        // Try again with more forceful prompt
        const retryPrompt = `Tạo danh sách tài liệu học tập với LINK THỰC TẾ (KHÔNG PHẢI example.com) cho: ${goal}\nNgành: ${occupation}\n\nLỖI NGHIÊM TRỌNG: Link giả/placeholder đã được phát hiện trong response trước đó.\n\nQUAN TRỌNG:\n- MỖI tài liệu PHẢI có link CÓ THẬT đến trang web thực tế (Coursera, edX, Khan Academy, LinkedIn Learning, Udemy)\n- TUYỆT ĐỐI KHÔNG dùng example.com, placeholder.com, domain.com, etc.\n- Nếu không chắc chắn về URL, hãy sử dụng link thực tế đến trang chủ khoá học\n\nCấu trúc giống như trước.`
        
        const retryCompletion = await openai.chat.completions.create({
          model: selectModel(TaskType.REGULAR_CHAT),
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia tư vấn học tập. Cung cấp tài liệu với link THỰC TẾ (KHÔNG PHẢI example.com). Nếu không chắc về URL cụ thể, dùng trang chủ của nguồn thực tế.',
            },
            {
              role: 'user',
              content: retryPrompt,
            },
          ],
          max_tokens: 2500,
          temperature: 0.7,
        })
        
        const retryResources = retryCompletion.choices[0]?.message?.content || resources
        
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

// ---
// Multi-step long-form plan generation to bypass single-call token limits
// Applies to all tiers; free clamps ~5k, paid targets 20k–50k words.
export async function generateLongPlanMultiStep(
  planName: string,
  goal: string,
  collectedInfo: any
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const tier: string = String(collectedInfo?.tier || 'free')

  // Tier-specific word limits
  const MIN_WORDS = tier === 'free' ? 3000 : 20000
  const MAX_WORDS = tier === 'free' ? 5000 : 50000
  const TARGET = Math.min(MAX_WORDS, Math.max(MIN_WORDS, Number(collectedInfo?.maxWords) || MIN_WORDS))

  const baseContext = `Thông tin người dùng (tóm tắt):\n` +
    `- Mục tiêu: ${goal}\n` +
    `- Thu nhập: ${collectedInfo?.income ? `${collectedInfo.income.toLocaleString()} VNĐ/tháng` : 'Chưa cung cấp'}\n` +
    `- Nghề nghiệp hiện tại: ${collectedInfo?.occupation || 'Chưa cung cấp'}\n` +
    `- Thời gian: ${collectedInfo?.timeline || 'Chưa cung cấp'}\n` +
    `- Vị trí: ${collectedInfo?.location || 'Chưa cung cấp'}\n` +
    `- Tiết kiệm hiện có: ${collectedInfo?.savings ? `${collectedInfo.savings.toLocaleString()} VNĐ` : 'Chưa cung cấp'}\n` +
    `- Mức độ sẵn sàng: ${collectedInfo?.readiness || 'Chưa cung cấp'}\n`

  // Bố cục cho gói trả phí (24 mục)
  const paidSections: { key: string; title: string; weight: number; extra?: string }[] = [
    { key: 'title', title: '1. Tiêu đề', weight: 1 },
    { key: 'overview', title: '2. Tổng quan kế hoạch', weight: 3, extra: 'Bao gồm mục tiêu và hồ sơ cá nhân & bối cảnh (đủ các trường đã nêu). Trình bày dạng gạch đầu dòng chi tiết + đoạn tóm tắt.' },
    { key: 'swot', title: '3. Phân tích SWOT cá nhân', weight: 3, extra: 'Dựa dữ liệu VN, có bảng 4 cột chuẩn Markdown.' },
    { key: 'smart', title: '4. Mục tiêu SMART', weight: 2, extra: 'Cụ thể, đo được, khả thi, thực tế, thời hạn; có bảng đối chiếu chỉ số/KPI.' },
    { key: 'strategy', title: '5. Phân tích mục tiêu tài chính & chiến lược tổng quan', weight: 4 },
    { key: 'mindmap', title: '6. Mindmap lộ trình (roadmap/mindmap)', weight: 3, extra: 'Xuất code block ```mermaid mindmap``` hợp lệ. NGAY SAU ĐÓ thêm heading "Bản thay thế thuần nội dung" liệt kê lộ trình dạng văn bản phòng lỗi hiển thị.' },
    { key: 'actions', title: '8. Đề xuất hành động / chiến lược cụ thể', weight: 4 },
    { key: 'tasks', title: '9. Những việc cần làm để đạt mục tiêu', weight: 4 },
    { key: 'factors', title: '10. Các yếu tố khách quan/chủ quan', weight: 2 },
    { key: 'skills', title: '11. Kỹ năng, kinh nghiệm cần có', weight: 3 },
    { key: 'assets', title: '12. Kế hoạch tích luỹ tài sản', weight: 3 },
    { key: 'invest', title: '13. Kế hoạch đầu tư & quản trị rủi ro', weight: 3 },
    { key: 'bizmodels', title: '14. Mô hình kinh doanh phù hợp & bước thực thi', weight: 4 },
    { key: 'timeline', title: '15. Kế hoạch chi tiết theo thời gian (năm-quý-tháng-tuần-ngày)', weight: 6, extra: 'Trình bày văn bản + kèm link Google Sheets nếu có sẵn; nếu chưa, hướng dẫn kết nối ở mục 17.' },
    { key: 'checklist', title: '16. Checklist hành động hàng ngày/tuần/tháng', weight: 3, extra: 'Bảng Markdown hợp lệ với cột Thời gian | Hành động cụ thể | Link tài liệu.' },
    { key: 'sheets', title: '17. GOOGLE SHEETS THEO DÕI (LINK THỰC – TỰ ĐỘNG TẠO)', weight: 1, extra: 'Nếu chưa thể tự tạo, ghi rõ hướng dẫn người dùng kết nối Google ở Dashboard để tự động tạo file.' },
    { key: 'learning', title: '18. Tài liệu học tập & kỹ năng', weight: 3, extra: 'Tuân thủ quy tắc link đã tối ưu (YouTube channel ≥10k sub, tiếng Anh, không link chung chung). Luôn kèm từ khoá tìm kiếm.' },
    { key: 'scenarios', title: '19. Dự báo 3 kịch bản (Worst/Base/Best)', weight: 2 },
    { key: 'risk', title: '20. Chiến lược giảm rủi ro', weight: 2 },
    { key: 'spiritual', title: '21. Phân tích tử vi / thần số học', weight: 2 },
    { key: 'summary', title: '22. Tóm tắt & kết luận hành động', weight: 2 },
    { key: 'guide', title: '23. Hướng dẫn sử dụng kế hoạch hiệu quả', weight: 1 },
    { key: 'closing', title: '24. Kết luận & động lực hành động', weight: 1 },
  ]

  // Bố cục cho gói Free (giữ nguyên như logic cũ, không phải 24 mục)
  const freeSections: { key: string; title: string; weight: number; extra?: string }[] = [
    { key: 'title', title: '1. Tiêu đề', weight: 1 },
    { key: 'summary', title: '2. Tóm tắt', weight: 2 },
    { key: 'swot', title: '3. Phân tích SWOT', weight: 2 },
    { key: 'goals', title: '4. Phân tích mục tiêu', weight: 2 },
    { key: 'factors', title: '5. Phân tích yếu tố', weight: 2 },
    { key: 'skills', title: '6. Kỹ năng', weight: 2 },
    { key: 'mindmap', title: '7. Mindmap lộ trình', weight: 2, extra: 'Dùng Mermaid mindmap, sau đó luôn có bản văn bản thay thế.' },
    { key: 'roadmap', title: '8. Lộ trình', weight: 2 },
    { key: 'actions', title: '9. Đề xuất hành động', weight: 2 },
    { key: 'weekly', title: '10. Checklist Tuần', weight: 1 },
    { key: 'monthly', title: '11. Checklist Tháng', weight: 1 },
    { key: 'saving', title: '12. Kế hoạch tiết kiệm', weight: 1 },
    { key: 'invest', title: '13. Kế hoạch đầu tư', weight: 1 },
    { key: 'learning', title: '14. Tài liệu học tập', weight: 2, extra: 'Tuân thủ quy tắc link đã tối ưu.' }
  ]

  const sections = tier === 'free' ? freeSections : paidSections
  const totalWeight = sections.reduce((s, x) => s + x.weight, 0)
  const wordBudgetFor = (w: number) => clamp(Math.round((w / totalWeight) * TARGET), 150, Math.min(1800, TARGET))

  const system = {
    role: 'system' as const,
    content: [
      'Bạn là chuyên gia lập kế hoạch tài chính cá nhân hóa cho người Việt Nam.',
      'Yêu cầu chất lượng cao: chính xác, thực thi được ngay, không sơ sài.',
      'Bắt buộc: bảng Markdown hợp lệ (có dòng header + separator), link thực tế, và luôn kèm fallback thuần nội dung cho sơ đồ.',
      tier === 'free' ? 'Giới hạn tổng ~5.000 từ.' : 'Yêu cầu tổng ≥20.000 từ (tối đa 50.000).',
    ].join('\n')
  }

  const make = async (title: string, instruction: string, targetWords: number) => {
    const messages = [
      system,
      { role: 'user' as const, content: `${title}\n\n${baseContext}\n\nYÊU CẦU CHO MỤC NÀY:\n- Nội dung CHUYÊN SÂU, CỤ THỂ, có thể hành động ngay.\n- Dài khoảng ${targetWords} từ (có thể vượt nhẹ nếu cần).\n- Nếu sử dụng Mermaid, THÊM "Bản thay thế thuần nội dung" ngay bên dưới.\n${instruction ? '- Ghi chú bổ sung: ' + instruction : ''}` }
    ]
    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.COMPLEX_PLANNING),
      messages,
      max_tokens: 1500,
      temperature: 0.6,
    })
    return completion.choices[0]?.message?.content?.trim() || ''
  }

  let parts: string[] = []
  for (const s of sections) {
    const budget = wordBudgetFor(s.weight)
    const content = await make(s.title, s.extra || '', budget)
    parts.push(`## ${s.title}\n\n${content}`)
  }

  // If paid tier and total words still below minimum, auto-extend with appendices
  let combined = `# ${planName}\n\n${parts.join('\n\n')}`

  const wordCount = (t: string) => (t.match(/\S+/g) || []).length
  let safetyCounter = 0
  while (wordCount(combined) < MIN_WORDS && safetyCounter < 12 && tier !== 'free') {
    safetyCounter++
    const extra = await make('PHỤ LỤC BỔ SUNG', 'Bổ sung case study, ví dụ thực tế, KPI chi tiết, bảng ngân sách, risk register, playbook thực thi theo tuần.', 1200)
    combined += `\n\n## Phụ lục mở rộng ${safetyCounter}\n\n${extra}`
  }

  // Clamp final length by trimming softly if over MAX_WORDS (rare)
  const tokens = combined.split(/\s+/)
  if (tokens.length > MAX_WORDS) {
    combined = tokens.slice(0, MAX_WORDS - 50).join(' ') + '\n\n(Đã rút gọn để phù hợp giới hạn hiển thị)'
  }

  return combined
}
