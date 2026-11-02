-- Apply after 004 in Supabase SQL Editor. Session packages, automatic time limit, optional review text.
begin;

-- Packages priced from the lawyer's base rate (Poin per 30 minutes), rounded up to whole Poin:
--   Kilat 15 min = 60%, Standar 30 min = 100%, Mendalam 60 min = 180%.
create function public.package_price(p_rate integer, p_minutes integer) returns integer
language sql immutable set search_path = '' as $$
  select case p_minutes
    when 15 then ceil(p_rate * 0.6)::integer
    when 30 then p_rate
    when 60 then ceil(p_rate * 1.8)::integer
  end;
$$;

alter table public.consultations
  add constraint consultations_duration_package check (duration_minutes in (15,30,60));
create index consultations_ongoing_idx on public.consultations(started_at) where status = 'Ongoing';

-- Review text becomes optional; the star rating stays required.
alter table public.reviews alter column body drop not null;
alter table public.reviews drop constraint reviews_body_check;
alter table public.reviews add constraint reviews_body_check
  check (body is null or char_length(trim(body)) between 1 and 1000);

-- One place for the 80/20 split, used by manual completion and by the time limit.
create function public.credit_lawyer_earning(p_consultation public.consultations) returns void
language plpgsql security definer set search_path = '' as $$
declare lawyer_user uuid;
begin
  select user_id into lawyer_user from public.lawyer_profiles where id = p_consultation.lawyer_id;
  perform public.apply_points(lawyer_user,'EARNING',p_consultation.rate - p_consultation.rate / 5,
    'Pendapatan konsultasi (80%)','earning-'||p_consultation.id,p_consultation.id);
end;
$$;

drop function public.book_consultation(uuid,uuid,text,text);
create function public.book_consultation(p_customer_id uuid, p_lawyer_id uuid, p_brief text, p_request_id text,
  p_duration integer default 30)
returns public.consultations language plpgsql security definer set search_path = '' as $$
declare lp public.lawyer_profiles; c public.consultations; existing public.point_transactions;
  balance integer; lawyer_name text; price integer;
begin
  if not exists(select 1 from public.profiles where id = p_customer_id and role = 'customer') then
    raise exception 'Masuk sebagai customer untuk memesan konsultasi.';
  end if;
  if p_duration not in (15,30,60) then raise exception 'Paket durasi tidak valid.'; end if;
  insert into public.wallets(user_id) values (p_customer_id) on conflict do nothing;
  select w.balance into balance from public.wallets w where w.user_id = p_customer_id for update;
  select * into existing from public.point_transactions where user_id = p_customer_id and request_id = p_request_id;
  if found then
    select * into c from public.consultations where id = existing.consultation_id;
    return c;
  end if;
  select * into lp from public.lawyer_profiles where id = p_lawyer_id;
  if not found or lp.verification_status <> 'approved' then raise exception 'Pengacara belum aktif dan terverifikasi.'; end if;
  if not lp.is_online then raise exception 'Pengacara sedang offline. Silakan pilih pengacara lain.'; end if;
  if p_brief is null or char_length(trim(p_brief)) not between 10 and 1500 then
    raise exception 'Ceritakan masalah Anda dalam 10-1.500 karakter.';
  end if;
  price := public.package_price(lp.rate_points, p_duration);
  if balance < price then raise exception 'Saldo Poin tidak mencukupi. Silakan top up terlebih dahulu.'; end if;
  if exists(select 1 from public.consultations where customer_id = p_customer_id and lawyer_id = p_lawyer_id
            and status in ('Pending','Confirmed','Ongoing')) then
    raise exception 'Anda sudah memiliki konsultasi aktif atau menunggu dengan pengacara ini.';
  end if;
  select full_name into lawyer_name from public.profiles where id = lp.user_id;
  insert into public.consultations(customer_id,lawyer_id,rate,duration_minutes,brief)
  values (p_customer_id,p_lawyer_id,price,p_duration,trim(p_brief)) returning * into c;
  perform public.apply_points(p_customer_id,'CONSULTATION_PAYMENT',-price,
    'Konsultasi '||p_duration||' menit bersama '||lawyer_name,p_request_id,c.id);
  return c;
