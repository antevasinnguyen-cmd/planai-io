-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  location TEXT,
  occupation TEXT,
  current_income DECIMAL,
  target_income DECIMAL,
  financial_goal TEXT,
  timeline TEXT,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  education_level TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'pro_max')),
  chat_count INTEGER DEFAULT 0,
  plan_count INTEGER DEFAULT 0,
  spiritual_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  version INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'VND',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'VND',
  chat_limit INTEGER NOT NULL,
  plan_limit INTEGER NOT NULL,
  word_limit INTEGER NOT NULL,
  features JSONB,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, price, chat_limit, plan_limit, word_limit, features, is_popular) VALUES
('free', 'Free', 0, 5, 1, 1500, '["Phân tích cơ bản", "1 kế hoạch ngắn", "Export PDF"]', false),
('basic', 'Gói 1', 169000, 30, 1, 8000, '["30 Chat với AI", "1 Ebook plan (5-8k từ)", "Export PDF/Word/Docs", "Google Sheets/Notion", "Phân tích tử vi"]', false),
('pro', 'Gói 2 - Pro', 289000, 70, 3, 12000, '["70 Chat với AI", "3 Ebook plan (9-12k từ)", "Export tất cả định dạng", "Phân tích tử vi", "Blog trả phí", "Tính năng mới sớm"]', true),
('pro_max', 'Gói 3 - Pro Max', 499000, 150, 6, 20000, '["150 Chat với AI", "6 Ebook plan (15-20k từ)", "Export tất cả định dạng", "Phân tích tử vi", "Blog trả phí", "Tính năng mới sớm", "Hỗ trợ ưu tiên"]', false);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plans" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
