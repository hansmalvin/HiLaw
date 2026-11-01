-- Apply after migration 001. Allows approved lawyers to submit edited data
-- for a new review. Existing applications and their decisions remain intact.
begin;

create or replace function public.submit_lawyer_verification(p_user_id uuid,p_input jsonb,p_file_path text,p_resubmit boolean default false)
returns public.lawyer_verifications language plpgsql security definer set search_path = '' as $$
declare lp public.lawyer_profiles; result public.lawyer_verifications;
begin
  if not exists(select 1 from public.profiles where id = p_user_id and role = 'lawyer') then raise exception 'Invalid lawyer'; end if;
  -- Keep the same lock order as review_lawyer_verification.
  select * into lp from public.lawyer_profiles where user_id = p_user_id for update;
  if not found then raise exception 'Lawyer not found'; end if;
  if (not p_resubmit and lp.verification_status <> 'not_submitted') or
     (p_resubmit and lp.verification_status not in ('rejected','approved')) then
    raise exception 'Status pengajuan tidak valid: pengajuan ulang hanya setelah rejected atau approved';
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

revoke all on function public.submit_lawyer_verification(uuid,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.submit_lawyer_verification(uuid,jsonb,text,boolean) to service_role;

commit;
