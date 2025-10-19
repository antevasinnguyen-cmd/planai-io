# 🔄 AI Enhancement - Flow Diagrams

## 1. Chat Flow (Enhanced)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Input      │
                    │  "Muốn kiếm      │
                    │   100 triệu      │
                    │   trong 2 năm"   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  /app/api/chat/route.ts              │
                    │  - Authenticate user                 │
                    │  - Check usage limits                │
                    │  - Call generateChatResponse()       │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateChatResponse()              │
                    │  (lib/openai.ts)                     │
                    │  - Get system prompt from prompts.ts │
                    │  - Check cache                       │
                    │  - Call OpenAI API                   │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  getChatSystemPrompt()               │
                    │  (lib/prompts.ts)                    │
                    │                                      │
                    │  "Bạn là PlanAI - Chuyên gia        │
                    │   tài chính & phát triển cá nhân     │
                    │   ...                                │
                    │   Hỏi 1-2 thông tin còn thiếu       │
                    │   theo thứ tự ưu tiên"              │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  OpenAI API                          │
                    │  (gpt-4o-mini)                       │
                    │                                      │
                    │  Returns:                            │
                    │  "Tuyệt vời! Bạn muốn kiếm 100      │
                    │   triệu trong 2 năm. Tôi có 2 câu:  │
                    │   1. Thu nhập hiện tại?              │
                    │   2. Bạn làm gì?"                   │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  analyzeUserInput()                  │
                    │  (lib/openai.ts)                     │
                    │  - Extract info (13 fields)          │
                    │  - Analyze intent                    │
                    │  - Suggest next questions            │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  updateProfileFromAnalysis()         │
                    │  (lib/supabase.ts)                   │
                    │  - Save extracted info to profile    │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Save chat messages                  │
                    │  (user message + AI response)        │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Return Response                     │
                    │  {                                   │
                    │    response: "...",                  │
                    │    analysis: {...},                  │
                    │    usage: {...}                      │
                    │  }                                   │
                    └──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DISPLAY TO USER                            │
│  - AI response                                                  │
│  - Suggested questions                                          │
│  - Progress indicator                                           │
│  - "Plan" button (when enough info)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Plan Generation Flow (Enhanced)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS "PLAN"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  /app/dashboard/plans/generate       │
                    │  - Show progress UI                  │
                    │  - Call /api/plans/generate          │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  /app/api/plans/generate/route.ts    │
                    │  - Authenticate user                 │
                    │  - Check usage limits                │
                    │  - Extract user profile              │
                    │  - Call generateFinancialPlan()      │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateFinancialPlan()             │
                    │  (lib/openai.ts)                     │
                    │  - Get system prompt                 │
                    │  - Check cache                       │
                    │  - Call OpenAI API                   │
                    │  - Fallback to Claude if needed      │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  getFinancialPlanSystemPrompt()      │
                    │  (lib/prompts.ts)                    │
                    │                                      │
                    │  "Bạn là chuyên gia tài chính...     │
                    │   Tạo kế hoạch với 11 phần:         │
                    │   1. Tóm tắt                         │
                    │   2. Phân tích                       │
                    │   3. Vấn đề                          │
                    │   4. Giải pháp                       │
                    │   5. Lộ trình                        │
                    │   6. Micro-tasks                     │
                    │   7. Checklist tuần                  │
                    │   8. Checklist tháng                 │
                    │   9. Tài liệu                        │
                    │   10. Tử vi/thần số                  │
                    │   11. Insights tâm linh"             │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  OpenAI API                          │
                    │  (gpt-4o-mini)                       │
                    │  max_tokens: 4000                    │
                    │  temperature: 0.3                    │
                    │                                      │
                    │  Returns: Detailed plan (markdown)   │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateMicroTasks()                │
                    │  (lib/planGeneration.ts)             │
                    │  - Create daily tasks (P0/P1/P2)     │
                    │  - Weekday vs weekend                │
                    │  - Include duration & description    │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateWeeklyChecklist()           │
                    │  (lib/planGeneration.ts)             │
                    │  - 5-7 weekly tasks                  │
                    │  - Measurable & trackable            │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateMonthlyChecklist()          │
                    │  (lib/planGeneration.ts)             │
                    │  - 5-7 monthly tasks                 │
                    │  - Progress evaluation               │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  generateLearningResources()         │
                    │  (lib/planGeneration.ts)             │
                    │  - Books (Vietnamese priority)       │
                    │  - Online courses                    │
                    │  - YouTube channels                  │
                    │  - Blogs & websites                  │
                    │  - Tools                             │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Format & Combine                    │
                    │  (lib/planGeneration.ts)             │
                    │  - formatMicroTasks()                │
                    │  - formatChecklists()                │
                    │  - Combine all into one markdown     │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Save to Database                    │
                    │  (Supabase)                          │
                    │  - Save plan content                 │
                    │  - Save word count                   │
                    │  - Save collected info               │
                    │  - Mark as active                    │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Process with RAG                    │
                    │  (Background)                        │
                    │  - Extract key concepts              │
                    │  - Create embeddings                 │
                    │  - Store for future search           │
                    └──────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────┐
                    │  Return Response                     │
                    │  {                                   │
                    │    success: true,                    │
                    │    planId: "...",                    │
                    │    wordCount: 5000                   │
                    │  }                                   │
                    └──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REDIRECT TO PLAN VIEW                          │
