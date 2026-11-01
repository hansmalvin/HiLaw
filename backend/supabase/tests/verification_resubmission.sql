-- Optional regression check in Supabase SQL Editor AFTER migrations 001 + 003.
-- Uses fictional users and rolls back all fixtures. Does not upload documents.
begin;
do $$
declare
  lawyer_user uuid := gen_random_uuid();
  admin_user uuid := gen_random_uuid();
  first_application public.lawyer_verifications;
  next_application public.lawyer_verifications;
  input jsonb := '{"full_name":"Regression Lawyer","kta_number":"DEMO-001","organization":"PERADI","specialization":"Hukum Pidana","experience_years":5}'::jsonb;
  blocked boolean := false;
begin
  insert into auth.users(id,email,raw_user_meta_data) values
    (lawyer_user,lawyer_user::text || '@example.com','{"full_name":"Regression Lawyer","role":"lawyer"}'::jsonb),
    (admin_user,admin_user::text || '@example.com','{"full_name":"Regression Admin","role":"customer"}'::jsonb);
  update public.profiles set role = 'admin' where id = admin_user;

  -- A new lawyer cannot use the resubmission endpoint.
  begin
    perform public.submit_lawyer_verification(lawyer_user,input,lawyer_user::text || '/demo.pdf',true);
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: initial submission accepted PUT'; end if;

  select * into first_application from public.submit_lawyer_verification(lawyer_user,input,lawyer_user::text || '/demo.pdf',false);
  perform public.review_lawyer_verification(admin_user,first_application.id,'approved');

  input := input || '{"full_name":"Edited Lawyer","specialization":"Hukum Perdata","experience_years":6}'::jsonb;
  select * into next_application from public.submit_lawyer_verification(lawyer_user,input,lawyer_user::text || '/edited.pdf',true);
  if next_application.id = first_application.id or next_application.status <> 'pending' then
    raise exception 'FAIL: approved edit did not create a new pending application';
  end if;
  if (select status from public.lawyer_verifications where id = first_application.id) <> 'approved' then
    raise exception 'FAIL: previous decision overwritten';
  end if;
  if not exists(select 1 from public.lawyer_profiles where user_id = lawyer_user and verification_status = 'pending' and specialization = 'Hukum Perdata' and experience_years = 6) then
    raise exception 'FAIL: edited data/status not persisted atomically';
  end if;
  if not exists(select 1 from public.profiles where id = lawyer_user and full_name = 'Edited Lawyer') then
    raise exception 'FAIL: name not updated';
  end if;

  blocked := false;
  begin
    perform public.submit_lawyer_verification(lawyer_user,input,lawyer_user::text || '/duplicate.pdf',true);
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: duplicate pending submission accepted'; end if;

  -- Reviewing an old decision cannot bypass the new review.
  blocked := false;
  begin
    perform public.review_lawyer_verification(admin_user,first_application.id,'approved');
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: old decision changed the current status'; end if;

  perform public.review_lawyer_verification(admin_user,next_application.id,'rejected','KTA demonstrasi belum sesuai');
  select * into next_application from public.submit_lawyer_verification(lawyer_user,input,lawyer_user::text || '/corrected.pdf',true);
  perform public.review_lawyer_verification(admin_user,next_application.id,'approved');
  if not exists(select 1 from public.lawyer_profiles where user_id = lawyer_user and verification_status = 'approved') then
    raise exception 'FAIL: resubmitted lawyer could not be approved again';
  end if;
  raise notice 'PASS: approved edit, pending guard, history, reject/retry, approval';
end;
$$;
rollback;
