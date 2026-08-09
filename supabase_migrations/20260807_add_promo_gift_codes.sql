-- V17: Gift promo codes for 1-10 day access to a specific platform or all-access.

insert into public.premium_products (
  product_code,name_ar,monthly_price_sar,yearly_price_sar,is_bundle,is_active,sort_order,updated_at
) values (
  'messages_library','مكتبة رسائل أولياء الأمور',0,0,false,false,45,now()
)
on conflict (product_code) do update
set name_ar=excluded.name_ar,
    monthly_price_sar=0,
    yearly_price_sar=0,
    is_bundle=false,
    is_active=false,
    sort_order=45,
    updated_at=now();

create table if not exists public.premium_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  product_code text not null references public.premium_products(product_code),
  duration_days integer not null check (duration_days between 1 and 10),
  max_redemptions integer not null default 1 check (max_redemptions between 1 and 100),
  redeemed_count integer not null default 0 check (redeemed_count >= 0 and redeemed_count <= max_redemptions),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null references public.premium_accounts(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > created_at)
);

create table if not exists public.premium_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.premium_promo_codes(id) on delete restrict,
  user_id uuid not null references public.premium_accounts(user_id) on delete cascade,
  product_code text not null references public.premium_products(product_code),
  duration_days integer not null check (duration_days between 1 and 10),
  access_started_at timestamptz not null default now(),
  access_ends_at timestamptz not null,
  entitlement_expires_at timestamptz,
  redeemed_at timestamptz not null default now(),
  unique (promo_code_id,user_id),
  check (access_ends_at > access_started_at)
);

create index if not exists premium_promo_codes_status_idx
  on public.premium_promo_codes (is_active,expires_at,created_at desc);
create index if not exists premium_promo_redemptions_user_active_idx
  on public.premium_promo_redemptions (user_id,access_ends_at desc);

alter table public.premium_promo_codes enable row level security;
alter table public.premium_promo_redemptions enable row level security;

drop policy if exists premium_promo_codes_admin_select on public.premium_promo_codes;
create policy premium_promo_codes_admin_select
on public.premium_promo_codes for select
to authenticated
using (public.premium_is_system_admin(auth.uid()));

drop policy if exists premium_promo_redemptions_select on public.premium_promo_redemptions;
create policy premium_promo_redemptions_select
on public.premium_promo_redemptions for select
to authenticated
using (user_id=auth.uid() or public.premium_is_system_admin(auth.uid()));

grant select on public.premium_promo_codes to authenticated;
grant select on public.premium_promo_redemptions to authenticated;

create or replace function public.premium_admin_create_promo_code(
  p_code text default null,
  p_product_code text default 'all_access',
  p_duration_days integer default 1,
  p_max_redemptions integer default 1,
  p_expires_at timestamptz default null
)
returns public.premium_promo_codes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  result_row public.premium_promo_codes;
  v_code text;
  v_attempt integer := 0;
begin
  if not public.premium_is_system_admin(auth.uid()) then
    raise exception using message='forbidden';
  end if;
  if p_duration_days not between 1 and 10 then
    raise exception using message='promo_duration_must_be_1_to_10_days';
  end if;
  if p_max_redemptions not between 1 and 100 then
    raise exception using message='promo_max_redemptions_must_be_1_to_100';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception using message='promo_expiry_must_be_in_future';
  end if;
  if not exists (
    select 1 from public.premium_products p
    where p.product_code=p_product_code
      and (p.is_active=true or p.product_code='messages_library')
  ) then
    raise exception using message='invalid_promo_product';
  end if;

  if nullif(btrim(coalesce(p_code,'')),'') is null then
    loop
      v_attempt := v_attempt + 1;
      v_code := 'GIFT-' || upper(substr(md5(gen_random_uuid()::text),1,8));
      exit when not exists(select 1 from public.premium_promo_codes where code=v_code);
      if v_attempt > 20 then
        raise exception using message='promo_code_generation_failed';
      end if;
    end loop;
  else
    v_code := upper(regexp_replace(btrim(p_code),'\s+','','g'));
    if v_code !~ '^[A-Z0-9][A-Z0-9_-]{3,31}$' then
      raise exception using message='invalid_promo_code_format';
    end if;
  end if;

  insert into public.premium_promo_codes (
    code,product_code,duration_days,max_redemptions,expires_at,created_by
  ) values (
    v_code,p_product_code,p_duration_days,p_max_redemptions,p_expires_at,auth.uid()
  ) returning * into result_row;

  return result_row;
