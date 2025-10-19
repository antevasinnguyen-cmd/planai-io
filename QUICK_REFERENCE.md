# ⚡ Quick Reference - AI Enhancement

## 📁 Files Created

### 1. **lib/prompts.ts** - Centralized System Prompts
```typescript
// Usage:
import { getChatSystemPrompt, getFinancialPlanSystemPrompt } from '@/lib/prompts'

const systemPrompt = getChatSystemPrompt()
```

**Exports:**
- `getChatSystemPrompt()` - Chat assistant
- `getFinancialPlanSystemPrompt()` - Plan generation
- `getUserInputAnalysisSystemPrompt()` - Input analysis
- `getMicroTasksSystemPrompt()` - Micro-tasks
- `getSpiritualAnalysisSystemPrompt()` - Spiritual analysis

---

### 2. **lib/planGeneration.ts** - Advanced Plan Generation
```typescript
// Usage:
import { 
  generateMicroTasks,
  generateWeeklyChecklist,
  generateMonthlyChecklist,
  generateLearningResources,
  formatMicroTasks,
  formatChecklists
} from '@/lib/planGeneration'

const microTasks = await generateMicroTasks(userProfile, goal, timeline)
const weeklyChecklist = await generateWeeklyChecklist(goal)
const monthlyChecklist = await generateMonthlyChecklist(goal)
const resources = await generateLearningResources(goal, occupation)

const formatted = formatMicroTasks(microTasks)
const checklists = formatChecklists(weeklyChecklist, monthlyChecklist)
```

**Exports:**
- `generateMicroTasks()` - Daily tasks
- `generateWeeklyChecklist()` - Weekly tasks
- `generateMonthlyChecklist()` - Monthly tasks
- `generateLearningResources()` - Learning materials
- `formatMicroTasks()` - Format for display
- `formatChecklists()` - Format checklists

---

### 3. **lib/openai.ts** - Updated
**Changes:**
- Import từ `prompts.ts`
- `generateChatResponse()` sử dụng `getChatSystemPrompt()`
- `analyzeUserInput()` sử dụng `getUserInputAnalysisSystemPrompt()`

---

## 🔄 Integration Points

### **Chat API** (`/app/api/chat/route.ts`)
```typescript
// Thêm import
import { getChatSystemPrompt } from '@/lib/prompts'

// Sử dụng
const systemMessage = {
  role: 'system' as const,
  content: getChatSystemPrompt()
}
```

### **Plan Generation API** (`/app/api/plans/generate/route.ts`)
```typescript
// Thêm import
import { 
  generateMicroTasks,
  generateWeeklyChecklist,
  generateMonthlyChecklist,
  generateLearningResources,
  formatMicroTasks,
  formatChecklists
} from '@/lib/planGeneration'

// Sử dụng
const microTasks = await generateMicroTasks(userProfile, goal, timeline)
const weeklyChecklist = await generateWeeklyChecklist(goal)
const monthlyChecklist = await generateMonthlyChecklist(goal)
const resources = await generateLearningResources(goal, occupation)

const enhancedContent = planContent + '\n\n' +
  formatMicroTasks(microTasks) + '\n\n' +
  formatChecklists(weeklyChecklist, monthlyChecklist) + '\n\n' +
  resources
```

---

## 🎯 System Prompts Overview

### **1. Chat Assistant Prompt**
**Mục đích:** Hỏi thông tin & gợi ý câu hỏi tiếp theo

**Thông tin cần:**
1. Mục tiêu tài chính
2. Thu nhập hiện tại
3. Kỹ năng/Nghề nghiệp
4. Ngày sinh
5. Thời gian & Mức độ sẵn sàng
6. Tiết kiệm & Tài chính
7. Khu vực sinh sống
8. Mức độ sẵn sàng thay đổi

**Output:** Chat response + suggested questions

---

### **2. Financial Plan Prompt**
**Mục đích:** Tạo kế hoạch chi tiết

**Cấu trúc bắt buộc:**
1. Tóm tắt mục tiêu
2. Phân tích tình hình
3. Xác định vấn đề
4. Giải pháp chi tiết
5. Lộ trình (Tháng/Quý/Năm)
6. Micro-tasks hàng ngày
7. Checklist hàng tuần
8. Checklist hàng tháng
9. Tài liệu học tập
10. Phân tích tử vi/thần số
11. Insights tâm linh

**Output:** Markdown formatted plan

---

