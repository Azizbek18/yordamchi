    -- Tasks table production fields + soft-delete RLS fix.
    -- Run this in Supabase SQL Editor.

    alter table public.tasks
        add column if not exists poster_id uuid references public.profiles(id) on delete cascade,
        add column if not exists helper_id uuid references public.profiles(id) on delete set null,
        add column if not exists status text not null default 'published',
        add column if not exists district text,
        add column if not exists distance numeric default 0;

    alter table public.tasks enable row level security;

    do $$
    begin
        if not exists (
            select 1 from pg_constraint
            where conname = 'tasks_status_check'
            and conrelid = 'public.tasks'::regclass
        ) then
            alter table public.tasks
                add constraint tasks_status_check
                check (status in ('published', 'assigned', 'on_the_way', 'arrived', 'started', 'completed', 'cancelled'));
        end if;
    end $$;

    create or replace function public.is_current_profile(profile_id uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
as $$
    select profile_id = auth.uid()
        or exists (
            select 1
            from public.profiles p
                where p.id = profile_id
                and lower(p.email) = lower(auth.jwt() ->> 'email')
        );
$$;

grant execute on function public.is_current_profile(uuid) to authenticated;

    drop policy if exists "tasks_select_visible" on public.tasks;
    create policy "tasks_select_visible"
    on public.tasks for select
    to authenticated
    using (
        status = 'published'
        or public.is_current_profile(poster_id)
        or public.is_current_profile(helper_id)
    );

    drop policy if exists "tasks_insert_own" on public.tasks;
    create policy "tasks_insert_own"
    on public.tasks for insert
    to authenticated
    with check (
        public.is_current_profile(poster_id)
    );

    drop policy if exists "tasks_update_owner_or_helper" on public.tasks;
    create policy "tasks_update_owner_or_helper"
    on public.tasks for update
    to authenticated
    using (
        public.is_current_profile(poster_id)
        or public.is_current_profile(helper_id)
    )
    with check (
        public.is_current_profile(poster_id)
        or public.is_current_profile(helper_id)
    );

    -- No DELETE policy is required. Employer task removal is a soft delete:
    -- update public.tasks set status = 'cancelled' where id = '<task-id>';
