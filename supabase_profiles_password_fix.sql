-- Fixes the root cause of "task_bids_helper_id_fkey" / "tasks_poster_id_fkey"
-- violations: registration silently fails to create a profiles row because
-- profiles.password is NOT NULL and register.js never writes to it (auth is
-- handled by Supabase Auth, not this legacy column). The user still gets a
-- valid Supabase Auth session, so the app treats them as logged in, but
-- there is no matching profiles row -- so any insert that references
-- profiles(id) (task_bids.helper_id, tasks.poster_id, ...) fails with a
-- foreign key violation.
-- Run this in the Supabase SQL Editor.

-- 1) Stop requiring a value the app never sends.
alter table public.profiles
    alter column password drop not null;

-- 2) Backfill profiles for any auth.users that already got stuck without one
--    (this repairs already-broken accounts, e.g. the helper hitting the FK
--    error today) using the metadata register.js/kirish.js wrote at signup.
insert into public.profiles (id, email, role, first_name, last_name, full_name, phone, district, preferred_language)
select
    u.id,
    u.email,
    case u.raw_user_meta_data ->> 'role'
        when 'employer' then 'poster'
        when 'poster' then 'poster'
        else 'helper'
    end,
    u.raw_user_meta_data ->> 'first_name',
    u.raw_user_meta_data ->> 'last_name',
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'phone',
    u.raw_user_meta_data ->> 'district',
    coalesce(u.raw_user_meta_data ->> 'preferred_language', 'uz')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