### **3. User Input Analysis Prompt**
**Mục đích:** Trích xuất & phân tích input

**Trích xuất:**
- goal, income, timeline, age, occupation, skills
- birth_date, location, savings, expenses, debt, assets, readiness

**Output:** JSON với intent + extracted info + suggested questions

---

### **4. Micro-tasks Prompt**
**Mục đích:** Tạo daily/weekly/monthly tasks

**Output:** JSON với weekday & weekend tasks

---

### **5. Spiritual Analysis Prompt**
**Mục đích:** Phân tích tử vi/thần số

**Output:** Mệnh, tính cách, điểm mạnh/yếu, gợi ý

---

## 📊 Data Structures

### **MicroTask**
```typescript
interface MicroTask {
  priority: 'P0' | 'P1' | 'P2'  // P0=bắt buộc, P1=quan trọng, P2=tùy chọn
  task: string                   // Mô tả task
  duration: string              // Thời gian ước tính
  description?: string          // Chi tiết thêm
}
```

### **DailyTasks**
```typescript
interface DailyTasks {
  weekday: {
    tasks: MicroTask[]
  }
  weekend: {
    tasks: MicroTask[]
  }
}
```

### **WeeklyChecklist**
```typescript
interface WeeklyChecklist {
  tasks: string[]
}
```

### **MonthlyChecklist**
```typescript
interface MonthlyChecklist {
  tasks: string[]
}
```

---

## 🚀 Implementation Checklist

### **Phase 1: Setup** (30 phút)
- [x] Create `/lib/prompts.ts`
- [x] Create `/lib/planGeneration.ts`
- [x] Update `/lib/openai.ts`

### **Phase 2: Integration** (3 giờ)
- [ ] Update `/app/api/chat/route.ts`
- [ ] Update `/app/api/plans/generate/route.ts`
- [ ] Update frontend components

### **Phase 3: Testing** (2 giờ)
- [ ] Test chat responses
- [ ] Test plan generation
- [ ] Test micro-tasks
- [ ] Test checklists
- [ ] Test learning resources

### **Phase 4: Deployment** (1 giờ)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor logs

---

## 💡 Tips & Tricks

### **Testing Prompts**
1. Mở OpenAI Playground
2. Copy system prompt từ `prompts.ts`
3. Test với sample inputs
4. Iterate & improve

### **Debugging**
1. Check console logs
2. Verify API keys
3. Test with simple inputs first
4. Gradually increase complexity

### **Optimization**
1. Monitor token usage
2. Adjust max_tokens if needed
3. Fine-tune temperature (0.3 for analysis, 0.7 for creative)
4. Cache responses khi có thể

---

## 📞 Common Issues & Solutions

### **Issue: AI không trích xuất thông tin**
**Solution:** 
- Kiểm tra system prompt
- Verify input format
- Test với sample data

### **Issue: Micro-tasks quá generic**
**Solution:**
- Cập nhật prompt với ví dụ cụ thể
- Thêm context từ user profile
- Test & iterate

### **Issue: API timeout**
**Solution:**
- Giảm max_tokens
- Tách request thành chunks nhỏ hơn
- Implement retry logic

### **Issue: Spiritual analysis không chính xác**
**Solution:**
- Verify ngày sinh format (dd/mm/yyyy)
- Check spiritual analysis logic
- Test với known dates

---

## 📈 Success Metrics

**Track:**
- Chat response quality (user feedback)
- Plan completion rate
- Micro-tasks adherence
- User satisfaction score
- Conversion rate (free → paid)
- User retention rate

---

## 🔗 Related Files

- `AI_ENHANCEMENT_GUIDE.md` - Detailed guide
- `IMPLEMENTATION_STEPS.md` - Step-by-step instructions
- `AI_BEFORE_AFTER.md` - Comparison & metrics
- `lib/prompts.ts` - System prompts
- `lib/planGeneration.ts` - Plan generation logic
- `lib/openai.ts` - Updated OpenAI integration

---

## 📝 Notes

- Tất cả prompts đều có thể tùy chỉnh
- System prompts được lưu centralized để dễ bảo trì
- Micro-tasks được tạo động dựa trên user profile
- Spiritual analysis là optional (nếu user cung cấp ngày sinh)
- Tất cả responses được cache để tối ưu performance

---

## 🎓 Learning Resources

- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [System Prompts Best Practices](https://help.openai.com/en/articles/7042661-how-can-i-use-system-prompts)
- [JSON Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
