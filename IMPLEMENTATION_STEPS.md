# 🚀 Implementation Steps - AI Enhancement

## ✅ Hoàn Thành

### 1. **Tạo Centralized Prompts File** ✅
- **File:** `/lib/prompts.ts`
- **Nội dung:**
  - `SYSTEM_PROMPTS` object chứa tất cả system prompts
  - `getChatSystemPrompt()` - Chat assistant prompt
  - `getFinancialPlanSystemPrompt()` - Plan generation prompt
  - `getUserInputAnalysisSystemPrompt()` - Input analysis prompt
  - `getMicroTasksSystemPrompt()` - Micro-tasks generation prompt
  - `getSpiritualAnalysisSystemPrompt()` - Spiritual analysis prompt

### 2. **Update OpenAI Library** ✅
- **File:** `/lib/openai.ts`
- **Thay đổi:**
  - Import từ `prompts.ts`
  - `generateChatResponse()` sử dụng `getChatSystemPrompt()`
  - `analyzeUserInput()` sử dụng `getUserInputAnalysisSystemPrompt()`
  - `generateFinancialPlan()` sử dụng `getFinancialPlanSystemPrompt()`

### 3. **Tạo Plan Generation Library** ✅
- **File:** `/lib/planGeneration.ts`
- **Nội dung:**
  - `generateMicroTasks()` - Tạo daily/weekly tasks
  - `generateWeeklyChecklist()` - Tạo weekly checklist
  - `generateMonthlyChecklist()` - Tạo monthly checklist
  - `generateLearningResources()` - Tạo danh sách tài liệu
  - `formatMicroTasks()` - Format tasks cho display
  - `formatChecklists()` - Format checklists cho display

---

## 📋 Các Bước Tiếp Theo

### **Bước 4: Update Chat API** (Cần làm)
**File:** `/app/api/chat/route.ts`

**Thay đổi:**
```typescript
// Thêm import
import { getChatSystemPrompt } from '@/lib/prompts'

// Cập nhật system prompt trong generateChatResponse
const systemMessage = {
  role: 'system' as const,
  content: getChatSystemPrompt()
}
```

**Lợi ích:**
- Chat sẽ sử dụng system prompt mới, chi tiết hơn
- AI sẽ trích xuất thông tin tốt hơn
- Gợi ý câu hỏi sẽ phù hợp hơn

---

### **Bước 5: Update Plan Generation API** (Cần làm)
**File:** `/app/api/plans/generate/route.ts`

**Thay đổi:**
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

// Trong POST handler, sau khi tạo plan content:
const microTasks = await generateMicroTasks(
  userProfile,
  userProfile.financial_goal,
  userProfile.timeline
)

const weeklyChecklist = await generateWeeklyChecklist(userProfile.financial_goal)
const monthlyChecklist = await generateMonthlyChecklist(userProfile.financial_goal)
const learningResources = await generateLearningResources(
  userProfile.financial_goal,
  userProfile.occupation
)

// Thêm vào plan content
const enhancedPlanContent = planContent + '\n\n' +
  formatMicroTasks(microTasks) + '\n\n' +
  formatChecklists(weeklyChecklist, monthlyChecklist) + '\n\n' +
  '📚 TÀI LIỆU HỌC TẬP:\n' + learningResources
