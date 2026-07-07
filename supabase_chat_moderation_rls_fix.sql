-- =====================================================================
--  CHAT / MODERATSIYA RLS QULFLASH — Topshiriq.uz
--  Supabase SQL Editor'da ishga tushiring.
--
--  Muammo: database_schema.sql / chat_schema.sql da conversations,
--  messages, chats, chat_participants, disputes va notifications
--  jadvallarida RLS "USING (true)" (hammaga ochiq) yoki butunlay
--  o'chirilgan edi. Loyihada frontend "anon" kalit orqali ishlaydi va
--  bu kalit auth.js ichida ochiq holda yuboriladi -- ya'ni har qanday
--  brauzer konsolidan to'g'ridan-to'g'ri so'rov yuborib boshqa
--  foydalanuvchining shaxsiy chat xabarlarini yoki shikoyatlarini
--  o'qish/soxtalashtirish mumkin edi.
--
--  Bu fayl faqat CHAT va MODERATSIYA bilan bog'liq jadvallarni
--  qulflaydi (foydalanuvchi so'ragan doira). profiles, task_bids,
--  transactions, reviews kabi qolgan jadvallar hali ham ochiq --
--  ular alohida so'rov bilan qulflanishi kerak.
--
--  supabase_tasks_soft_delete_fix.sql dagi is_current_profile()
--  funksiyasidan foydalanadi (bu yerda ham qayta yaratiladi, shuning
--  uchun bu faylni mustaqil ishga tushirish ham mumkin).
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 0. HELPER FUNKSIYALAR
-- ─────────────────────────────────────────────────────────────────────

-- Joriy Supabase Auth sessiyasi shu profiles.id ga tegishlimi
-- (auth.uid() to'g'ridan-to'g'ri mos kelmasa ham, email orqali fallback).
CREATE OR REPLACE FUNCTION public.is_current_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT profile_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = profile_id
              AND lower(p.email) = lower(auth.jwt() ->> 'email')
        );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_profile(uuid) TO authenticated;

-- Joriy foydalanuvchi shu (eski sxemadagi) chat ishtirokchisimi.
-- SECURITY DEFINER bo'lgani uchun chat_participants ustidagi RLS
-- siyosati ichida o'z-o'ziga rekursiyaga tushmaydi.
CREATE OR REPLACE FUNCTION public.is_chat_participant(target_chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.chat_id = target_chat_id
          AND public.is_current_profile(cp.user_id)
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 1. messages jadvali ikkala sxemani (conversation_id / chat_id) ham
--    qo'llab-quvvatlashi uchun yetishmayotgan ustunlarni to'ldiramiz.
--    Mavjud ma'lumotlarga tegmaydi.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────
-- Yordamchi: berilgan jadvaldagi barcha eski siyosatlarni tozalash
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename IN ('conversations', 'messages', 'chats', 'chat_participants', 'disputes', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. CONVERSATIONS
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON public.conversations
    FOR SELECT TO authenticated
    USING (public.is_current_profile(participant1_id) OR public.is_current_profile(participant2_id));

CREATE POLICY "conversations_insert_participant" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_profile(participant1_id) OR public.is_current_profile(participant2_id));

CREATE POLICY "conversations_update_participant" ON public.conversations
    FOR UPDATE TO authenticated
    USING (public.is_current_profile(participant1_id) OR public.is_current_profile(participant2_id))
    WITH CHECK (public.is_current_profile(participant1_id) OR public.is_current_profile(participant2_id));

-- ─────────────────────────────────────────────────────────────────────
-- 3. MESSAGES
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (public.is_current_profile(c.participant1_id) OR public.is_current_profile(c.participant2_id))
        ))
        OR (chat_id IS NOT NULL AND public.is_chat_participant(chat_id))
    );

CREATE POLICY "messages_insert_participant" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_current_profile(sender_id)
        AND (
            (conversation_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = messages.conversation_id
                  AND (public.is_current_profile(c.participant1_id) OR public.is_current_profile(c.participant2_id))
            ))
            OR (chat_id IS NOT NULL AND public.is_chat_participant(chat_id))
        )
    );

CREATE POLICY "messages_update_participant" ON public.messages
    FOR UPDATE TO authenticated
    USING (
        (conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (public.is_current_profile(c.participant1_id) OR public.is_current_profile(c.participant2_id))
        ))
        OR (chat_id IS NOT NULL AND public.is_chat_participant(chat_id))
    )
    WITH CHECK (
        (conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (public.is_current_profile(c.participant1_id) OR public.is_current_profile(c.participant2_id))
        ))
        OR (chat_id IS NOT NULL AND public.is_chat_participant(chat_id))
    );

-- ─────────────────────────────────────────────────────────────────────
-- 4. CHATS / CHAT_PARTICIPANTS (eski sxema, faqat fallback sifatida)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chats_select_participant" ON public.chats
    FOR SELECT TO authenticated
    USING (public.is_chat_participant(id));

-- Chat qatori o'zi hech qanday shaxsiy ma'lumot saqlamaydi (faqat id +
-- task_id), shuning uchun yaratishni istalgan autentifikatsiyalangan
-- foydalanuvchiga ruxsat beramiz -- xavfsizlik chat_participants va
-- messages darajasida ta'minlanadi.
CREATE POLICY "chats_insert_authenticated" ON public.chats
    FOR INSERT TO authenticated
    WITH CHECK (true);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_participants_select_own_chat" ON public.chat_participants
    FOR SELECT TO authenticated
    USING (public.is_chat_participant(chat_id));

-- Chat yaratuvchisi o'zini va suhbatdoshini bitta so'rovda qo'shadi
-- (chatlar.js: createLegacyChat), shuning uchun ikkinchi qatorni
-- is_current_profile bilan cheklab bo'lmaydi.
CREATE POLICY "chat_participants_insert_authenticated" ON public.chat_participants
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- 5. DISPUTES (Moderatsiya / shikoyatlar)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_select_own" ON public.disputes
    FOR SELECT TO authenticated
    USING (public.is_current_profile(reporter_id));

CREATE POLICY "disputes_insert_own_task" ON public.disputes
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_current_profile(reporter_id)
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = disputes.task_id
              AND (public.is_current_profile(t.poster_id) OR public.is_current_profile(t.helper_id))
        )
    );

-- UPDATE/DELETE siyosati kerak emas -- ilova bunday amallarni
-- bajarmaydi, standart RLS bo'yicha bloklanadi.

-- ─────────────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS
--    (chat xabarlari va boshqa hodisalar shu jadval orqali
--     bildirishnoma sifatida saqlanadi -- shaxsiy kontent, chat bilan
--     bevosita bog'liq, shuning uchun shu qulflashga qo'shildi)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT TO authenticated
    USING (public.is_current_profile(user_id));

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE TO authenticated
    USING (public.is_current_profile(user_id))
    WITH CHECK (public.is_current_profile(user_id));

-- Bildirishnomani har doim BOSHQA foydalanuvchi (masalan, chatdagi
-- suhbatdosh yoki vazifa beruvchi) yaratadi, shuning uchun insertni
-- is_current_profile(user_id) bilan cheklab bo'lmaydi.
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);
