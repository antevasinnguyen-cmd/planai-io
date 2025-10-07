# 🔐 Luồng Đăng Ký / Đăng Nhập PlanAI

## 📋 Tổng Quan Luồng

```
Landing Page → Login/Signup → Auth Callback → Welcome Page → Dashboard → Chat/Plans
     ↓              ↓              ↓              ↓            ↓          ↓
   CTA Buttons   OAuth/Email    Session Setup   Onboarding   Usage      Upgrade
                                                            Tracking     Prompts
```

## 🎯 Các Trang Chính

### 1. **Landing Page** (`/`)
- **CTA chính**: "Bắt đầu miễn phí" → `/start`
- **CTA phụ**: "Đăng nhập" → `/login`
- **Social proof**: 5,000+ users, testimonials
- **Features showcase**: Chat AI, Plan creation

### 2. **Trang Đăng Ký** (`/signup`)
- **Form đăng ký**: Email, password, full name
- **Google OAuth**: Đăng ký nhanh với Google
- **Validation**: Password strength, terms agreement
- **Redirect**: → `/auth/callback` → `/welcome`

### 3. **Trang Đăng Nhập** (`/login`)
- **Form đăng nhập**: Email, password
- **Google OAuth**: Đăng nhập nhanh với Google
- **Remember redirect**: Lưu đường dẫn trước đó
- **Redirect**: → `/auth/callback` → `/welcome`

### 4. **Auth Callback** (`/auth/callback`)
- **Session handling**: Xử lý OAuth callback
- **Token validation**: Kiểm tra access/refresh tokens
- **Success storage**: Lưu thông báo thành công
- **Redirect**: → `/welcome` (mặc định)

### 5. **Welcome Page** (`/welcome`) ⭐ **MỚI**
- **Success celebration**: Chúc mừng đăng ký thành công
- **Quick start guide**: 3 bước sử dụng
- **Free plan benefits**: Hiển thị gói Free
- **CTA buttons**: Chat AI, Tạo kế hoạch
- **Upgrade prompt**: Soft CTA nâng cấp

### 6. **Onboarding** (`/start`)
- **3-step process**: Mục tiêu → Tài chính → Xác nhận
- **Data collection**: Thu thập thông tin user
- **Free plan info**: Giải thích gói Free
- **Redirect**: → `/dashboard`

### 7. **Dashboard** (`/dashboard`)
- **Usage tracking**: Hiển thị usage với progress bars
- **Upgrade prompts**: CTA thông minh dựa trên usage
- **Quick actions**: Chat, Plans, Account
- **Success message**: Hiển thị khi vừa đăng nhập

### 8. **Chat AI** (`/dashboard/chat`)
- **Usage warnings**: Cảnh báo khi gần hết quota
- **Upgrade prompts**: Banner/card prompts
- **Feature limits**: Thông báo khi đạt giới hạn

## 🚀 Tính Năng CTA & Upgrade

### **UpgradePrompt Component**
- **3 variants**: Banner, Modal, Card
- **3 triggers**: Quota warning, Feature limit, General
- **Smart timing**: Dựa trên usage percentage
- **Dismissible**: User có thể tắt tạm thời

### **UsageProgressBar Component**
- **Visual progress**: Progress bar với màu sắc
- **Status indicators**: Warning khi gần hết
- **Upgrade buttons**: CTA nâng cấp inline
- **Real-time updates**: Cập nhật theo usage

### **Upgrade Triggers**
1. **High Usage (≥80%)**: Banner warning đỏ
2. **Medium Usage (≥70%)**: Orange warning
3. **Feature Limit**: Modal popup khi truy cập premium
4. **General**: Card prompts cho free users
5. **New User**: Soft prompts sau onboarding

## 🔒 Middleware & Protection

### **Protected Routes**
```typescript
['/dashboard', '/account', '/plans', '/settings', '/welcome', '/start']
```

### **Redirect Logic**
- **Chưa đăng nhập** + protected route → `/login?redirectedFrom=...`
- **Đã đăng nhập** + `/login`|`/signup` → `/dashboard`
- **Auth callback success** → `/welcome`

## 📊 Usage Tracking & Limits

### **Free Tier Limits**
- **Chat AI**: 5 conversations
- **Plans**: 1 short plan
- **Words**: 1,000 words

### **Upgrade Prompts Timing**
- **90%+ usage**: High urgency (red)
- **70-89% usage**: Medium urgency (orange)
- **50-69% usage**: Low urgency prompts
- **<50% usage**: General upgrade education

## 🎨 UX Improvements

### **Success Celebrations**
- **Welcome page**: Celebration với confetti effect
- **Dashboard**: Success alert với animation
- **Progress tracking**: Visual feedback

### **Smart CTAs**
- **Context-aware**: Khác nhau theo trang
- **Usage-based**: Thay đổi theo mức sử dụng
- **Non-intrusive**: Không gây phiền nhiễu
- **Value-focused**: Nhấn mạnh lợi ích

### **Onboarding Flow**
- **Progressive disclosure**: Từng bước một
- **Value proposition**: Giải thích lợi ích
- **Quick start**: Hướng dẫn nhanh
- **Social proof**: Testimonials và stats

## 🔧 Technical Implementation

### **Key Components**
- `UpgradePrompt`: Smart upgrade prompts
- `UsageProgressBar`: Visual usage tracking
- `SuccessAlert`: Celebration messages
- `useUpgradePrompts`: Hook quản lý prompts

### **State Management**
- **localStorage**: Dismissed prompts, redirect paths
- **Auth context**: User session management
- **Usage tracking**: Real-time usage updates

### **Performance**
- **Lazy loading**: Components load khi cần
- **Caching**: Usage data caching
- **Optimistic updates**: UI updates trước API

## 📈 Conversion Optimization

### **Funnel Stages**
1. **Awareness**: Landing page CTAs
2. **Interest**: Feature demonstrations
3. **Trial**: Free signup process
4. **Usage**: Onboarding và first value
5. **Upgrade**: Smart prompts và limits

### **Key Metrics**
- **Signup conversion**: Landing → Signup
- **Activation rate**: Signup → First chat/plan
- **Upgrade rate**: Free → Paid
- **Retention**: Monthly active users

### **A/B Testing Ready**
- **CTA variations**: Button text, colors, placement
- **Prompt timing**: When to show upgrade prompts
- **Onboarding flow**: Steps và content
- **Pricing presentation**: Plans và features

## 🎯 Next Steps

1. **Analytics Integration**: Track conversion funnels
2. **A/B Testing**: Test CTA variations
3. **Email Sequences**: Post-signup nurturing
4. **Referral Program**: User acquisition
5. **Advanced Prompts**: ML-based timing
