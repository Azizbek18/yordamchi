-- =====================================================================
--  CHAT SCHEMA — Topshiriq.uz
--  Run this in Supabase SQL Editor
--  Creates: conversations, messages  (+ helper views + function)
--
--  ВАЖНО: в этом проекте profiles.id НЕ равен auth.uid() — id
--  генерируется на клиенте через crypto.randomUUID() в register.js.
--  Поэтому RLS-политики на auth.uid() не работают — отключаем RLS
--  (как уже сделано для таблицы tasks) и фильтруем в JS по
--  currentUser.id из localStorage.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 0. ОЧИСТКА старых объектов (идемпотентно, можно запускать много раз)
-- ─────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_touch_conversation ON public.messages;

DROP FUNCTION IF EXISTS public.touch_conversation_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID) CASCADE;

DROP VIEW IF EXISTS public.v_conversations_preview;

-- Удаляем старые RLS-политики если были
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename IN ('conversations', 'messages')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

DROP TABLE IF EXISTS public.messages      CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;


-- ─────────────────────────────────────────────────────────────────────
-- 1. CONVERSATIONS  — один диалог между двумя пользователями
--    (привязка к task_id опциональна, чтобы можно было делать
--     чаты и без задачи)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- один диалог между двумя юзерами по одной задаче — только один
    CONSTRAINT conversations_unique_pair UNIQUE (task_id, participant1_id, participant2_id),
    CONSTRAINT conversations_not_same_user CHECK (participant1_id <> participant2_id)
);

CREATE INDEX idx_conversations_p1      ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_p2      ON public.conversations(participant2_id);
CREATE INDEX idx_conversations_task    ON public.conversations(task_id);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);


-- ─────────────────────────────────────────────────────────────────────
-- 2. MESSAGES  — отдельные сообщения внутри диалога
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender       ON public.messages(sender_id);
CREATE INDEX idx_messages_unread       ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────
-- 3. ТРИГГЕР: авто-обновление updated_at диалога при новом сообщении
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
       SET updated_at = now()
     WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_conversation
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_conversation_updated_at();


-- ─────────────────────────────────────────────────────────────────────
-- 4. VIEW — превью диалогов для боковой панели (последнее сообщение + непрочитанные)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_conversations_preview AS
SELECT
    c.id                                       AS conversation_id,
    c.task_id,
    c.participant1_id,
    c.participant2_id,
    c.created_at,
    c.updated_at,
    last_msg.content                           AS last_message,
    last_msg.created_at                        AS last_message_at,
    last_msg.sender_id                         AS last_message_sender_id,
    unread.unread_count
FROM public.conversations c
LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
) last_msg ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS unread_count
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.read_at IS NULL
) unread ON true;


-- ─────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — ОТКЛЮЧЁН
--    (в этом проекте profiles.id не связан с Supabase Auth,
--     авторизация идёт через прямую выборку из profiles в kirish.js,
--     поэтому auth.uid() всегда NULL и RLS не работает.
--     Аналогично таблице tasks — отключаем RLS, фильтрация в JS.)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      DISABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────
-- 6. REALTIME — включаем таблицы в публикацию supabase_realtime
--    Если блок упадёт — не критично, можно включить вручную:
--    Dashboard → Database → Replication → supabase_realtime →
--    поставить галочки на messages и conversations
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 7. ФУНКЦИЯ: получить или создать диалог между двумя участниками
--    Вызов из JS через _supabase.rpc('get_or_create_conversation', { ... })
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    p_current_user_id UUID,
    p_other_user_id   UUID,
    p_task_id         UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conv_id UUID;
    v_p1      UUID;
    v_p2      UUID;
BEGIN
    IF p_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Current user id is required';
    END IF;
    IF p_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;

    -- Детерминированный порядок участников (чтобы не было дубликатов)
    IF p_current_user_id < p_other_user_id THEN
        v_p1 := p_current_user_id;
        v_p2 := p_other_user_id;
    ELSE
        v_p1 := p_other_user_id;
        v_p2 := p_current_user_id;
    END IF;

    SELECT id INTO v_conv_id
      FROM public.conversations
     WHERE (p_task_id IS NULL OR task_id = p_task_id)
       AND participant1_id = v_p1
       AND participant2_id = v_p2
     LIMIT 1;

    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations (task_id, participant1_id, participant2_id)
        VALUES (p_task_id, v_p1, v_p2)
        ON CONFLICT (task_id, participant1_id, participant2_id) DO NOTHING
        RETURNING id INTO v_conv_id;

        -- Если ON CONFLICT сработал и RETURNING пустой — достаём вручную
        IF v_conv_id IS NULL THEN
            SELECT id INTO v_conv_id
              FROM public.conversations
             WHERE (p_task_id IS NULL OR task_id = p_task_id)
               AND participant1_id = v_p1
               AND participant2_id = v_p2
             LIMIT 1;
        END IF;
    END IF;

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────
-- 8. ФИНАЛЬНАЯ ПРОВЕРКА (раскомментируйте и запустите, чтобы увидеть результат)
-- ─────────────────────────────────────────────────────────────────────
-- SELECT 'conversations' AS tbl, COUNT(*) FROM public.conversations
-- UNION ALL
-- SELECT 'messages', COUNT(*) FROM public.messages;
