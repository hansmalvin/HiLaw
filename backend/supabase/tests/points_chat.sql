-- Optional regression check in Supabase SQL Editor AFTER migrations 001-004.
-- Uses fictional users and rolls back all fixtures.
begin;
do $$
declare
  customer_user uuid := gen_random_uuid();
  other_customer uuid := gen_random_uuid();
  lawyer_user uuid := gen_random_uuid();
  admin_user uuid := gen_random_uuid();
  lawyer_id uuid;
  c public.consultations;
  retry public.consultations;
  blocked boolean;
begin
  insert into auth.users(id,email,raw_user_meta_data) values
    (customer_user,customer_user::text || '@example.com','{"full_name":"Regression Customer","role":"customer"}'::jsonb),
    (other_customer,other_customer::text || '@example.com','{"full_name":"Other Customer","role":"customer"}'::jsonb),
    (lawyer_user,lawyer_user::text || '@example.com','{"full_name":"Regression Lawyer","role":"lawyer"}'::jsonb),
    (admin_user,admin_user::text || '@example.com','{"full_name":"Regression Admin","role":"customer"}'::jsonb);
  update public.profiles set role = 'admin' where id = admin_user;
  update public.lawyer_profiles set verification_status = 'approved', rate_points = 35 where user_id = lawyer_user
    returning id into lawyer_id;

  if (select count(*) from public.wallets where user_id in (customer_user,lawyer_user,admin_user)) <> 3 then
    raise exception 'FAIL: wallets not created for new profiles';
  end if;

  -- Booking with zero balance is rejected without a ledger entry.
  blocked := false;
  begin perform public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','book-0');
  exception when raise_exception then blocked := true; end;
  if not blocked or exists(select 1 from public.point_transactions where user_id = customer_user) then
    raise exception 'FAIL: booking without balance';
  end if;

  -- Top up is idempotent per request_id and restricted to customers.
  perform public.topup_points(customer_user,50,'QRIS','topup-1');
  perform public.topup_points(customer_user,50,'QRIS','topup-1');
  if (select balance from public.wallets where user_id = customer_user) <> 50 then raise exception 'FAIL: top up not idempotent'; end if;
  blocked := false;
  begin perform public.topup_points(lawyer_user,50,'QRIS','topup-lawyer');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: lawyer top up accepted'; end if;
  blocked := false;
  begin perform public.topup_points(customer_user,49,'QRIS','topup-bad');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: invalid package accepted'; end if;

  -- Booking debits the lawyer's server-side rate once, also when retried.
  select * into c from public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','book-1');
  select * into retry from public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','book-1');
  if retry.id <> c.id or c.status <> 'Pending' or c.rate <> 35 then raise exception 'FAIL: booking retry or rate'; end if;
  if (select balance from public.wallets where user_id = customer_user) <> 15 then raise exception 'FAIL: booking debit'; end if;

  -- A second live consultation with the same lawyer is blocked.
  perform public.topup_points(customer_user,100,'GoPay','topup-2');
  blocked := false;
  begin perform public.book_consultation(customer_user,lawyer_id,'Kronologi singkat kasus saya.','book-2');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: duplicate active consultation'; end if;

  -- Customers cannot act as the lawyer; outsiders cannot touch the consultation.
  blocked := false;
  begin perform public.transition_consultation(customer_user,c.id,'Confirmed');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: customer confirmed own request'; end if;
  blocked := false;
  begin perform public.transition_consultation(other_customer,c.id,'Cancelled');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: outsider cancelled'; end if;

  -- Rejection refunds exactly once.
  perform public.transition_consultation(lawyer_user,c.id,'Cancelled');
  blocked := false;
  begin perform public.transition_consultation(admin_user,c.id,'Cancelled');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: double cancel'; end if;
  if (select balance from public.wallets where user_id = customer_user) <> 150 then raise exception 'FAIL: refund amount'; end if;

  -- Full lifecycle pays the lawyer 35 - floor(35 / 5) = 28 only on completion.
  select * into c from public.book_consultation(customer_user,lawyer_id,'Kasus kedua yang perlu dibahas.','book-3');
  perform public.transition_consultation(lawyer_user,c.id,'Confirmed');
  select * into c from public.transition_consultation(lawyer_user,c.id,'Ongoing');
  if c.started_at is null then raise exception 'FAIL: started_at missing'; end if;
  if (select balance from public.wallets where user_id = lawyer_user) <> 0 then raise exception 'FAIL: early earning'; end if;
  select * into c from public.transition_consultation(customer_user,c.id,'Completed');
  if c.ended_at is null or (select balance from public.wallets where user_id = lawyer_user) <> 28 then
    raise exception 'FAIL: lawyer earning';
  end if;
  blocked := false;
  begin perform public.transition_consultation(lawyer_user,c.id,'Completed');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: double completion'; end if;

  -- Ledger reconciles with every wallet.
  if exists(select 1 from public.wallets w where w.user_id in (customer_user,lawyer_user)
            and w.balance <> (select coalesce(sum(amount),0) from public.point_transactions t where t.user_id = w.user_id)) then
    raise exception 'FAIL: ledger does not reconcile';
  end if;

  -- Rate and online status are lawyer-only profile fields.
  perform public.update_own_profile(lawyer_user,'{"rate_points":120,"is_online":false}'::jsonb);
  if not exists(select 1 from public.lawyer_profiles where id = lawyer_id and rate_points = 120 and not is_online) then
    raise exception 'FAIL: lawyer preferences not saved';
  end if;
  blocked := false;
  begin perform public.book_consultation(other_customer,lawyer_id,'Kronologi singkat kasus saya.','book-offline');
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: booked an offline lawyer'; end if;
  blocked := false;
  begin perform public.update_own_profile(customer_user,'{"rate_points":10}'::jsonb);
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'FAIL: customer set a rate'; end if;

  raise notice 'PASS: wallets, top up, booking, refund, 80%% earning, role guards, preferences';
end;
$$;
rollback;
