create table if not exists public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_partners(id) on delete cascade,
  kind text not null default 'group' check (kind in ('group','challenge','direct')),
  title text not null check (char_length(title) between 1 and 80),
  archived boolean not null default false,
  challenge_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz null
);
create index if not exists idx_cthreads_partner on public.coach_threads(partner_id, archived, last_message_at desc nulls last);
create table if not exists public.coach_thread_members (
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  member_email text not null,
  joined_at timestamptz not null default now(),
  primary key (thread_id, member_email)
);
create unique index if not exists idx_cthm_thread_email_ci on public.coach_thread_members(thread_id, lower(member_email));
create index if not exists idx_cthm_email on public.coach_thread_members(lower(member_email));
alter table public.coach_messages
  add column if not exists thread_id uuid null references public.coach_threads(id) on delete cascade,
  add column if not exists group_key uuid null,
  add column if not exists attachment_path text null,
  add column if not exists attachment_kind text null,
  add column if not exists attachment_name text null;
alter table public.coach_messages drop constraint if exists coach_messages_attachment_kind_check;
alter table public.coach_messages add constraint coach_messages_attachment_kind_check
  check (attachment_kind is null or attachment_kind in ('image','file','video','audio'));
alter table public.coach_messages drop constraint if exists coach_messages_body_check;
alter table public.coach_messages add constraint coach_messages_body_check
  check (char_length(body) <= 4000 and (char_length(body) >= 1 or attachment_path is not null));
