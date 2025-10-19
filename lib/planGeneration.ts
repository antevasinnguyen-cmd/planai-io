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
 * Generate learning resources
 */
export const generateLearningResources = async (
  goal: string,
  occupation: string
): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Tạo danh sách tài liệu học tập cho mục tiêu: ${goal}
Ngành: ${occupation}

Bao gồm:
1. Sách (ưu tiên tiếng Việt)
2. Khóa học online (Udemy, Coursera, etc.)
3. YouTube channels
4. Blogs/websites
5. Công cụ hỗ trợ

Format: Markdown với headings và lists`

    const completion = await openai.chat.completions.create({
      model: selectModel(TaskType.REGULAR_CHAT),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'Không có tài liệu'
  } catch (error) {
    console.error('Error generating learning resources:', error)
    return 'Không thể tạo danh sách tài liệu'
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
