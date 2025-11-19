/**
 * Advanced Plan Generation with Micro-tasks
 * Generates detailed financial plans with daily/weekly/monthly tasks
 */

import OpenAI from 'openai'
import { selectModel, TaskType } from './modelSelection'
import { getMicroTasksSystemPrompt } from './prompts'

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
- Mỗi tài liệu PHẢI có link hoạt động, có thể click vào được ngay
- Ưu tiên nguồn tài liệu uy tín bằng tiếng Anh (Coursera, edX, Khan Academy, YouTube)
- Nếu là tiếng Việt, phải là nguồn uy tín (Edumall, Unica, Topica, etc.)
- Mỗi link phải dẫn TRỰC TIẾP tới tài liệu/video/khóa học, không phải trang chủ
- Bao gồm mô tả chi tiết về nội dung của mỗi tài liệu

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
    
    // Validate that response contains actual links
    if (!resources.includes('http')) {
      console.warn('Generated resources may not contain valid links')
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
