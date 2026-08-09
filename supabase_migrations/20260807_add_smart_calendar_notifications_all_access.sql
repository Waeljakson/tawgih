create or replace function public.premium_has_all_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    auth.uid() is not null
    and p_user_id = auth.uid()
    and exists (select 1 from public.premium_accounts a where a.user_id=p_user_id and a.is_active=true)
    and (
      public.premium_is_system_admin(auth.uid())
      or exists (select 1 from public.premium_entitlements e where e.user_id=p_user_id and e.product_code='all_access' and e.is_active=true and e.expires_at>now())
      or exists (select 1 from public.premium_promo_redemptions r where r.user_id=p_user_id and r.product_code='all_access' and r.access_ends_at>now())
    ), false
  );
$function$;

grant execute on function public.premium_has_all_access(uuid) to authenticated;

create table if not exists public.premium_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.premium_accounts(user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  details text,
  event_date date not null,
  event_time time without time zone,
  category text not null default 'custom' check (category in ('custom','meeting','program','occasion','deadline','followup')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists premium_calendar_events_user_date_idx on public.premium_calendar_events(user_id,event_date);
alter table public.premium_calendar_events enable row level security;
drop policy if exists premium_calendar_events_select_policy on public.premium_calendar_events;
create policy premium_calendar_events_select_policy on public.premium_calendar_events for select to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_calendar_events_insert_policy on public.premium_calendar_events;
create policy premium_calendar_events_insert_policy on public.premium_calendar_events for insert to authenticated with check (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_calendar_events_update_policy on public.premium_calendar_events;
create policy premium_calendar_events_update_policy on public.premium_calendar_events for update to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid())) with check (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_calendar_events_delete_policy on public.premium_calendar_events;
create policy premium_calendar_events_delete_policy on public.premium_calendar_events for delete to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
grant select,insert,update,delete on public.premium_calendar_events to authenticated;

create table if not exists public.premium_reminder_states (
  user_id uuid not null references public.premium_accounts(user_id) on delete cascade,
  reminder_key text not null,
  read_at timestamptz,
  snoozed_until timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,reminder_key)
);
alter table public.premium_reminder_states enable row level security;
drop policy if exists premium_reminder_states_select_policy on public.premium_reminder_states;
create policy premium_reminder_states_select_policy on public.premium_reminder_states for select to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_reminder_states_insert_policy on public.premium_reminder_states;
create policy premium_reminder_states_insert_policy on public.premium_reminder_states for insert to authenticated with check (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_reminder_states_update_policy on public.premium_reminder_states;
create policy premium_reminder_states_update_policy on public.premium_reminder_states for update to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid())) with check (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
drop policy if exists premium_reminder_states_delete_policy on public.premium_reminder_states;
create policy premium_reminder_states_delete_policy on public.premium_reminder_states for delete to authenticated using (user_id=auth.uid() and public.premium_has_all_access(auth.uid()));
grant select,insert,update,delete on public.premium_reminder_states to authenticated;
