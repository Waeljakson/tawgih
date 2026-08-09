insert into public.premium_products (
  product_code,name_ar,monthly_price_sar,yearly_price_sar,is_bundle,is_active,sort_order
) values (
  'achievement_reports','منصة تقارير الإنجاز',10,50,false,true,40
)
on conflict (product_code) do update
set name_ar=excluded.name_ar,
    monthly_price_sar=excluded.monthly_price_sar,
    yearly_price_sar=excluded.yearly_price_sar,
    is_bundle=false,
    is_active=true,
    sort_order=40,
    updated_at=now();

update public.premium_products
set is_active=false,
    updated_at=now()
where product_code='program_ideas';
