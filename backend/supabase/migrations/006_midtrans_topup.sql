-- Apply after 005 in Supabase SQL Editor. Midtrans Snap (sandbox) top up orders.
begin;

create table public.topup_orders (
  order_id text primary key check (char_length(order_id) between 1 and 50),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount in (50,100,250,500)),
  gross_amount integer not null check (gross_amount = amount * 1000),
  status text not null default 'pending'
    check (status in ('pending','settlement','deny','cancel','expire','failure')),
  payment_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topup_orders_user_idx on public.topup_orders(user_id, created_at desc);
create trigger topup_orders_updated before update on public.topup_orders
  for each row execute function public.touch_updated_at();

alter table public.topup_orders enable row level security;
revoke all on public.topup_orders from anon,authenticated;
grant all on public.topup_orders to service_role;

-- Records a status reported by Midtrans. Points are credited exactly once, on the first
-- 'settlement', whether it arrives through the webhook or the status check.
create function public.settle_topup_order(p_order_id text, p_status text, p_payment_type text default null)
returns public.topup_orders language plpgsql security definer set search_path = '' as $$
declare o public.topup_orders;
begin
  if p_status not in ('pending','settlement','deny','cancel','expire','failure') then
    raise exception 'Status Midtrans tidak valid.';
  end if;
  select * into o from public.topup_orders where order_id = p_order_id for update;
  if not found then raise exception 'Order top up tidak ditemukan.'; end if;
  if o.status = 'settlement' then return o; end if;
  if p_status = 'settlement' then
    perform public.apply_points(o.user_id,'TOP_UP',o.amount,'Top up '||o.amount||' Poin HiLaw (Midtrans)',
      'midtrans-'||o.order_id,null,coalesce(p_payment_type,'Midtrans'));
  end if;
  update public.topup_orders set status = p_status, payment_type = coalesce(p_payment_type,payment_type)
  where order_id = p_order_id returning * into o;
  return o;
end;
$$;

revoke all on function public.settle_topup_order(text,text,text) from public,anon,authenticated;
grant execute on function public.settle_topup_order(text,text,text) to service_role;

commit;