end;
$$;

-- Same rules as 004; completion now goes through credit_lawyer_earning().
create or replace function public.transition_consultation(p_actor_id uuid, p_consultation_id uuid, p_status text)
returns public.consultations language plpgsql security definer set search_path = '' as $$
declare actor_role text; c public.consultations; lp public.lawyer_profiles;
  is_lawyer boolean; is_customer boolean; lawyer_name text;
begin
  select role into actor_role from public.profiles where id = p_actor_id;
  if not found then raise exception 'Akun tidak ditemukan.'; end if;
  select * into c from public.consultations where id = p_consultation_id for update;
  if not found then raise exception 'Konsultasi tidak ditemukan.'; end if;
  select * into lp from public.lawyer_profiles where id = c.lawyer_id;
  is_lawyer := lp.user_id = p_actor_id;
  is_customer := c.customer_id = p_actor_id;
  if not (is_lawyer or is_customer or actor_role = 'admin') then raise exception 'Konsultasi tidak dapat diakses.'; end if;
  if not ((p_status = 'Confirmed' and c.status = 'Pending' and is_lawyer)
       or (p_status = 'Ongoing' and c.status = 'Confirmed' and is_lawyer)
       or (p_status = 'Completed' and c.status = 'Ongoing' and (is_lawyer or is_customer))
       or (p_status = 'Cancelled' and c.status = 'Pending' and (is_lawyer or is_customer or actor_role = 'admin'))) then
    raise exception 'Perubahan status tidak diizinkan atau sudah diproses.';
  end if;
  if p_status in ('Confirmed','Ongoing') and lp.verification_status <> 'approved' then
    raise exception 'Profil pengacara belum aktif dan terverifikasi.';
  end if;
  update public.consultations set status = p_status,
    started_at = case when p_status = 'Ongoing' then now() else started_at end,
    ended_at = case when p_status in ('Completed','Cancelled') then now() else ended_at end
  where id = c.id returning * into c;
  if p_status = 'Cancelled' then
    select full_name into lawyer_name from public.profiles where id = lp.user_id;
    perform public.apply_points(c.customer_id,'REFUND',c.rate,'Refund konsultasi bersama '||lawyer_name,'refund-'||c.id,c.id);
  elsif p_status = 'Completed' then
    perform public.credit_lawyer_earning(c);
  end if;
  return c;
end;
$$;

-- Ends Ongoing sessions whose time is up (one id, or all when null). The clock is the database's.
create function public.expire_due_consultations(p_consultation_id uuid default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare c public.consultations; ended integer := 0;
begin
  for c in
    select * from public.consultations
    where status = 'Ongoing'
      and started_at + make_interval(mins => duration_minutes) <= now()
      and (p_consultation_id is null or id = p_consultation_id)
    for update skip locked
  loop
    update public.consultations set status = 'Completed',
      ended_at = c.started_at + make_interval(mins => c.duration_minutes)
    where id = c.id returning * into c;
    perform public.credit_lawyer_earning(c);
    ended := ended + 1;
  end loop;
  return ended;
end;
$$;

revoke all on function public.package_price(integer,integer),
  public.credit_lawyer_earning(public.consultations),
  public.book_consultation(uuid,uuid,text,text,integer),
  public.transition_consultation(uuid,uuid,text),
  public.expire_due_consultations(uuid)
  from public,anon,authenticated;
grant execute on function public.package_price(integer,integer),
  public.credit_lawyer_earning(public.consultations),
  public.book_consultation(uuid,uuid,text,text,integer),
  public.transition_consultation(uuid,uuid,text),
  public.expire_due_consultations(uuid)
  to service_role;

commit;