```

**Lợi ích:**
- Kế hoạch sẽ có micro-tasks chi tiết
- Có checklist hàng tuần/tháng
- Có danh sách tài liệu học tập

---

### **Bước 6: Update Frontend - Create Plan Page** (Cần làm)
**File:** `/app/dashboard/create-plan/page.tsx`

**Thay đổi:**
- Cập nhật welcome message để phản ánh system prompt mới
- Thêm indicator cho các thông tin đã thu thập
- Hiển thị progress bar cho thông tin cần thiết

```typescript
// Ví dụ welcome message mới
const welcomeMessage = `🎉 Chào mừng bạn đến với PlanAI!

Tôi là trợ lý AI tài chính & phát triển cá nhân của bạn. 
Tôi sẽ giúp bạn tạo một kế hoạch tài chính chi tiết, thực tế & có thể thực hiện được.

Để tạo kế hoạch tốt nhất, tôi cần biết:
1. 🎯 Mục tiêu tài chính của bạn (mua nhà, kinh doanh, tiết kiệm, etc.)
2. 💰 Thu nhập hiện tại (VNĐ/tháng)
3. 💼 Kỹ năng & Nghề nghiệp
4. 📅 Thời gian mục tiêu (6 tháng, 1 năm, 3 năm, etc.)
5. 📊 Thông tin khác (tiết kiệm, nợ, khu vực, etc.)

Hãy bắt đầu bằng cách chia sẻ mục tiêu tài chính của bạn! 🚀`
```

---

### **Bước 7: Test & Optimize** (Cần làm)
**Kiểm tra:**
1. Chat API trả về phản hồi chi tiết hơn
2. Plan generation tạo micro-tasks cụ thể
3. Checklists dễ theo dõi
4. Learning resources phù hợp
5. Spiritual analysis (nếu có ngày sinh)

**Test Cases:**
```
1. User: "Tôi muốn kiếm 100 triệu trong 2 năm"
   ✓ AI hỏi: Thu nhập hiện tại? Kỹ năng? Ngày sinh?
   ✓ Plan có micro-tasks cụ thể
   ✓ Có checklist hàng tuần/tháng

2. User: "Lập trình viên, lương 40 triệu/tháng"
   ✓ AI nhận diện kỹ năng
   ✓ Gợi ý cách tăng thu nhập
   ✓ Tài liệu phù hợp ngành

3. User: "Sinh ngày 15/03/1995"
   ✓ AI phân tích tử vi/thần số
   ✓ Gợi ý phù hợp mệnh
```

---

### **Bước 8: Deploy & Monitor** (Cần làm)
**Trước deploy:**
1. Test kỹ trên staging
2. Monitor AI responses
3. Collect user feedback
4. Optimize prompts dựa trên feedback

**Sau deploy:**
1. Monitor error logs
2. Track user satisfaction
3. Liên tục cải thiện prompts
4. A/B test nếu cần

---

## 🎯 Kết Quả Mong Đợi

### **Trước Enhancement:**
```
User: "Muốn kiếm 100 triệu trong 2 năm"
AI: "Bạn muốn kiếm 100 triệu trong 2 năm. Bạn hiện có bao nhiêu tiền tiết kiệm?"
Plan: Kế hoạch cơ bản, không có micro-tasks, không có checklist
```

### **Sau Enhancement:**
```
User: "Muốn kiếm 100 triệu trong 2 năm"
AI: "Tuyệt vời! Bạn muốn kiếm 100 triệu trong 2 năm. 
     Tôi có 3 câu hỏi:
     1. Thu nhập hiện tại là bao nhiêu?
     2. Bạn làm gì hiện tại?
     3. Bạn có sẵn sàng phát triển thêm kỹ năng không?"

Plan: 
- Phân tích chi tiết
- Micro-tasks cụ thể hàng ngày
- Checklist hàng tuần/tháng
- Danh sách tài liệu học tập
- Phân tích tử vi/thần số
- Insights tâm linh
```

---

## 📊 Priority

1. **High Priority:** Bước 4 & 5 (Update APIs)
2. **Medium Priority:** Bước 6 (Frontend update)
3. **Low Priority:** Bước 7 & 8 (Testing & Deployment)

---

## 💡 Tips

- **Test từng bước:** Không cần làm hết cùng lúc
- **Monitor responses:** Kiểm tra AI responses sau mỗi update
- **Collect feedback:** Hỏi users về chất lượng kế hoạch
- **Iterate:** Liên tục cải thiện dựa trên feedback

---

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra logs trong console
2. Verify API keys (OpenAI, Anthropic)
3. Test prompts trực tiếp trên OpenAI Playground
4. Liên hệ support team