│  - Display generated plan                                       │
│  - Show micro-tasks                                             │
│  - Show checklists                                              │
│  - Show learning resources                                      │
│  - Show spiritual analysis                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. System Prompts Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    lib/prompts.ts                               │
│                  (Centralized Prompts)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Chat         │ │ Financial    │ │ User Input   │
        │ Assistant    │ │ Plan         │ │ Analysis     │
        │ Prompt       │ │ Prompt       │ │ Prompt       │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ getChatSys   │ │ getFinancial │ │ getUserInput │
        │ Prompt()     │ │ PlanSysPrompt│ │ AnalysisSys  │
        │              │ │ ()           │ │ Prompt()     │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ /app/api/    │ │ /app/api/    │ │ /lib/openai  │
        │ chat/route   │ │ plans/       │ │ .ts          │
        │              │ │ generate     │ │              │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ OpenAI API   │ │ OpenAI API   │ │ OpenAI API   │
        │ (Chat)       │ │ (Plan)       │ │ (Analysis)   │
        └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 4. Data Flow - Information Extraction

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│ Chat API                                │
│ - Receive message                       │
│ - Call analyzeUserInput()               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ analyzeUserInput()                      │
│ (lib/openai.ts)                         │
│                                         │
│ System Prompt:                          │
│ "Extract 13 fields from user input"     │
│ Return JSON with:                       │
│ - intent                                │
│ - extractedInfo (13 fields)             │
│ - suggestedQuestions (3 questions)      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Extracted Information:                  │
│ {                                       │
│   goal: "Kiếm 100 triệu",              │
│   income: 40000000,                     │
│   timeline: "2 năm",                    │
│   occupation: "Lập trình viên",         │
│   skills: ["JavaScript", "React"],      │
│   birth_date: "15/03/1995",             │
│   location: "Hà Nội",                   │
│   savings: 50000000,                    │
│   expenses: 20000000,                   │
│   debt: null,                           │
│   assets: "Xe máy",                     │
│   readiness: "Cao"                      │
│ }                                       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ updateProfileFromAnalysis()             │
│ (lib/supabase.ts)                       │
│                                         │
│ Save to profiles table:                 │
│ - financial_goal                        │
│ - current_income                        │
│ - occupation                            │
│ - age (from birth_date)                 │
│ - location                              │
│ - etc.                                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ User Profile Updated                    │
│ Ready for plan generation               │
└─────────────────────────────────────────┘
```

---

## 5. Plan Generation - Detailed Steps

```
User Profile (13 fields)
    │
    ▼
┌─────────────────────────────────────────┐
│ generateFinancialPlan()                 │
│ - Create main plan (11 sections)        │
│ - Max 4000 tokens                       │
│ - Temperature 0.3 (precise)             │
└─────────────────────────────────────────┘
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
┌──────────────────┐            ┌──────────────────┐
│ generateMicro    │            │ generateWeekly   │
│ Tasks()          │            │ Checklist()      │
│                  │            │                  │
│ Daily tasks:     │            │ Weekly tasks:    │
│ - P0 (required)  │            │ - 5-7 items      │
│ - P1 (important) │            │ - Trackable      │
│ - P2 (optional)  │            │ - Measurable     │
│                  │            │                  │
│ Weekday:         │            │                  │
│ - 3-5 tasks      │            │                  │
│                  │            │                  │
│ Weekend:         │            │                  │
│ - 3-5 tasks      │            │                  │
└──────────────────┘            └──────────────────┘
    │                                     │
    └─────────────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ generateMonthly          │
        │ Checklist()              │
        │                          │
        │ Monthly tasks:           │
        │ - 5-7 items              │
        │ - Progress evaluation    │
        │ - Plan adjustment        │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ generateLearning         │
        │ Resources()              │
        │                          │
        │ - Books (Vietnamese)     │
        │ - Online courses         │
        │ - YouTube channels       │
        │ - Blogs & websites       │
        │ - Tools                  │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Format & Combine         │
        │                          │
        │ - formatMicroTasks()     │
        │ - formatChecklists()     │
        │ - Markdown format        │
        │ - Easy to read           │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Final Plan Content       │
        │ (Markdown)               │
        │                          │
        │ - Main plan (11 sections)│
        │ - Micro-tasks            │
        │ - Checklists             │
        │ - Learning resources     │
        │ - Spiritual analysis     │
        │ - Insights               │
        └──────────────────────────┘
