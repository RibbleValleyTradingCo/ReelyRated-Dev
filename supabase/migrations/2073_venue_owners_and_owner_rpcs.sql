set check_function_bodies = off;

-- Create venue_owners table
create table if not exists public.venue_owners (
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);

create index if not exists idx_venue_owners_user_id on public.venue_owners (user_id);
create index if not exists idx_venue_owners_venue_id on public.venue_owners (venue_id);

alter table public.venue_owners enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'venue_owners' and policyname = 'venue_owners_admin_all'
  ) then
    create policy venue_owners_admin_all on public.venue_owners
      for all
      using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
      with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'venue_owners' and policyname = 'venue_owners_self_select'
  ) then
    create policy venue_owners_self_select on public.venue_owners
      for select
      using (auth.uid() = user_id);
  end if;
end;
$$;

grant select on public.venue_owners to authenticated;
-- Insert/delete are managed exclusively via admin SECURITY DEFINER functions.

-- Admin RPCs to manage owners
create or replace function public.admin_add_venue_owner(
  p_venue_id uuid,
  p_user_id uuid,
  p_role text default 'owner'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin uuid := auth.uid();
  v_is_admin boolean;
begin
  if v_admin is null then
    raise exception 'Not authenticated';
  end if;

  select exists (select 1 from public.admin_users au where au.user_id = v_admin) into v_is_admin;
  if not v_is_admin then
    raise exception 'Admin privileges required';
  end if;

  insert into public.venue_owners (venue_id, user_id, role)
  values (p_venue_id, p_user_id, coalesce(p_role, 'owner'))
  on conflict (venue_id, user_id) do nothing;
end;
$$;

grant execute on function public.admin_add_venue_owner(uuid, uuid, text) to authenticated;

create or replace function public.admin_remove_venue_owner(
  p_venue_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin uuid := auth.uid();
  v_is_admin boolean;
begin
  if v_admin is null then
    raise exception 'Not authenticated';
  end if;

  select exists (select 1 from public.admin_users au where au.user_id = v_admin) into v_is_admin;
  if not v_is_admin then
    raise exception 'Admin privileges required';
  end if;

  delete from public.venue_owners
  where venue_id = p_venue_id
    and user_id = p_user_id;
end;
$$;

grant execute on function public.admin_remove_venue_owner(uuid, uuid) to authenticated;

-- Helper to check admin or owner
create or replace function public.is_venue_admin_or_owner(p_venue_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return false;
  end if;

  if exists (select 1 from public.admin_users au where au.user_id = v_actor) then
    return true;
  end if;

  return exists (
    select 1 from public.venue_owners vo
    where vo.venue_id = p_venue_id
      and vo.user_id = v_actor
  );
end;
$$;

grant execute on function public.is_venue_admin_or_owner(uuid) to authenticated;

-- Owner-aware metadata update
create or replace function public.owner_update_venue_metadata(
  p_venue_id uuid,
  p_tagline text,
  p_description text,
  p_ticket_type text,
  p_best_for_tags text[],
  p_facilities text[],
  p_price_from text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text
)
returns public.venues
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
  v_row public.venues;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to update this venue';
  end if;

  update public.venues
  set
    short_tagline = p_tagline,
    description = p_description,
    ticket_type = p_ticket_type,
    best_for_tags = p_best_for_tags,
    facilities = p_facilities,
    price_from = p_price_from,
    website_url = p_website_url,
    booking_url = p_booking_url,
    contact_phone = p_contact_phone,
    updated_at = now()
  where id = p_venue_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.owner_update_venue_metadata(
  uuid, text, text, text, text[], text[], text, text, text, text
) to authenticated;

-- Owner-aware events RPCs
create or replace function public.owner_get_venue_events(p_venue_id uuid)
returns setof public.venue_events
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  return query
  select ve.*
  from public.venue_events ve
  where ve.venue_id = p_venue_id;
end;
$$;

grant execute on function public.owner_get_venue_events(uuid) to authenticated;

create or replace function public.owner_create_venue_event(
  p_venue_id uuid,
  p_title text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_description text,
  p_ticket_info text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_is_published boolean default false
)
returns public.venue_events
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
  v_row public.venue_events;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  insert into public.venue_events (
    venue_id,
    title,
    event_type,
    starts_at,
    ends_at,
    description,
    ticket_info,
    website_url,
    booking_url,
    contact_phone,
    is_published,
    created_at,
    updated_at
  )
  values (
    p_venue_id,
    p_title,
    p_event_type,
    p_starts_at,
    p_ends_at,
    p_description,
    p_ticket_info,
    p_website_url,
    p_booking_url,
    p_contact_phone,
    coalesce(p_is_published, false),
    now(),
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.owner_create_venue_event(
  uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, boolean
) to authenticated;

create or replace function public.owner_update_venue_event(
  p_event_id uuid,
  p_title text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_description text,
  p_ticket_info text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_is_published boolean default false
)
returns public.venue_events
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
  v_row public.venue_events;
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.venue_events where id = p_event_id;
  if v_venue_id is null then
    raise exception 'Event not found';
  end if;

  v_allowed := public.is_venue_admin_or_owner(v_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  update public.venue_events
  set
    title = p_title,
    event_type = p_event_type,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    description = p_description,
    ticket_info = p_ticket_info,
    website_url = p_website_url,
    booking_url = p_booking_url,
    contact_phone = p_contact_phone,
    is_published = coalesce(p_is_published, false),
    updated_at = now()
  where id = p_event_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.owner_update_venue_event(
  uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, boolean
) to authenticated;

create or replace function public.owner_delete_venue_event(
  p_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.venue_events where id = p_event_id;
  if v_venue_id is null then
    raise exception 'Event not found';
  end if;

  v_allowed := public.is_venue_admin_or_owner(v_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to manage events for this venue';
  end if;

  delete from public.venue_events where id = p_event_id;
end;
$$;

grant execute on function public.owner_delete_venue_event(uuid) to authenticated;
