-- Apply after migrations 001-003 in Supabase SQL Editor (as project owner).
-- Poin HiLaw wallet + ledger, consultations, chat messages, reviews.
-- Every balance change happens inside one SECURITY DEFINER function with a row lock.
begin;

-- Rate and availability move from browser localStorage to the server.
alter table public.lawyer_profiles
  add column rate_points integer not null default 50 check (rate_points between 1 and 10000),
  add column is_online boolean not null default true;

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  lawyer_id uuid not null references public.lawyer_profiles(id) on delete cascade,
  rate integer not null check (rate between 1 and 10000),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Ongoing','Completed','Cancelled')),
  brief text not null check (char_length(trim(brief)) between 10 and 1500),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_consultation on public.consultations(customer_id, lawyer_id)
  where status in ('Pending','Confirmed','Ongoing');
create index consultations_customer_idx on public.consultations(customer_id, created_at desc);
create index consultations_lawyer_idx on public.consultations(lawyer_id, created_at desc);
create trigger consultations_updated before update on public.consultations
  for each row execute function public.touch_updated_at();

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('TOP_UP','CONSULTATION_PAYMENT','REFUND','EARNING')),
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  description text not null,
  method text,
  consultation_id uuid references public.consultations(id) on delete set null,
  request_id text not null check (char_length(request_id) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, request_id)
);
create index point_transactions_user_idx on public.point_transactions(user_id, created_at desc);
create index point_transactions_consultation_idx on public.point_transactions(consultation_id);

create table public.consultation_messages (
  id uuid primary key,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp()
);
create index consultation_messages_idx on public.consultation_messages(consultation_id, created_at);
create index consultation_messages_sender_idx on public.consultation_messages(sender_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  lawyer_id uuid not null references public.lawyer_profiles(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 5 and 1000),
  created_at timestamptz not null default now()
);
create index reviews_lawyer_idx on public.reviews(lawyer_id);
create index reviews_customer_idx on public.reviews(customer_id);

-- One wallet per profile, including accounts that already exist.
create function public.create_wallet() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.wallets(user_id) values (new.id) on conflict do nothing; return new; end;
$$;
create trigger profiles_wallet after insert on public.profiles for each row execute function public.create_wallet();
insert into public.wallets(user_id) select id from public.profiles on conflict do nothing;

-- Internal: the UPDATE row-locks the wallet; the CHECK constraint is the last line against negatives.
create function public.apply_points(p_user_id uuid, p_type text, p_amount integer, p_description text,
  p_request_id text, p_consultation_id uuid default null, p_method text default null)
returns public.point_transactions language plpgsql security definer set search_path = '' as $$
declare new_balance integer; result public.point_transactions;
begin
  insert into public.wallets(user_id) values (p_user_id) on conflict do nothing;
  update public.wallets set balance = balance + p_amount, updated_at = now()
    where user_id = p_user_id returning balance into new_balance;
  if new_balance < 0 then raise exception 'Saldo Poin tidak mencukupi. Silakan top up terlebih dahulu.'; end if;
  insert into public.point_transactions(user_id,type,amount,balance_after,description,method,consultation_id,request_id)
  values (p_user_id,p_type,p_amount,new_balance,p_description,p_method,p_consultation_id,p_request_id)
  returning * into result;
  return result;
end;
$$;

create function public.topup_points(p_user_id uuid, p_amount integer, p_method text, p_request_id text)
returns public.point_transactions language plpgsql security definer set search_path = '' as $$
declare existing public.point_transactions;
begin
  if not exists(select 1 from public.profiles where id = p_user_id and role = 'customer') then
    raise exception 'Hanya customer yang dapat top up Poin.';
  end if;
  if p_amount not in (50,100,250,500) then raise exception 'Paket Poin tidak valid.'; end if;
  if p_method not in ('QRIS','BCA Virtual Account','Mandiri Virtual Account','GoPay','ShopeePay','Kartu Kredit') then
    raise exception 'Metode pembayaran tidak valid.';
  end if;
  insert into public.wallets(user_id) values (p_user_id) on conflict do nothing;
  perform 1 from public.wallets where user_id = p_user_id for update;
  select * into existing from public.point_transactions where user_id = p_user_id and request_id = p_request_id;
  if found then return existing; end if;
  return public.apply_points(p_user_id,'TOP_UP',p_amount,'Top up '||p_amount||' Poin HiLaw',p_request_id,null,p_method);
end;
$$;

create function public.book_consultation(p_customer_id uuid, p_lawyer_id uuid, p_brief text, p_request_id text)
returns public.consultations language plpgsql security definer set search_path = '' as $$
declare lp public.lawyer_profiles; c public.consultations; existing public.point_transactions;
  balance integer; lawyer_name text;
