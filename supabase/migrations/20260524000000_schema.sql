-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    deactivated BOOLEAN DEFAULT FALSE,
    deactivated_at TIMESTAMPTZ,
    deletion_scheduled BOOLEAN DEFAULT FALSE,
    scheduled_deletion_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Phone Index Table (for resolving phone number to email on sign-in)
CREATE TABLE IF NOT EXISTS public.phone_index (
    phone TEXT PRIMARY KEY,
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Settings Table (stores budgets, accounts, finance, and family configs)
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    budgets JSONB DEFAULT '{}'::jsonb,
    accounts JSONB DEFAULT '{"cash": 0, "bank": 0, "upi": 0}'::jsonb,
    finance JSONB DEFAULT '{"openingBalance": 0, "openingDate": "", "gstRate": 18, "registered": false, "onboardingDone": false}'::jsonb,
    family JSONB DEFAULT '{"inviteCode": "", "linkedUid": null, "linkedName": null}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    type TEXT NOT NULL, -- 'credit' or 'debit'
    account TEXT DEFAULT 'Cash',
    is_want BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Debts Table
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    repaid BOOLEAN DEFAULT FALSE,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target NUMERIC NOT NULL,
    current NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Recurring Table
CREATE TABLE IF NOT EXISTS public.recurring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    members JSONB DEFAULT '[]'::jsonb,
    expenses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create Family Links Table (handshake for Family Mode invite codes)
CREATE TABLE IF NOT EXISTS public.family_links (
    code TEXT PRIMARY KEY,
    uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    linked_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    linked_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enable Row Level Security (RLS) ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──

-- Profiles
CREATE POLICY "Allow view own profile or linked partner profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR id = (
            SELECT (family->>'linkedUid')::uuid 
            FROM public.settings 
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Allow update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Phone Index
CREATE POLICY "Allow public phone lookup" ON public.phone_index
    FOR SELECT USING (true);
CREATE POLICY "Allow manage own phone index" ON public.phone_index
    FOR ALL USING (auth.uid() = uid);

-- Settings
CREATE POLICY "Allow view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Allow view own or linked partner transactions" ON public.transactions
    FOR SELECT USING (
        auth.uid() = user_id OR user_id = (
            SELECT (family->>'linkedUid')::uuid 
            FROM public.settings 
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Allow manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Debts
CREATE POLICY "Allow manage own debts" ON public.debts
    FOR ALL USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "Allow manage own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Bills
CREATE POLICY "Allow manage own bills" ON public.bills
    FOR ALL USING (auth.uid() = user_id);

-- Recurring
CREATE POLICY "Allow manage own recurring" ON public.recurring
    FOR ALL USING (auth.uid() = user_id);

-- Groups
CREATE POLICY "Allow manage own groups" ON public.groups
    FOR ALL USING (auth.uid() = user_id);

-- Family Links
CREATE POLICY "Allow public view family links" ON public.family_links
    FOR SELECT USING (true);
CREATE POLICY "Allow public update family links" ON public.family_links
    FOR UPDATE USING (true);
CREATE POLICY "Allow manage own family links" ON public.family_links
    FOR ALL USING (auth.uid() = uid);

-- ── Trigger for creating profile and settings on user signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  var_phone TEXT;
BEGIN
  var_phone := COALESCE(new.phone, new.raw_user_meta_data->>'phone');

  INSERT INTO public.profiles (id, username, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'MoneyFlow User'),
    new.email,
    var_phone
  );

  -- Insert into phone_index if phone is provided
  IF var_phone IS NOT NULL AND var_phone <> '' THEN
    INSERT INTO public.phone_index (phone, uid, email)
    VALUES (var_phone, new.id, new.email)
    ON CONFLICT (phone) DO UPDATE SET uid = EXCLUDED.uid, email = EXCLUDED.email;
  END IF;

  INSERT INTO public.settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for syncing updates from profiles to phone_index
CREATE OR REPLACE FUNCTION public.handle_profile_phone_update()
RETURNS trigger AS $$
BEGIN
  -- Delete old phone from phone_index if it was changed
  IF (OLD.phone IS DISTINCT FROM NEW.phone) AND OLD.phone IS NOT NULL AND OLD.phone <> '' THEN
    DELETE FROM public.phone_index WHERE phone = OLD.phone;
  END IF;

  -- Insert or update new phone in phone_index if it is provided
  IF (NEW.phone IS NOT NULL AND NEW.phone <> '') AND 
     ((OLD.phone IS DISTINCT FROM NEW.phone) OR (OLD.email IS DISTINCT FROM NEW.email)) THEN
    INSERT INTO public.phone_index (phone, uid, email)
    VALUES (NEW.phone, NEW.id, NEW.email)
    ON CONFLICT (phone) DO UPDATE SET uid = EXCLUDED.uid, email = EXCLUDED.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_phone_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_phone_update();

-- 11. Function to allow users to permanently delete their own account
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