exception
  when unique_violation then
    raise exception using message='promo_code_already_exists';
end;
$function$;

create or replace function public.premium_admin_set_promo_code_active(
  p_promo_id uuid,
  p_is_active boolean
)
returns public.premium_promo_codes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare result_row public.premium_promo_codes;
begin
  if not public.premium_is_system_admin(auth.uid()) then
    raise exception using message='forbidden';
  end if;
  update public.premium_promo_codes
  set is_active=p_is_active,updated_at=now()
  where id=p_promo_id
  returning * into result_row;
  if result_row.id is null then
    raise exception using message='promo_code_not_found';
  end if;
  return result_row;
end;
$function$;

create or replace function public.premium_redeem_promo_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  promo public.premium_promo_codes;
  target_row public.premium_entitlements;
  bundle_row public.premium_entitlements;
  v_code text;
  v_duration interval;
  v_access_start timestamptz := now();
  v_access_end timestamptz;
  v_entitlement_expiry timestamptz;
  v_base_expiry timestamptz;
  v_existing_period text := 'monthly';
begin
  if auth.uid() is null then
    raise exception using message='not_authenticated';
  end if;
  if not exists(select 1 from public.premium_accounts a where a.user_id=auth.uid() and a.is_active=true) then
    raise exception using message='account_not_active';
  end if;

  v_code := upper(regexp_replace(btrim(coalesce(p_code,'')),'\s+','','g'));
  if v_code='' then raise exception using message='promo_code_required'; end if;

  select * into promo
  from public.premium_promo_codes
  where code=v_code
  for update;

  if not found then raise exception using message='promo_code_not_found'; end if;
  if promo.is_active=false then raise exception using message='promo_code_inactive'; end if;
  if promo.expires_at is not null and promo.expires_at<=now() then raise exception using message='promo_code_expired'; end if;
  if promo.redeemed_count>=promo.max_redemptions then raise exception using message='promo_code_fully_redeemed'; end if;
  if exists(select 1 from public.premium_promo_redemptions r where r.promo_code_id=promo.id and r.user_id=auth.uid()) then
    raise exception using message='promo_code_already_redeemed';
  end if;

  v_duration := make_interval(days=>promo.duration_days);
  v_access_end := v_access_start + v_duration;

  if promo.product_code='all_access' then
    select * into target_row
    from public.premium_entitlements
    where user_id=auth.uid() and product_code='all_access'
    for update;

    if found and target_row.is_active=true and target_row.expires_at>now() then
      v_base_expiry := target_row.expires_at;
      v_existing_period := target_row.billing_period;
    else
      v_base_expiry := now();
      v_existing_period := 'monthly';
    end if;
    v_entitlement_expiry := v_base_expiry + v_duration;

    -- Preserve time in active individual packages while the all-access gift runs.
    update public.premium_entitlements
    set expires_at=expires_at+v_duration,updated_at=now()
    where user_id=auth.uid()
      and product_code<>'all_access'
      and is_active=true
      and expires_at>now();

    insert into public.premium_entitlements (
      user_id,product_code,billing_period,started_at,expires_at,source_request_id,is_active
    ) values (
      auth.uid(),'all_access',v_existing_period,now(),v_entitlement_expiry,null,true
    )
    on conflict (user_id,product_code) do update
    set billing_period=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.billing_period else 'monthly' end,
        started_at=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.started_at else now() end,
        expires_at=v_entitlement_expiry,
        source_request_id=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.source_request_id else null end,
        is_active=true,
        updated_at=now();

  elsif promo.product_code='messages_library' then
    -- Messages are normally annual-only; this gift grants a temporary exception.
    v_entitlement_expiry := null;

  else
    select * into target_row
    from public.premium_entitlements
    where user_id=auth.uid() and product_code=promo.product_code
    for update;

    if found and target_row.is_active=true and target_row.expires_at>now() then
      v_base_expiry := target_row.expires_at;
      v_existing_period := target_row.billing_period;
    else
      v_base_expiry := now();
      v_existing_period := 'monthly';
    end if;

    select * into bundle_row
    from public.premium_entitlements
    where user_id=auth.uid() and product_code='all_access'
      and is_active=true and expires_at>now()
    for update;
    if found and bundle_row.expires_at>v_base_expiry then
      v_base_expiry := bundle_row.expires_at;
    end if;

    v_entitlement_expiry := v_base_expiry + v_duration;

    insert into public.premium_entitlements (
      user_id,product_code,billing_period,started_at,expires_at,source_request_id,is_active
    ) values (
      auth.uid(),promo.product_code,v_existing_period,now(),v_entitlement_expiry,null,true
    )
    on conflict (user_id,product_code) do update
    set billing_period=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.billing_period else 'monthly' end,
        started_at=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.started_at else now() end,
        expires_at=v_entitlement_expiry,
        source_request_id=case
          when public.premium_entitlements.is_active=true and public.premium_entitlements.expires_at>now()
          then public.premium_entitlements.source_request_id else null end,
        is_active=true,
        updated_at=now();
  end if;

  insert into public.premium_promo_redemptions (
    promo_code_id,user_id,product_code,duration_days,
    access_started_at,access_ends_at,entitlement_expires_at
  ) values (
    promo.id,auth.uid(),promo.product_code,promo.duration_days,
    v_access_start,v_access_end,v_entitlement_expiry
  );

  update public.premium_promo_codes
  set redeemed_count=redeemed_count+1,updated_at=now()
  where id=promo.id;

  update public.premium_accounts
  set plan='premium',
      premium_started_at=coalesce(premium_started_at,now()),
      premium_expires_at=greatest(
        coalesce(premium_expires_at,'epoch'::timestamptz),
        v_access_end,
        coalesce(v_entitlement_expiry,'epoch'::timestamptz)
      ),
      updated_at=now()
  where user_id=auth.uid();

  return jsonb_build_object(
    'code',promo.code,
    'product_code',promo.product_code,
    'duration_days',promo.duration_days,
    'access_started_at',v_access_start,
    'access_ends_at',v_access_end,
    'entitlement_expires_at',v_entitlement_expiry
  );
