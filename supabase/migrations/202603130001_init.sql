create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couple_spaces (
  id uuid primary key default gen_random_uuid(),
  couple_name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  unique (space_id, user_id)
);

create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  invite_code text not null unique,
  expires_at timestamptz not null,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (status in ('planned', 'in_progress', 'done')),
  due_date date,
  activity_type text,
  assignee text not null default 'Both',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  activity_date date not null,
  activity_type text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  entry_date date not null,
  tags text[] not null default '{}',
  image_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_spaces_updated_at on public.couple_spaces;
create trigger touch_spaces_updated_at
before update on public.couple_spaces
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_tasks_updated_at on public.tasks;
create trigger touch_tasks_updated_at
before update on public.tasks
for each row
execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.couple_spaces enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.memories enable row level security;

create policy "profiles are self readable"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are self writable"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles are self updatable"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "space members can read spaces"
on public.couple_spaces
for select
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = couple_spaces.id and cm.user_id = auth.uid()
  )
);

create policy "users can create spaces"
on public.couple_spaces
for insert
with check (auth.uid() = created_by);

create policy "space members can read members"
on public.couple_members
for select
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = couple_members.space_id and cm.user_id = auth.uid()
  )
);

create policy "users can add themselves"
on public.couple_members
for insert
with check (auth.uid() = user_id);

create policy "space members can read invites"
on public.couple_invites
for select
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = couple_invites.space_id and cm.user_id = auth.uid()
  )
);

create policy "space creators can create invites"
on public.couple_invites
for insert
with check (
  exists (
    select 1 from public.couple_spaces cs
    where cs.id = couple_invites.space_id and cs.created_by = auth.uid()
  )
);

create policy "space creators can update invites"
on public.couple_invites
for update
using (
  exists (
    select 1 from public.couple_spaces cs
    where cs.id = couple_invites.space_id and cs.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_spaces cs
    where cs.id = couple_invites.space_id and cs.created_by = auth.uid()
  )
);

create policy "space members can manage tasks"
on public.tasks
for all
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = tasks.space_id and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = tasks.space_id and cm.user_id = auth.uid()
  )
);

create policy "space members can manage activities"
on public.activities
for all
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = activities.space_id and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = activities.space_id and cm.user_id = auth.uid()
  )
);

create policy "space members can manage memories"
on public.memories
for all
using (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = memories.space_id and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.space_id = memories.space_id and cm.user_id = auth.uid()
  )
);
