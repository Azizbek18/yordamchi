-- Topshiriq.uz - Supabase Database Schema
-- Last Updated: 2026-07-01
-- This script drops old tables and sets up the new tables, relationships, indexes, and triggers.

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. CLEAN UP OLD TABLES (DROP IF EXISTS)
-- ==========================================
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS neighborhood_posts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS task_tracking_steps CASCADE;
DROP TABLE IF EXISTS task_bids CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;

-- ==========================================
-- 1. NEIGHBORHOODS (Mahallalar)
-- ==========================================
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    district TEXT NOT NULL, -- e.g., 'Yunusobod', 'Chilonzor'
    city TEXT NOT NULL DEFAULT 'Toshkent',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for neighborhoods
CREATE POLICY "Allow public read access to neighborhoods" ON neighborhoods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write access to neighborhoods" ON neighborhoods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 2. PROFILES (User profiles / accounts)
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Custom login password matching register.js & kirish.js
    role TEXT NOT NULL CHECK (role IN ('helper', 'poster')), -- helper = ijrochi, poster = buyurtmachi
    phone TEXT,
    district TEXT,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[], -- Array of skills for helpers (e.g., ['Elektr', 'Santexnika'])
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    balance NUMERIC(12,2) DEFAULT 0.00 CHECK (balance >= 0.00),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    availability JSONB DEFAULT '{"status": "available", "hours": "full_time"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (Supports custom login & registration via anon role)
CREATE POLICY "Allow public read access to profiles" ON profiles
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert access to profiles" ON profiles
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update access to profiles" ON profiles
    FOR UPDATE TO anon, authenticated USING (true);

-- ==========================================
-- 3. TASKS (Topshiriqlar)
-- ==========================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    helper_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'xarid', 'tamirlash', 'yetkazish', 'tozalash', 'raqamli', 'boshqa'
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0.00),
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    distance NUMERIC(3,1) DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'assigned', 'on_the_way', 'arrived', 'started', 'completed', 'cancelled')),
    
    -- Completion proof fields
    result_desc TEXT,
    result_photo_url TEXT,
    
    -- Helper coordinates for live map tracking
    helper_latitude DOUBLE PRECISION,
    helper_longitude DOUBLE PRECISION,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks (Supports custom task creation & management via anon role)
CREATE POLICY "Allow public read access to tasks" ON tasks
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert access to tasks" ON tasks
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update access to tasks" ON tasks
    FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Allow public delete access to tasks" ON tasks
    FOR DELETE TO anon, authenticated USING (true);

-- ==========================================
-- 4. TASK BIDS (Takliflar / Arizalar)
-- ==========================================
CREATE TABLE task_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0.00),
    proposal TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (task_id, helper_id)
);

ALTER TABLE task_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_bids
CREATE POLICY "Allow public access to task_bids" ON task_bids FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 5. TASK TRACKING MILESTONES (Kuzatish Bosqichlari)
-- ==========================================
CREATE TABLE task_tracking_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_tracking_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_tracking_steps
CREATE POLICY "Allow public access to task_tracking_steps" ON task_tracking_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 6. CHATS (Suhbat xonalari)
-- ==========================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Allow public access to chats" ON chats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Participant join table
CREATE TABLE chat_participants (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id)
);

ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_participants
CREATE POLICY "Allow public access to chat_participants" ON chat_participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 7. MESSAGES (Xabarlar)
-- ==========================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Allow public access to messages" ON messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 8. NOTIFICATIONS (Bildirishnomalar)
-- ==========================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('offer', 'status', 'chat', 'system')),
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Allow public access to notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 9. REVIEWS (Baholash va Sharhlar)
-- ==========================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('helper', 'poster')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Allow public access to reviews" ON reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Trigger to recalculate ratings for profile on new review
CREATE OR REPLACE FUNCTION public.recalculate_user_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating = (SELECT COALESCE(AVG(rating), 5.00) FROM public.reviews WHERE reviewee_id = new.reviewee_id),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = new.reviewee_id)
  WHERE id = new.reviewee_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_review_submitted ON public.reviews;
CREATE TRIGGER on_review_submitted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_rating();

-- ==========================================
-- 10. TRANSACTIONS (Moliyaviy Amaliyotlar)
-- ==========================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment_freeze', 'payment_release', 'payment_refund', 'deposit', 'withdrawal')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Allow public access to transactions" ON transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 11. NEIGHBORHOOD POSTS (Mahalla Yangiliklari)
-- ==========================================
CREATE TABLE neighborhood_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('hashar', 'alert', 'news', 'event', 'discussion')),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neighborhood_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for neighborhood_posts
CREATE POLICY "Allow public access to neighborhood_posts" ON neighborhood_posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Comments on posts
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES neighborhood_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments
CREATE POLICY "Allow public access to post_comments" ON post_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 12. DISPUTES (Muammolar va Arbitraj)
-- ==========================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Allow public access to disputes" ON disputes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 13. CONVERSATIONS (Suhbatlar)
-- ==========================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT conversations_unique_pair UNIQUE (task_id, participant1_id, participant2_id),
    CONSTRAINT conversations_not_same_user CHECK (participant1_id <> participant2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Allow public access to conversations" ON conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 14. RATINGS (Reyting baholari)
-- ==========================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Allow public access to ratings" ON ratings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- Indexes for performance optimization
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tasks_poster ON tasks(poster_id);
CREATE INDEX IF NOT EXISTS idx_tasks_helper ON tasks(helper_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_bids_task ON task_bids(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_neighborhood ON neighborhood_posts(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations (participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations (participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_task ON conversations (task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);
