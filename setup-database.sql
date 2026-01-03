-- Supabase Database Setup Script
-- Kör denna i Supabase SQL Editor

-- 1. Skapa profiles-tabellen
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  order_count INTEGER DEFAULT 0
);

-- 2. Skapa orders-tabellen
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NULL,
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  guest_company TEXT,
  package_type TEXT NOT NULL,
  bank TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- 5. Skapa policies för profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Skapa policies för orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 7. Skapa funktion för att öka order_count
CREATE OR REPLACE FUNCTION increment_order_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET order_count = order_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Skapa en trigger för att automatiskt skapa profil när användare registrerar sig
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, order_count)
  VALUES (new.id, new.email, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