end;
$function$;

create or replace function public.premium_has_package_access(
  p_product_code text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(
    exists (
      select 1 from public.premium_accounts a
      where a.user_id=p_user_id and a.is_active=true and a.is_system_admin=true
    )
    or exists (
      select 1 from public.premium_entitlements e
      where e.user_id=p_user_id and e.is_active=true and e.expires_at>now()
        and e.product_code in (p_product_code,'all_access')
    )
    or exists (
      select 1 from public.premium_promo_redemptions r
      where r.user_id=p_user_id and r.access_started_at<=now() and r.access_ends_at>now()
        and r.product_code in (p_product_code,'all_access')
    ),false
  );
$function$;

create or replace function public.premium_has_annual_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(
    auth.uid() is not null
    and (
      public.premium_is_system_admin(auth.uid())
      or (
        p_user_id=auth.uid()
        and exists(select 1 from public.premium_accounts a where a.user_id=p_user_id and a.is_active=true)
        and (
          exists (
            select 1 from public.premium_entitlements e
            where e.user_id=p_user_id and e.is_active=true
              and e.billing_period='yearly' and e.expires_at>now()
          )
          or exists (
            select 1 from public.premium_promo_redemptions r
            where r.user_id=p_user_id
              and r.access_started_at<=now() and r.access_ends_at>now()
              and r.product_code in ('all_access','messages_library')
          )
        )
      )
    ),false
  );
$function$;

grant execute on function public.premium_admin_create_promo_code(text,text,integer,integer,timestamptz) to authenticated;
grant execute on function public.premium_admin_set_promo_code_active(uuid,boolean) to authenticated;
grant execute on function public.premium_redeem_promo_code(text) to authenticated;
grant execute on function public.premium_has_package_access(text,uuid) to authenticated;
grant execute on function public.premium_has_annual_access(uuid) to authenticated;