create index if not exists idx_cmsg_thread_id on public.coach_messages(thread_id, created_at) where thread_id is not null;
create index if not exists idx_cmsg_group_key on public.coach_messages(group_key) where group_key is not null;
create index if not exists idx_cmsg_attachment on public.coach_messages(attachment_path) where attachment_path is not null;
create or replace function public.is_thread_member(p_thread uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from coach_thread_members m where m.thread_id = p_thread and lower(m.member_email) = lower(auth.email()));
$$;
create or replace function public.thread_partner(p_thread uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select partner_id from coach_threads where id = p_thread;
$$;
grant execute on function public.is_thread_member(uuid) to authenticated;
grant execute on function public.thread_partner(uuid) to authenticated;
create or replace function public.coach_thread_peers(p_thread uuid)
returns table (member_email text, first_name text)
language sql stable security definer set search_path = public as $$
  select lower(m.member_email), coalesce(nullif(split_part(coalesce(mb.first_name, ''), ' ', 1), ''), split_part(m.member_email, '@', 1))
  from coach_thread_members m
  left join members mb on lower(mb.email) = lower(m.member_email)
  where m.thread_id = p_thread
    and (public.is_thread_member(p_thread) or public.thread_partner(p_thread) = public.get_my_partner_id());
$$;
grant execute on function public.coach_thread_peers(uuid) to authenticated;
create or replace function public.coach_thread_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.thread_id is not null then
    update coach_threads set last_message_at = greatest(coalesce(last_message_at, new.created_at), new.created_at), updated_at = now() where id = new.thread_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_coach_thread_touch on public.coach_messages;
create trigger trg_coach_thread_touch after insert on public.coach_messages for each row execute function public.coach_thread_touch();
alter table public.coach_threads enable row level security;
alter table public.coach_thread_members enable row level security;
drop policy if exists cth_coach_all on public.coach_threads;
create policy cth_coach_all on public.coach_threads for all using (partner_id = get_my_partner_id()) with check (partner_id = get_my_partner_id());
drop policy if exists cth_member_sel on public.coach_threads;
create policy cth_member_sel on public.coach_threads for select using (public.is_thread_member(id));
drop policy if exists cth_admin_sel on public.coach_threads;
create policy cth_admin_sel on public.coach_threads for select using (is_admin_or_team());
drop policy if exists cthm_coach_all on public.coach_thread_members;
create policy cthm_coach_all on public.coach_thread_members for all
  using (public.thread_partner(thread_id) = get_my_partner_id())
  with check (public.thread_partner(thread_id) = get_my_partner_id() and is_coach_of(member_email));
drop policy if exists cthm_member_sel on public.coach_thread_members;
create policy cthm_member_sel on public.coach_thread_members for select using (lower(member_email) = lower(auth.email()));
drop policy if exists cthm_admin_sel on public.coach_thread_members;
create policy cthm_admin_sel on public.coach_thread_members for select using (is_admin_or_team());
drop policy if exists cmsg_member_sel on public.coach_messages;
create policy cmsg_member_sel on public.coach_messages for select using (
  (lower(member_email) = lower(auth.email()) and (deliver_at is null or deliver_at <= now()))
  or (sender = 'member' and thread_id is not null and public.is_thread_member(thread_id))
);
drop policy if exists cmsg_member_ins on public.coach_messages;
create policy cmsg_member_ins on public.coach_messages for insert with check (
  lower(member_email) = lower(auth.email()) and sender = 'member'
  and exists (select 1 from coach_clients cc where cc.partner_id = coach_messages.partner_id and lower(cc.member_email) = lower(auth.email()) and cc.status = 'active' and cc.consent_accepted_at is not null)
  and (thread_id is null or (public.is_thread_member(thread_id) and public.thread_partner(thread_id) = partner_id))
);
drop policy if exists cmsg_coach_ins on public.coach_messages;
create policy cmsg_coach_ins on public.coach_messages for insert with check (
  partner_id = get_my_partner_id() and sender = 'coach' and is_coach_of(member_email)
  and (thread_id is null or public.thread_partner(thread_id) = partner_id)
);
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_messages') then
    alter publication supabase_realtime add table public.coach_messages;
  end if;
end $$;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-message-media', 'coach-message-media', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','application/pdf','video/mp4','video/quicktime','video/webm','audio/webm','audio/mp4','audio/mpeg','audio/x-m4a','audio/aac','audio/ogg','audio/wav'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types, public = false;
drop policy if exists cmm_coach_read on storage.objects;
create policy cmm_coach_read on storage.objects for select using (bucket_id = 'coach-message-media' and split_part(name, '/', 1) = 'p-' || get_my_partner_id()::text);
drop policy if exists cmm_coach_write on storage.objects;
create policy cmm_coach_write on storage.objects for insert with check (bucket_id = 'coach-message-media' and split_part(name, '/', 1) = 'p-' || get_my_partner_id()::text);
drop policy if exists cmm_member_read on storage.objects;
create policy cmm_member_read on storage.objects for select using (
  bucket_id = 'coach-message-media' and exists (select 1 from public.coach_messages m where m.attachment_path = storage.objects.name)
);
drop policy if exists cmm_member_write on storage.objects;
create policy cmm_member_write on storage.objects for insert with check (
  bucket_id = 'coach-message-media' and split_part(name, '/', 2) = 'm'
  and exists (select 1 from public.coach_clients cc where 'p-' || cc.partner_id::text = split_part(name, '/', 1) and lower(cc.member_email) = lower(auth.email()) and cc.status = 'active' and cc.consent_accepted_at is not null)
);
insert into public.gdpr_table_policy (table_name, policy, reason, updated_at) values
  ('coach_thread_members', 'purge', 'Group-thread membership keyed to member_email (Trainerize W3)', now()),
  ('coach_threads', 'retain', 'Coach-owned thread shells; no member identifiers (Trainerize W3)', now())
on conflict (table_name) do update set policy = excluded.policy, reason = excluded.reason, updated_at = now();

-- tz_w3_media_coach_delete
drop policy if exists cmm_coach_delete on storage.objects;
create policy cmm_coach_delete on storage.objects for delete using (bucket_id = 'coach-message-media' and split_part(name, '/', 1) = 'p-' || get_my_partner_id()::text);