```

---

## 6. Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND                                    │
│  /app/dashboard/create-plan/page.tsx                            │
│  - Display chat                                                 │
│  - Show progress                                                │
│  - "Plan" button                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ /app/api/chat    │        │ /app/api/plans   │
        │ /route.ts        │        │ /generate/route  │
        │                  │        │                  │
        │ Uses:            │        │ Uses:            │
        │ - getChatSys     │        │ - getFinancial   │
        │   Prompt()       │        │   PlanSysPrompt()│
        │ - analyzeUserIn  │        │ - generateMicro  │
        │   put()          │        │   Tasks()        │
        │ - updateProfile  │        │ - generateWeekly │
        │   FromAnalysis() │        │   Checklist()    │
        │                  │        │ - generateMonthly│
        │                  │        │   Checklist()    │
        │                  │        │ - generateLearni │
        │                  │        │   ngResources()  │
        └──────────────────┘        └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ lib/openai.ts    │        │ lib/openai.ts    │
        │ - generateChat   │        │ - generateFinan  │
        │   Response()     │        │   cialPlan()     │
        │ - analyzeUserIn  │        │ - generateFinan  │
        │   put()          │        │   cialPlanWith   │
        │                  │        │   Claude()       │
        └──────────────────┘        └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ lib/prompts.ts   │        │ lib/prompts.ts   │
        │ - getChatSys     │        │ - getFinancial   │
        │   Prompt()       │        │   PlanSysPrompt()│
        │ - getUserInput   │        │                  │
        │   AnalysisSys    │        │ lib/planGenera   │
        │   Prompt()       │        │ tion.ts          │
        │                  │        │ - generateMicro  │
        │                  │        │   Tasks()        │
        │                  │        │ - generateWeekly │
        │                  │        │   Checklist()    │
        │                  │        │ - etc.           │
        └──────────────────┘        └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ OpenAI API       │        │ OpenAI API       │
        │ (gpt-4o-mini)    │        │ (gpt-4o-mini)    │
        │                  │        │ + Fallback:      │
        │ Returns:         │        │ Claude-3.5-Sonnet│
        │ - Chat response  │        │                  │
        │ - Analysis JSON  │        │ Returns:         │
        │ - Suggested Qs   │        │ - Plan content   │
        │                  │        │ - Micro-tasks    │
        │                  │        │ - Checklists     │
        │                  │        │ - Resources      │
        └──────────────────┘        └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ lib/supabase.ts  │        │ lib/supabase.ts  │
        │ - saveChatMsg()  │        │ - savePlan()     │
        │ - updateProfile  │        │ - saveCachedResp │
        │   FromAnalysis() │        │   onse()         │
        │ - checkUsageLim  │        │ - checkUsageLim  │
        │   its()          │        │   its()          │
        └──────────────────┘        └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ Supabase DB      │        │ Supabase DB      │
        │ - chat_messages  │        │ - plans          │
        │ - profiles       │        │ - profiles       │
        │ - cache          │        │ - cache          │
        └──────────────────┘        └──────────────────┘
```

---

## 7. Information Flow Summary

```
CHAT PHASE:
User Input → Chat API → OpenAI (with new prompt) → Analysis → Profile Update → Chat Response

PLAN PHASE:
User Profile → Plan API → OpenAI (with new prompt) → Micro-tasks → Checklists → Resources → DB

DISPLAY PHASE:
Plan DB → Frontend → Render Plan → Show Micro-tasks → Show Checklists → Show Resources
```

---

## 8. Key Improvements

```
BEFORE:
User → Chat → Generic response → Plan → Basic plan

AFTER:
User → Chat (detailed) → Analysis → Profile → Plan (comprehensive)
                                              ├─ Micro-tasks
                                              ├─ Checklists
                                              ├─ Resources
                                              └─ Spiritual analysis
```

---

This diagram shows how all components work together to create an enhanced AI experience!
