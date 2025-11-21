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
  // Helper: reject link chung chung, youtube.com, example.com, coursera.org...
  const isInvalidLink = (url: string) => /example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com|youtube\.com(\/|$)(?!channel)|coursera\.org(\/|$)|edx\.org(\/|$)|google\.com(\/|$)|linkedin\.com(\/|$)|facebook\.com|tiktok\.com|zalo\.me|vnexpress\.net|dantri\.com|cafef\.vn|kenh14\.vn|vietnamnet\.vn|tuoitre\.vn|thanhnien\.vn|zingnews\.vn|bnews\.vn|vneconomy\.vn|cafebiz\.vn|vietstock\.vn|stockbiz\.vn|cafeland\.vn|webtretho\.com|vozforums\.com|reddit\.com|stackoverflow\.com|github\.com|bitbucket\.org|gitlab\.com/i.test(url)
  // Helper: chỉ cho phép brandcamp.asia nếu là web Việt Nam
  const isAllowedVietnamese = (url: string) => url.includes('brandcamp.asia')

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    let resources = completion.choices[0]?.message?.content || 'Không có tài liệu'

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

  const normalizeCurrency = (v: any, suffix: string) => {
    const num = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() ? Number(v.replace(/[.,\s]/g, '')) : NaN)
    return Number.isFinite(num) && num > 0 ? `${num.toLocaleString('vi-VN')} ${suffix}` : 'Chưa cung cấp'
  }
  const normalizeText = (v: any) => (v && String(v).trim().length > 0 ? String(v) : 'Chưa cung cấp')

  const baseContext = `Thông tin người dùng (tóm tắt):\n` +
    `- Mục tiêu: ${normalizeText(collectedInfo?.goal || goal)}\n` +
    `- Thu nhập: ${normalizeCurrency(collectedInfo?.income ?? collectedInfo?.current_income, 'VNĐ/tháng')}\n` +
    `- Nghề nghiệp hiện tại: ${normalizeText(collectedInfo?.occupation)}\n` +
    `- Thời gian: ${normalizeText(collectedInfo?.timeline)}\n` +
    `- Vị trí: ${normalizeText(collectedInfo?.location)}\n` +
    `- Tiết kiệm hiện có: ${normalizeCurrency(collectedInfo?.savings, 'VNĐ')}\n` +
    `- Mức độ sẵn sàng: ${normalizeText(collectedInfo?.readiness)}\n`

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

  // Bố cục cho gói Free (linh hoạt, tập trung chất lượng)
  // Bố cục Free linh hoạt, ưu tiên phân tích sâu, trình bày tự nhiên như bản tốt nhất từng xuất hiện
  const freeSections: { key: string; title: string; weight: number; extra?: string }[] = [
    { key: 'profile', title: '1. Chân dung tài chính cá nhân', weight: 4, extra: 'Phân tích sâu về bản thân, kỹ năng, kinh nghiệm, điểm mạnh/yếu, dữ liệu thực tế, insight, ví dụ, số liệu.' },
    { key: 'goals', title: '2. Mục tiêu tài chính & động lực', weight: 3, extra: 'Phân tích mục tiêu cụ thể, động lực, lý do chọn, SMART, gap phân tích.' },
    { key: 'current', title: '3. Hiện trạng & khoảng cách mục tiêu', weight: 2, extra: 'Thu nhập hiện tại, tiết kiệm, phân tích gap, so sánh thực tế.' },
    { key: 'models', title: '4. Mô hình tăng thu nhập phù hợp', weight: 3, extra: 'Gợi ý mô hình kinh doanh, đầu tư, phân tích rủi ro, ví dụ thực tiễn.' },
    { key: 'saving', title: '5. Kế hoạch tiết kiệm & đầu tư', weight: 2, extra: 'Chiến lược tiết kiệm, đầu tư, cách áp dụng thực tế.' },
    { key: 'plan', title: '6. Kế hoạch hành động & timeline', weight: 3, extra: 'Lộ trình từng năm/quý/tháng, hành động chi tiết, checklist.' },
    { key: 'learning', title: '7. Tài liệu học tập & nguồn lực', weight: 2, extra: 'Link thật, kênh uy tín, từ khoá tìm kiếm, mô tả chi tiết, cách áp dụng.' },
    { key: 'mindset', title: '8. Psychology & Mindset', weight: 1, extra: 'Khích lệ, động lực, mindset, cách vượt qua rào cản.' },
    { key: 'conclusion', title: '9. Kết luận & hành động ngay', weight: 1, extra: 'Tóm tắt, nhấn mạnh hành động, nhắc lại mục tiêu.' }
  ]

  const sections = tier === 'free' ? freeSections : paidSections
  const totalWeight = sections.reduce((s, x) => s + x.weight, 0)
  const wordBudgetFor = (w: number) => clamp(Math.round((w / totalWeight) * TARGET), 150, Math.min(1800, TARGET))

  const system = {
    role: 'system' as const,
    content: [
      'Bạn là chuyên gia lập kế hoạch tài chính cá nhân hóa cho người Việt Nam.',
      'Mục đích: Tạo bản kế hoạch CHUYÊN SÂU, CÁ NHÂN HÓA ĐỘC QUYỀN dựa trên dữ liệu đầu vào từ chat.',
      '',
      (tier === 'free'
        ? ['BỐ CỤC FREE LINH HOẠT (tham chiếu, không ép cứng):', freeSections.map(s => `- ${s.title}`).join('\n')].join('\n')
        : ['BẮT BUỘC TUÂN THỦ ĐẦY ĐỦ 24 MỤC SAU (không được thiếu, không gộp, không bỏ sót):', paidSections.map(s => `- ${s.title}`).join('\n')].join('\n')
      ),
      '',
      'KIỂM TRA CHÉO & PHÂN TÍCH NHIỀU LỚP:',
      '- Mỗi mục phải kiểm tra lại dữ liệu đầu vào, đối chiếu với các mục khác, đảm bảo không mâu thuẫn, không thiếu ý.',
      '- Nếu thiếu dữ liệu, phải đề xuất cách bổ sung hoặc giả định hợp lý (ghi rõ).',
      '- Không được trả lời máy móc, phải phân tích sâu, linh hoạt, có ví dụ thực tế.',
      '- Mỗi mục đều phải có kiểm tra chéo với các mục còn lại, tránh trùng lặp, tránh bỏ sót nội dung.',
      '- Nếu phát hiện thông tin mâu thuẫn, phải highlight rõ và đề xuất hướng xử lý.',
      '',
      'YÊU CẦU CHẤT LƯỢNG:',
      '- Chính xác, thực thi được ngay, không sơ sài',
      '- Bảng Markdown hợp lệ (header + separator + data)',
      '- Link thực tế (YouTube ≥10k sub, tiếng Anh ưu tiên)',
      '- Luôn kèm fallback thuần nội dung cho sơ đồ',
      '- Dữ liệu được tổng hợp & xử lý từ chat input',
      tier === 'free' ? '- Tổng ~5.000 từ, nhưng đảm bảo đầy đủ các xương sống' : '- Tổng ≥20.000 từ (tối đa 50.000), chuyên sâu & chi tiết',
    ].join('\n')
  }

  // Helper: Validate and fix content per section (links + general placeholders)
  const validateAndFixLinks = (content: string, sectionKey: string): string => {
    let fixed = content

    // Nếu là mục "learning" (tài liệu học tập), kiểm tra nghiêm ngặt
    if (sectionKey === 'learning') {
      // Replace link giả/chung chung
      fixed = fixed.replace(/\bhttps?:\/\/(www\.)?(example\.com|placeholder\.com|domain\.com|mysite\.com|yoursite\.com|youtube\.com(?!\/channel)|coursera\.org(?!\/learn)|edx\.org(?!\/course)|google\.com(?!\/search)|linkedin\.com\/learning(?!\/)|facebook\.com|tiktok\.com|zalo\.me|vnexpress\.net|dantri\.com|cafef\.vn|kenh14\.vn|vietnamnet\.vn|tuoitre\.vn|thanhnien\.vn|zingnews\.vn|bnews\.vn|vneconomy\.vn|cafebiz\.vn|vietstock\.vn|stockbiz\.vn|cafeland\.vn|webtretho\.com|vozforums\.com|reddit\.com|stackoverflow\.com|github\.com|bitbucket\.org|gitlab\.com)\S*/gi, '[TỪ KHOÁ TÌM KIẾM: tra cứu trên Coursera, LinkedIn Learning, Google, TED, Brandcamp.asia]')

      // Replace link web Việt Nam (trừ brandcamp.asia)
      fixed = fixed.replace(/\bhttps?:\/\/(www\.)?(?!brandcamp\.asia)[a-zA-Z0-9-]+\.vn\S*/gi, '[TỪ KHOÁ TÌM KIẾM: tra cứu trên Coursera, LinkedIn Learning, Google, TED, Brandcamp.asia]')

      // Dòng 'Link:' không có URL thực -> chuyển thành gợi ý từ khoá
      fixed = fixed.replace(/^(\s*[-*]?\s*Link\s*:\s*)(?!https?:\/\/)(?!\[TỪ KHOÁ)/gim, `$1[TỪ KHOÁ TÌM KIẾM: gõ tên tài liệu + nền tảng uy tín (Coursera, LinkedIn Learning, Google, TED, Brandcamp.asia)]`)

      // Nếu không có link thật, thêm gợi ý từ khoá
      if (!fixed.includes('http')) {
        fixed += '\n\n**GỢI Ý TÌM KIẾM:** Vui lòng tra cứu trên các nền tảng uy tín quốc tế: Coursera, LinkedIn Learning, Google, TED, Skillshare, hoặc Brandcamp.asia (Việt Nam) với các từ khoá liên quan đến mục tiêu và kỹ năng của bạn.'
      }
    }

    // General placeholder cleanup for all sections
    const normIncome = normalizeCurrency((collectedInfo as any)?.income ?? (collectedInfo as any)?.current_income, 'VNĐ/tháng')
    const normSavings = normalizeCurrency((collectedInfo as any)?.savings, 'VNĐ')
    const normTimeline = normalizeText((collectedInfo as any)?.timeline)
    const normGoal = normalizeText((collectedInfo as any)?.goal || goal)

    fixed = fixed
      .replace(/(Thu\s*nhập\s*(HIỆN\s*TẠI|hiện\s*tại)[^:]*:\s*)(true|không\s*cung\s*cấp|chưa\s*cung\s*cấp|N\/A)[^\n]*/gi, `$1${normIncome}`)
      .replace(/(Tiết\s*kiệm\s*hiện\s*có[^:]*:\s*)(true|không\s*cung\s*cấp|chưa\s*cung\s*cấp|N\/A)[^\n]*/gi, `$1${normSavings}`)
      .replace(/(Thời\s*gian\s*(thực\s*hiện|mục\s*tiêu|timeline)[^:]*:\s*)(true|không\s*cung\s*cấp|chưa\s*cung\s*cấp|N\/A)[^\n]*/gi, `$1${normTimeline}`)
      .replace(/(Mục\s*tiêu\s*tài\s*chính[^:]*:\s*)(true|không\s*cung\s*cấp|chưa\s*cung\s*cấp|N\/A)[^\n]*/gi, `$1${normGoal}`)

    return fixed
  }

  // Helper: kiểm tra nội dung có placeholder, lặp prompt, hoặc quá ngắn
  const needsRewrite = (content: string, sectionKey?: string, minWords = 200) => {
    if (!content) return true
    if (/\b(true|chưa cung cấp|không đủ dữ liệu|placeholder|Tên|Link\s*:\s*\(|VALIDATION|prompt yêu cầu)\b/i.test(content) || /\[(URL cụ thể|.*?)\]/i.test(content)) return true
    if (content.length < 100) return true
    if ((content.match(/\w+/g) || []).length < minWords) return true
    if (sectionKey === 'learning' && !content.includes('http') && !content.toLowerCase().includes('từ khoá')) return true
    return false
  }

  const make = async (title: string, instruction: string, targetWords: number, sectionKey?: string) => {
    // Lớp 1: Tăng cường instruction cho từng mục, ép AI dùng dữ liệu user chat
    let finalInstruction = instruction
    let userDataNote = `\n\nDỮ LIỆU NGƯỜI DÙNG: Mục tiêu: ${goal} | Thu nhập: ${collectedInfo?.income || 'Chưa cung cấp'} | Kỹ năng: ${collectedInfo?.skills || 'Chưa cung cấp'} | Location: ${collectedInfo?.location || 'Chưa cung cấp'} | Readiness: ${collectedInfo?.readiness || 'Chưa cung cấp'} | Savings: ${collectedInfo?.savings || 'Chưa cung cấp'} | Timeline: ${collectedInfo?.timeline || 'Chưa cung cấp'}\n\nBẮT BUỘC sử dụng đúng các dữ liệu này cho phân tích, KHÔNG được placeholder, KHÔNG lặp lại prompt, nếu thiếu dữ liệu phải giả định hợp lý và ghi rõ. Mỗi mục tối thiểu ${targetWords} từ, phân tích sâu, có ví dụ, số liệu, insight, không máy móc.`
    if (sectionKey === 'learning') {
      finalInstruction = `${instruction}\n\nQUAN TRỌNG - TUÂN THỦ NGHIÊM NGẶT:\n- CHỈ lấy link THẬT từ các nguồn uy tín quốc tế (Coursera, LinkedIn Learning, Google, TED, Skillshare).\n- Link YouTube PHẢI là link KÊNH (youtube.com/channel/...), ≥10k sub, tiếng Anh, đúng kỹ năng.\n- KHÔNG gợi ý web Việt Nam trừ https://www.brandcamp.asia/.\n- Nếu KHÔNG chắc link, PHẢI ghi rõ TỪ KHOÁ TÌM KIẾM (5-10 từ khoá cụ thể) và nền tảng uy tín.\n- TUYỆT ĐỐI KHÔNG dùng: example.com, placeholder.com, youtube.com (không phải kênh), coursera.org (không phải khóa học cụ thể).`
    }

    let content = ''
    let retry = 0
    while (retry < 4) {
      const messages = [
        system,
        { role: 'user' as const, content: `${title}\n\n${baseContext}${userDataNote}\n\nYÊU CẦU CHO MỤC NÀY:\n- Nội dung CHUYÊN SÂU, CỤ THỂ, có thể hành động ngay.\n- Dài khoảng ${targetWords} từ (có thể vượt nhẹ nếu cần).\n- Nếu sử dụng Mermaid, THÊM "Bản thay thế thuần nội dung" ngay bên dưới.\n${finalInstruction ? '- Ghi chú bổ sung: ' + finalInstruction : ''}` }
      ]
      const completion = await openai.chat.completions.create({
        model: selectModel(TaskType.COMPLEX_PLANNING),
        messages,
        max_tokens: 1800,
        temperature: 0.7,
      })
      content = completion.choices[0]?.message?.content?.trim() || ''
      if (sectionKey) {
        content = validateAndFixLinks(content, sectionKey)
      }
      if (!needsRewrite(content, sectionKey, Math.max(200, targetWords * 0.8))) break
      retry++
      finalInstruction += '\n\nLưu ý: Bạn vừa trả lời chưa đạt yêu cầu (placeholder, thiếu dữ liệu, quá ngắn, lặp lại prompt, thiếu link thật/từ khoá). Hãy sửa lại mục này đúng chuẩn, phân tích sâu hơn, dài hơn, dùng đúng dữ liệu user.'
    }
    return content
  }

  let parts: string[] = []
  for (const s of sections) {
    const budget = wordBudgetFor(s.weight)
    const content = await make(s.title, s.extra || '', budget, s.key)  // Pass sectionKey để validate
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
