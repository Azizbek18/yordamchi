-- Fix: "column messages.conversation_id does not exist"
--
-- Sabab: database_schema.sql "messages" jadvalini faqat chat_id (eski chats/
-- chat_participants tizimi) bilan yaratadi, lekin chatlar.js yangi
-- conversations/conversation_id tizimidan foydalanadi. Shu farq tufayli
-- xabar yozishda insert conversation_id ustuniga tushmoqchi bo'lib,
-- ustun mavjud bo'lmagani uchun xatolik beradi.
--
-- Run this in Supabase SQL Editor.

-- 1. chat_id endi majburiy bo'lmasin (eski tizim ixtiyoriy, ma'lumot yo'qolmaydi)
alter table public.messages
    alter column chat_id drop not null;

-- 2. conversation_id ustunini qo'shamiz
alter table public.messages
    add column if not exists conversation_id uuid references public.conversations(id) on delete cascade,
    add column if not exists read_at timestamptz;

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);

-- 3. Yangi xabar kelganda conversations.updated_at ni yangilaydigan trigger
create or replace function public.touch_conversation_updated_at()
returns trigger as $$
begin
    if new.conversation_id is not null then
        update public.conversations
           set updated_at = now()
         where id = new.conversation_id;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_conversation on public.messages;
create trigger trg_touch_conversation
    after insert on public.messages
    for each row
    execute function public.touch_conversation_updated_at();

-- 4. get_or_create_conversation funksiyasi mavjudligiga ishonch hosil qilamiz
create or replace function public.get_or_create_conversation(
    p_current_user_id uuid,
    p_other_user_id   uuid,
    p_task_id         uuid default null
)
returns uuid as $$
declare
    v_conv_id uuid;
    v_p1      uuid;
    v_p2      uuid;
begin
    if p_current_user_id is null then
        raise exception 'Current user id is required';
    end if;
    if p_current_user_id = p_other_user_id then
        raise exception 'Cannot create conversation with yourself';
    end if;

    if p_current_user_id < p_other_user_id then
        v_p1 := p_current_user_id;
        v_p2 := p_other_user_id;
    else
        v_p1 := p_other_user_id;
        v_p2 := p_current_user_id;
    end if;

    select id into v_conv_id
      from public.conversations
     where (p_task_id is null or task_id = p_task_id)
       and participant1_id = v_p1
       and participant2_id = v_p2
     limit 1;

    if v_conv_id is null then
        insert into public.conversations (task_id, participant1_id, participant2_id)
        values (p_task_id, v_p1, v_p2)
        on conflict (task_id, participant1_id, participant2_id) do nothing
        returning id into v_conv_id;

        if v_conv_id is null then
            select id into v_conv_id
              from public.conversations
             where (p_task_id is null or task_id = p_task_id)
               and participant1_id = v_p1
               and participant2_id = v_p2
             limit 1;
        end if;
    end if;

    return v_conv_id;
end;
$$ language plpgsql security definer;

-- 5. Realtime uchun messages/conversations publikatsiyaga qo'shamiz (xato bo'lsa muhim emas)
do $$
begin
    begin
        alter publication supabase_realtime add table public.messages;
    exception when others then null;
    end;
    begin
        alter publication supabase_realtime add table public.conversations;
    exception when others then null;
    end;
end $$;