begin
  if not exists(select 1 from public.profiles where id = p_customer_id and role = 'customer') then
    raise exception 'Masuk sebagai customer untuk memesan konsultasi.';
  end if;
  insert into public.wallets(user_id) values (p_customer_id) on conflict do nothing;
  select w.balance into balance from public.wallets w where w.user_id = p_customer_id for update;
  -- A retried request returns the consultation it already paid for.
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
  if balance < lp.rate_points then raise exception 'Saldo Poin tidak mencukupi. Silakan top up terlebih dahulu.'; end if;
  if exists(select 1 from public.consultations where customer_id = p_customer_id and lawyer_id = p_lawyer_id
            and status in ('Pending','Confirmed','Ongoing')) then
    raise exception 'Anda sudah memiliki konsultasi aktif atau menunggu dengan pengacara ini.';
  end if;
  select full_name into lawyer_name from public.profiles where id = lp.user_id;
  insert into public.consultations(customer_id,lawyer_id,rate,brief)
  values (p_customer_id,p_lawyer_id,lp.rate_points,trim(p_brief)) returning * into c;
  perform public.apply_points(p_customer_id,'CONSULTATION_PAYMENT',-lp.rate_points,
    'Konsultasi bersama '||lawyer_name,p_request_id,c.id);
  return c;
end;
$$;

-- Lifecycle: Pending -> Confirmed -> Ongoing -> Completed; Pending -> Cancelled (full refund).
-- Completed credits the lawyer the rate minus a 20% platform fee (rounded down).
create function public.transition_consultation(p_actor_id uuid, p_consultation_id uuid, p_status text)
returns public.consultations language plpgsql security definer set search_path = '' as $$
declare actor_role text; c public.consultations; lp public.lawyer_profiles;
  is_lawyer boolean; is_customer boolean; lawyer_name text; earning integer;
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
  select full_name into lawyer_name from public.profiles where id = lp.user_id;
  if p_status = 'Cancelled' then
    perform public.apply_points(c.customer_id,'REFUND',c.rate,'Refund konsultasi bersama '||lawyer_name,'refund-'||c.id,c.id);
  elsif p_status = 'Completed' then
    earning := c.rate - c.rate / 5;
    perform public.apply_points(lp.user_id,'EARNING',earning,'Pendapatan konsultasi (80%)','earning-'||c.id,c.id);
  end if;
  return c;
end;
$$;

-- Same body as 001, plus lawyer-only rate_points and is_online.
create or replace function public.update_own_profile(p_user_id uuid, p_patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; lp public.lawyer_profiles;
begin
  select * into p from public.profiles where id = p_user_id;
  if not found then raise exception 'Profile not found'; end if;
  if p.role = 'lawyer' then
    select * into lp from public.lawyer_profiles where user_id = p_user_id for update;
    if p_patch ? 'full_name' and p_patch->>'full_name' <> p.full_name then
      raise exception 'Nama pengacara hanya diubah melalui pengajuan verifikasi';
    end if;
    update public.lawyer_profiles set
      bio = case when p_patch ? 'bio' then p_patch->>'bio' else bio end,
      rate_points = case when p_patch ? 'rate_points' then (p_patch->>'rate_points')::integer else rate_points end,
      is_online = case when p_patch ? 'is_online' then (p_patch->>'is_online')::boolean else is_online end
    where id = lp.id;
  elsif p_patch ?| array['bio','rate_points','is_online'] then
    raise exception 'Bio, tarif, dan status online hanya untuk pengacara';
  end if;
  perform 1 from public.profiles where id = p_user_id for update;
  update public.profiles set
    full_name = case when p_patch ? 'full_name' then p_patch->>'full_name' else full_name end,
    phone = case when p_patch ? 'phone' then p_patch->>'phone' else phone end,
    avatar_url = case when p_patch ? 'avatar_url' then p_patch->>'avatar_url' else avatar_url end
  where id = p_user_id;
end;
$$;

-- Same model as 001: RLS on, no browser access; Express uses service_role after its own checks.
alter table public.wallets enable row level security;
alter table public.consultations enable row level security;
alter table public.point_transactions enable row level security;
alter table public.consultation_messages enable row level security;
alter table public.reviews enable row level security;
revoke all on public.wallets,public.consultations,public.point_transactions,public.consultation_messages,public.reviews
  from anon,authenticated;
grant all on public.wallets,public.consultations,public.point_transactions,public.consultation_messages,public.reviews
  to service_role;

revoke all on function public.create_wallet(),
  public.apply_points(uuid,text,integer,text,text,uuid,text),
  public.topup_points(uuid,integer,text,text),
  public.book_consultation(uuid,uuid,text,text),
  public.transition_consultation(uuid,uuid,text),
  public.update_own_profile(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.apply_points(uuid,text,integer,text,text,uuid,text),
  public.topup_points(uuid,integer,text,text),
  public.book_consultation(uuid,uuid,text,text),
  public.transition_consultation(uuid,uuid,text),
  public.update_own_profile(uuid,jsonb)
  to service_role;

commit;
