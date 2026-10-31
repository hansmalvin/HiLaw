-- Run once in Supabase SQL Editor as project owner. No passwords stored here.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  email text,
  phone text,
  role text not null default 'customer' check (role in ('admin','lawyer','customer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.lawyer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  specialization text check (specialization in ('Hukum Pidana','Hukum Perdata','Hukum Keluarga','Hukum Bisnis','Hukum Properti','Hukum Ketenagakerjaan','Hukum Waris','Konsultasi Umum')),
  experience_years integer not null default 0 check (experience_years between 0 and 60),
  organization text check (organization in ('PERADI','KAI','AAI','IKADIN','IPHI','HAPI','Lainnya')),
  kta_number text check (char_length(kta_number) between 1 and 100),
  bio text check (char_length(bio) <= 2000),
  verification_status text not null default 'not_submitted' check (verification_status in ('not_submitted','pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.lawyer_verifications (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyer_profiles(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  kta_number text not null check (char_length(trim(kta_number)) between 1 and 100),
  organization text not null check (organization in ('PERADI','KAI','AAI','IKADIN','IPHI','HAPI','Lainnya')),
  specialization text not null check (specialization in ('Hukum Pidana','Hukum Perdata','Hukum Keluarga','Hukum Bisnis','Hukum Properti','Hukum Ketenagakerjaan','Hukum Waris','Konsultasi Umum')),
  experience_years integer not null check (experience_years between 0 and 60),
  kta_file_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  check ((status = 'pending' and reviewed_at is null and rejection_reason is null)
    or (status = 'approved' and reviewed_at is not null and rejection_reason is null)
    or (status = 'rejected' and reviewed_at is not null and rejection_reason is not null and char_length(trim(rejection_reason)) between 5 and 1000))
);
create index profiles_role_idx on public.profiles(role);
create index lawyer_status_idx on public.lawyer_profiles(verification_status);
create index verification_history_idx on public.lawyer_verifications(lawyer_id,submitted_at desc);
create index verification_status_idx on public.lawyer_verifications(status,submitted_at desc);
create index verification_reviewer_idx on public.lawyer_verifications(reviewed_by);
create unique index one_pending_per_lawyer on public.lawyer_verifications(lawyer_id) where status = 'pending';

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger lawyer_profiles_updated before update on public.lawyer_profiles for each row execute function public.touch_updated_at();

-- Atomic creation with Auth: if profile creation fails, Auth signup rolls back.
-- User-editable metadata may never assign the admin role.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare chosen_role text := coalesce(new.raw_user_meta_data->>'role','customer');
begin
  if chosen_role not in ('customer','lawyer') then raise exception 'Public role is invalid'; end if;
  insert into public.profiles(id,full_name,email,phone,role)
  values(new.id,trim(new.raw_user_meta_data->>'full_name'),new.email,new.raw_user_meta_data->>'phone',chosen_role);
  if chosen_role = 'lawyer' then insert into public.lawyer_profiles(user_id) values(new.id); end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Keep the read-only email mirror in sync with confirmed Auth email changes.
create function public.sync_auth_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.profiles set email = new.email where id = new.id; return new; end;
$$;
create trigger on_auth_email_updated after update of email on auth.users for each row execute function public.sync_auth_email();

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
alter table public.profiles enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.lawyer_verifications enable row level security;
revoke all on public.profiles,public.lawyer_profiles,public.lawyer_verifications from anon,authenticated;
grant select on public.profiles,public.lawyer_profiles,public.lawyer_verifications to authenticated;
grant all on public.profiles,public.lawyer_profiles,public.lawyer_verifications to service_role;
create policy own_profile_read on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy own_lawyer_read on public.lawyer_profiles for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy own_verification_read on public.lawyer_verifications for select to authenticated using ((select public.is_admin()) or exists(select 1 from public.lawyer_profiles lp where lp.id = lawyer_id and lp.user_id = (select auth.uid())));
-- All writes go through authenticated/authorized Express endpoints and private RPCs.
-- No direct INSERT/UPDATE/DELETE policies: users cannot promote roles or statuses.

create function public.update_own_profile(p_user_id uuid, p_patch jsonb) returns void
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
    if p_patch ? 'bio' then update public.lawyer_profiles set bio = p_patch->>'bio' where id = lp.id; end if;
  elsif p_patch ? 'bio' then raise exception 'Bio hanya untuk pengacara';
  end if;
  perform 1 from public.profiles where id = p_user_id for update;
  update public.profiles set
    full_name = case when p_patch ? 'full_name' then p_patch->>'full_name' else full_name end,
    phone = case when p_patch ? 'phone' then p_patch->>'phone' else phone end,
    avatar_url = case when p_patch ? 'avatar_url' then p_patch->>'avatar_url' else avatar_url end
  where id = p_user_id;
end;
$$;

create function public.submit_lawyer_verification(p_user_id uuid,p_input jsonb,p_file_path text,p_resubmit boolean default false)
returns public.lawyer_verifications language plpgsql security definer set search_path = '' as $$
declare lp public.lawyer_profiles; result public.lawyer_verifications;
begin
  if not exists(select 1 from public.profiles where id = p_user_id and role = 'lawyer') then raise exception 'Invalid lawyer'; end if;
  -- Use identical lock order (lawyer then application) in both RPCs.
  select * into lp from public.lawyer_profiles where user_id = p_user_id for update;
  if not found then raise exception 'Lawyer not found'; end if;
  if (not p_resubmit and lp.verification_status <> 'not_submitted') or
     (p_resubmit and lp.verification_status <> 'rejected') then
    raise exception 'Status pengajuan tidak valid: hanya pengajuan awal atau pengajuan ulang setelah rejected';
  end if;
  if p_file_path is null or split_part(p_file_path,'/',1) <> p_user_id::text then raise exception 'Invalid private document path'; end if;
  insert into public.lawyer_verifications(lawyer_id,full_name,kta_number,organization,specialization,experience_years,kta_file_path)
  values(lp.id,trim(p_input->>'full_name'),trim(p_input->>'kta_number'),p_input->>'organization',p_input->>'specialization',(p_input->>'experience_years')::integer,p_file_path)
  returning * into result;
  update public.lawyer_profiles set verification_status = 'pending',specialization = result.specialization,
    experience_years = result.experience_years,organization = result.organization,kta_number = result.kta_number
  where id = lp.id;
  update public.profiles set full_name = result.full_name where id = p_user_id;
  return result;
end;
$$;

create function public.review_lawyer_verification(p_admin_id uuid,p_verification_id uuid,p_decision text,p_reason text default null)
returns public.lawyer_verifications language plpgsql security definer set search_path = '' as $$
declare lawyer uuid; result public.lawyer_verifications;
begin
  if not exists(select 1 from public.profiles where id = p_admin_id and role = 'admin') then raise exception 'Admin required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  if p_decision = 'rejected' and (p_reason is null or char_length(trim(p_reason)) not between 5 and 1000) then raise exception 'Alasan penolakan wajib 5-1000 karakter'; end if;
  select lawyer_id into lawyer from public.lawyer_verifications where id = p_verification_id;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  perform 1 from public.lawyer_profiles where id = lawyer for update;
  select * into result from public.lawyer_verifications where id = p_verification_id for update;
  if not found or result.status <> 'pending' then raise exception 'Pengajuan sudah diproses'; end if;
  update public.lawyer_verifications set status = p_decision, rejection_reason = case when p_decision = 'rejected' then trim(p_reason) else null end,
    reviewed_by = p_admin_id,reviewed_at = now()
  where id = p_verification_id returning * into result;
  update public.lawyer_profiles set verification_status = p_decision where id = lawyer;
  return result;
end;
$$;

-- SECURITY DEFINER functions are not publicly executable.
revoke all on function public.handle_new_user(),public.sync_auth_email(),public.touch_updated_at() from public,anon,authenticated;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated,service_role;
revoke all on function public.update_own_profile(uuid,jsonb),public.submit_lawyer_verification(uuid,jsonb,text,boolean),public.review_lawyer_verification(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.update_own_profile(uuid,jsonb),public.submit_lawyer_verification(uuid,jsonb,text,boolean),public.review_lawyer_verification(uuid,uuid,text,text) to service_role;

-- Private bucket; deliberately no client storage policies. Access via Express only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lawyer-kta','lawyer-kta',false,2097152,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false,file_size_limit = excluded.file_size_limit,allowed_mime_types = excluded.allowed_mime_types;
commit;
