-- Yordamchining jonli joylashuvini kuzatish (kuzatish.html) uchun kerakli ustunlar
-- va Realtime yoyilishini yoqadi. Buni Supabase SQL Editorda ishga tushiring.

alter table public.tasks
    add column if not exists helper_latitude double precision,
    add column if not exists helper_longitude double precision;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'tasks'
    ) then
        alter publication supabase_realtime add table public.tasks;
    end if;
end $$;
