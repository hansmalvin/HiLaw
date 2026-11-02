-- Optional regression check in Supabase SQL Editor AFTER migrations 001-005.
-- Uses fictional users and rolls back all fixtures.
begin;
do $$
declare
  customer_user uuid := gen_random_uuid();
  lawyer_user uuid := gen_random_uuid();
  lawyer_id uuid;
  c public.consultations;
  blocked boolean;
begin
  if public.package_price(5,15) <> 3 or public.package_price(35,15) <> 21 or public.package_price(35,30) <> 35
     or public.package_price(35,60) <> 63 or public.package_price(1,15) <> 1 then
    raise exception 'FAIL: package prices';
  end if;

  insert into auth.users(id,email,raw_user_meta_data) values
    (customer_user,customer_user::text || '@example.com','{"full_name":"Package Customer","role":"customer"}'::jsonb),
    (lawyer_user,lawyer_user::text || '@example.com','{"full_name":"Package Lawyer","role":"lawyer"}'::jsonb);
  update public.lawyer_profiles set verification_status = 'approved', rate_points = 35 where user_id = lawyer_user
    returning id into lawyer_id;
  perform public.topup_points(customer_user,100,'QRIS','topup-1');

  blocked := false;
  begin perform public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','bad',45);
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: 45-minute package accepted'; end if;

  -- The 60-minute package charges 63 Poin and records its duration.
  select * into c from public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','book-60',60);
  if c.rate <> 63 or c.duration_minutes <> 60 or (select balance from public.wallets where user_id = customer_user) <> 37 then
    raise exception 'FAIL: 60-minute booking';
  end if;
  perform public.transition_consultation(lawyer_user,c.id,'Confirmed');
  perform public.transition_consultation(lawyer_user,c.id,'Ongoing');

  -- Not expired yet: nothing changes.
  if public.expire_due_consultations(c.id) <> 0 then raise exception 'FAIL: expired too early'; end if;

  -- Time is up: the session completes once and the lawyer gets 63 - floor(63 / 5) = 51.
  update public.consultations set started_at = now() - interval '61 minutes' where id = c.id;
  if public.expire_due_consultations(null) < 1 then raise exception 'FAIL: due session not expired'; end if;
  if public.expire_due_consultations(c.id) <> 0 then raise exception 'FAIL: expired twice'; end if;
  select * into c from public.consultations where id = c.id;
  if c.status <> 'Completed' or c.ended_at <> c.started_at + interval '60 minutes'
     or (select balance from public.wallets where user_id = lawyer_user) <> 51 then
    raise exception 'FAIL: expiry completion or earning';
  end if;

  -- Stars are required, text is optional.
  insert into public.reviews(consultation_id,lawyer_id,customer_id,rating,body) values (c.id,lawyer_id,customer_user,5,null);
  blocked := false;
  begin
    insert into public.reviews(consultation_id,lawyer_id,customer_id,rating,body) values (c.id,lawyer_id,customer_user,6,null);
  exception when check_violation or unique_violation then blocked := true; end;
  if not blocked then raise exception 'FAIL: invalid second review accepted'; end if;

  raise notice 'PASS: package prices, 60-minute booking, automatic expiry, earning once, optional review text';
end;
$$;
rollback;
