
-- VYVE Health: HealthKit + Health Connect integration — Session 1 migration
-- 23 April 2026
-- Creates 3 tables + 1 trigger function + 2 triggers. All RLS enabled.

-- ============================================================================
-- 1) member_health_samples — raw samples from device health store
-- ============================================================================
create table public.member_health_samples (
  id           uuid primary key default gen_random_uuid(),
  member_email text not null,
  source       text not null check (source in ('healthkit','health_connect')),
  sample_type  text not null check (sample_type in ('workout','steps','heart_rate','weight','active_energy','sleep','distance')),
  native_uuid  text not null,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  value        numeric,
  unit         text,
  workout_type text,
  metadata     jsonb not null default '{}'::jsonb,
  app_source   text,
  ingested_at  timestamptz not null default now(),
  promoted_to  text check (promoted_to in ('workouts','cardio','weight_logs') or promoted_to is null),
  promoted_id  uuid,
  unique (member_email, source, native_uuid)
);

create index member_health_samples_member_start_idx on public.member_health_samples (member_email, start_at desc);
create index member_health_samples_member_type_idx on public.member_health_samples (member_email, sample_type, start_at desc);
create index member_health_samples_unpromoted_idx on public.member_health_samples (member_email, sample_type) where promoted_to is null;

alter table public.member_health_samples enable row level security;

-- Members can read their own samples. Writes only via service role (sync-health-data EF).
create policy member_health_samples_self_select
  on public.member_health_samples
  for select
  using (auth.email() = member_email);

-- Lowercase the member_email on insert/update (matches 42-table pattern)
create trigger zz_lc_email
  before insert or update on public.member_health_samples
  for each row execute function public.vyve_lc_email();

-- ============================================================================
-- 2) member_health_connections — per-member per-platform consent state
-- ============================================================================
create table public.member_health_connections (
  member_email     text not null,
  platform         text not null check (platform in ('healthkit','health_connect')),
  granted_scopes   text[] not null default '{}',
  connected_at     timestamptz not null default now(),
  last_sync_at     timestamptz,
  last_sync_status text,
  total_synced     integer not null default 0,
  revoked_at       timestamptz,
  primary key (member_email, platform)
);

create index member_health_connections_active_idx on public.member_health_connections (member_email) where revoked_at is null;

alter table public.member_health_connections enable row level security;

create policy member_health_connections_self_select
  on public.member_health_connections
  for select
  using (auth.email() = member_email);

create trigger zz_lc_email
  before insert or update on public.member_health_connections
  for each row execute function public.vyve_lc_email();

-- ============================================================================
-- 3) member_health_write_ledger — VYVE writes to health store (shadow-read guard)
-- ============================================================================
create table public.member_health_write_ledger (
  id                uuid primary key default gen_random_uuid(),
  member_email      text not null,
  platform          text not null check (platform in ('healthkit','health_connect')),
  vyve_source_table text not null check (vyve_source_table in ('workouts','weight_logs')),
  vyve_source_id    uuid not null,
  native_uuid       text,
  write_status      text not null default 'queued' check (write_status in ('queued','confirmed','failed')),
  queued_at         timestamptz not null default now(),
  confirmed_at      timestamptz,
  error_message     text,
  unique (platform, vyve_source_table, vyve_source_id)
);

create index member_health_write_ledger_queued_idx
  on public.member_health_write_ledger (member_email, write_status, queued_at)
  where write_status = 'queued';
create index member_health_write_ledger_native_uuid_idx
  on public.member_health_write_ledger (platform, native_uuid)
  where native_uuid is not null;

alter table public.member_health_write_ledger enable row level security;

create policy member_health_write_ledger_self_select
  on public.member_health_write_ledger
  for select
  using (auth.email() = member_email);

create trigger zz_lc_email
  before insert or update on public.member_health_write_ledger
  for each row execute function public.vyve_lc_email();

-- ============================================================================
-- 4) Trigger function: auto-queue write-back when workout or weight is logged
-- ============================================================================
create or replace function public.queue_health_write_back()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only queue a write-back for platforms the member has connected with write scope
  -- granted_scopes uses flat names — 'write_workouts', 'write_weight' — set by client post-permission
  insert into public.member_health_write_ledger (
    member_email, platform, vyve_source_table, vyve_source_id
  )
  select
    NEW.member_email,
    mhc.platform,
    TG_TABLE_NAME,
    NEW.id
  from public.member_health_connections mhc
  where mhc.member_email = NEW.member_email
    and mhc.revoked_at is null
    and (
      (TG_TABLE_NAME = 'workouts'     and 'write_workouts' = any(mhc.granted_scopes))
      or
      (TG_TABLE_NAME = 'weight_logs'  and 'write_weight'    = any(mhc.granted_scopes))
    )
  on conflict (platform, vyve_source_table, vyve_source_id) do nothing;

  return NEW;
end;
$$;

grant execute on function public.queue_health_write_back() to authenticated, service_role;

-- ============================================================================
-- 5) Triggers on workouts and weight_logs
-- ============================================================================
create trigger queue_health_write_back_workouts
  after insert on public.workouts
  for each row execute function public.queue_health_write_back();

create trigger queue_health_write_back_weight
  after insert on public.weight_logs
  for each row execute function public.queue_health_write_back();

-- ============================================================================
-- End of migration
-- ============================================================================
