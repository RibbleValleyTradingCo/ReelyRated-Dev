-- Create venue_ratings table for per-venue star ratings
create table if not exists public.venue_ratings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id),
  user_id uuid not null references public.profiles(id),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (venue_id, user_id)
);

create index if not exists venue_ratings_venue_id_idx on public.venue_ratings (venue_id);
create index if not exists venue_ratings_user_venue_idx on public.venue_ratings (user_id, venue_id);

alter table public.venue_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'venue_ratings' and policyname = 'Allow users to select own venue ratings'
  ) then
    create policy "Allow users to select own venue ratings"
      on public.venue_ratings
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'venue_ratings' and policyname = 'Allow users to insert own venue ratings'
  ) then
    create policy "Allow users to insert own venue ratings"
      on public.venue_ratings
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'venue_ratings' and policyname = 'Allow users to update own venue ratings'
  ) then
    create policy "Allow users to update own venue ratings"
      on public.venue_ratings
      for update
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'venue_ratings' and policyname = 'Allow users to delete own venue ratings'
  ) then
    create policy "Allow users to delete own venue ratings"
      on public.venue_ratings
      for delete
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'venue_ratings' and policyname = 'Admins can select all venue ratings'
  ) then
    create policy "Admins can select all venue ratings"
      on public.venue_ratings
      for select
      using (public.is_admin(auth.uid()));
  end if;
end$$;

grant select, insert, update, delete on public.venue_ratings to authenticated;

-- Upsert RPC for venue ratings
create or replace function public.upsert_venue_rating(p_venue_id uuid, p_rating int)
returns table (
  venue_id uuid,
  avg_rating numeric,
  rating_count int,
  user_rating int
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING: rating must be between 1 and 5';
  end if;

  insert into public.venue_ratings (venue_id, user_id, rating)
  values (p_venue_id, v_user_id, p_rating)
  on conflict (venue_id, user_id)
  do update set rating = excluded.rating, updated_at = now();

  return query
  select
    p_venue_id as venue_id,
    avg(r.rating)::numeric(3,2) as avg_rating,
    count(*)::int as rating_count,
    max(case when r.user_id = v_user_id then r.rating end)::int as user_rating
  from public.venue_ratings r
  where r.venue_id = p_venue_id;
end;
$$;

grant execute on function public.upsert_venue_rating(uuid, int) to authenticated;

-- Fetch current user's rating for a venue
create or replace function public.get_my_venue_rating(p_venue_id uuid)
returns table (
  venue_id uuid,
  user_rating int
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select r.venue_id, r.rating::int as user_rating
  from public.venue_ratings r
  where r.venue_id = p_venue_id
    and r.user_id = auth.uid();
end;
$$;

grant execute on function public.get_my_venue_rating(uuid) to authenticated;
