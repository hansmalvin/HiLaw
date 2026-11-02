-- Optional regression check in Supabase SQL Editor AFTER migrations 001-006.
-- Uses a fictional user and rolls back all fixtures.
begin;
do $$
declare
  customer_user uuid := gen_random_uuid();
  blocked boolean := false;
begin
  insert into auth.users(id,email,raw_user_meta_data) values
    (customer_user,customer_user::text || '@example.com','{"full_name":"Midtrans Customer","role":"customer"}'::jsonb);
  insert into public.topup_orders(order_id,user_id,amount,gross_amount) values
    ('TEST-PAID',customer_user,100,100000),('TEST-EXPIRED',customer_user,50,50000);

  -- Pending changes nothing; settlement credits once even if reported again.
  perform public.settle_topup_order('TEST-PAID','pending','qris');
  if (select balance from public.wallets where user_id = customer_user) <> 0 then raise exception 'FAIL: pending credited'; end if;
  perform public.settle_topup_order('TEST-PAID','settlement','qris');
  perform public.settle_topup_order('TEST-PAID','settlement','qris');
  perform public.settle_topup_order('TEST-PAID','expire','qris');
  if (select balance from public.wallets where user_id = customer_user) <> 100
     or (select status from public.topup_orders where order_id = 'TEST-PAID') <> 'settlement' then
    raise exception 'FAIL: settlement not credited exactly once';
  end if;

  perform public.settle_topup_order('TEST-EXPIRED','expire',null);
  if (select balance from public.wallets where user_id = customer_user) <> 100 then raise exception 'FAIL: expired order credited'; end if;

  begin
    insert into public.topup_orders(order_id,user_id,amount,gross_amount) values ('TEST-BAD',customer_user,100,1);
  exception when check_violation then blocked := true; end;
  if not blocked then raise exception 'FAIL: gross amount mismatch accepted'; end if;

  raise notice 'PASS: pending, single settlement credit, expiry, amount guard';
end;
$$;
rollback;
