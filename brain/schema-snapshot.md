# VYVE Health — Database Schema Snapshot

> Auto-generated from live Supabase project `ixjfklpckgxrwjlfsaaz`.
> DO NOT EDIT — overwritten weekly by the `schema-snapshot-refresh` Edge Function.
> Last refresh: 2026-04-19T03:00:13.213Z

**Totals:** 68 tables (68 with RLS) · 786 columns · 25 FKs · 125 triggers · 32 public functions · 73 RLS policies · 160 indexes · 13 cron jobs

---

## Tables (68)

### `activity_dedupe` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `source_table` | text | NO |  |  |  |
| `member_email` | text | NO |  |  |  |
| `activity_date` | date | YES |  |  |  |
| `iso_week` | integer | YES |  |  |  |
| `iso_year` | integer | YES |  |  |  |
| `raw_payload` | jsonb | NO |  |  |  |
| `logged_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `activity_dedupe_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `activity_dedupe_pkey`

### `admin_users` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `email` | text | NO |  | ✓ |  |
| `role` | text | NO | 'admin'::text |  |  |
| `added_by` | text | YES |  |  |  |
| `added_at` | timestamp with time zone | NO | now() |  |  |
| `active` | boolean | NO | true |  |  |
| `notes` | text | YES |  |  |  |

**Check constraints:**
- `admin_users_role_check`: CHECK ((role = ANY (ARRAY['admin'::text, 'viewer'::text])))

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `admin_users_pkey`

### `ai_decisions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `decision_type` | text | NO |  |  |  |
| `decision_value` | text | NO |  |  |  |
| `reasoning` | text | NO |  |  |  |
| `triggered_by` | text | NO | 'onboarding'::text |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |

**RLS policies:**
- `member_own_decisions` (SELECT, roles: public) — (auth.email() = member_email)
- `service_insert_decisions` (INSERT, roles: public) — — / CHECK: true

**Indexes:**
- `ai_decisions_email_idx`
- `ai_decisions_pkey`

### `ai_interactions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `triggered_by` | text | NO |  |  |  |
| `persona` | text | YES |  |  |  |
| `prompt_summary` | text | YES |  |  |  |
| `recommendation` | text | YES |  |  |  |
| `acted_on` | boolean | YES |  |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `decision_log` | jsonb | YES |  |  |  |

**Check constraints:**
- `ai_interactions_triggered_by_check`: CHECK ((triggered_by = ANY (ARRAY['weekly_checkin'::text, 'onboarding'::text, 'running_plan'::text, 'milestone'::text, 'manual'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`ai_interactions_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `ai_interactions_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `ai_interactions_pkey`
- `idx_ai_interactions_created_at`
- `idx_ai_interactions_member_email`

### `cardio` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `activity_date` | date | NO |  |  |  |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `session_number` | integer | NO | 1 |  |  |
| `cardio_type` | text | YES |  |  |  |
| `duration_minutes` | integer | YES |  |  |  |
| `distance_km` | numeric | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cardio_session_number_check`: CHECK ((session_number = ANY (ARRAY[1, 2])))
- `cardio_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`cardio_member_email_fkey`)

**Triggers:**
- `auto_time_fields_cardio` — BEFORE INSERT
- `counter_cardio` — AFTER INSERT
- `enforce_cap_cardio` — BEFORE INSERT
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `cardio_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `cardio_pkey`
- `idx_cardio_email_logged_at`
- `idx_cardio_logged_at`
- `idx_cardio_member_email`

### `cc_clients` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `company` | text | NO |  |  |  |
| `contact` | text | YES |  |  |  |
| `email` | text | YES |  |  |  |
| `phone` | text | YES |  |  |  |
| `value` | numeric | YES | 0 |  |  |
| `stage` | text | YES | 'onboarding'::text |  |  |
| `package` | text | YES |  |  |  |
| `nps_score` | integer | YES |  |  |  |
| `renewal_date` | date | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_clients_stage_check`: CHECK ((stage = ANY (ARRAY['onboarding'::text, 'active'::text, 'under_review'::text, 'churned'::text])))

**Triggers:**
- `cc_clients_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — ((auth.email() = created_by) OR (auth.email() = 'team@vyvehealth.co.uk'::text)) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_clients_pkey`

### `cc_decisions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `title` | text | NO |  |  |  |
| `decision_date` | date | YES | CURRENT_DATE |  |  |
| `made_by` | text | YES |  |  |  |
| `context` | text | YES |  |  |  |
| `outcome` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_decisions_pkey`

### `cc_documents` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `name` | text | NO |  |  |  |
| `file_size` | integer | YES |  |  |  |
| `file_type` | text | YES |  |  |  |
| `category` | text | YES |  |  |  |
| `storage_path` | text | NO |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_documents_pkey`

### `cc_episodes` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `episode_number` | integer | YES |  |  |  |
| `title` | text | NO |  |  |  |
| `guest` | text | YES |  |  |  |
| `episode_date` | date | YES |  |  |  |
| `status` | text | YES | 'planned'::text |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_episodes_status_check`: CHECK ((status = ANY (ARRAY['planned'::text, 'recorded'::text, 'published'::text])))

**Triggers:**
- `cc_episodes_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_episodes_pkey`

### `cc_finance` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `mrr` | numeric | YES | 0 |  |  |
| `burn` | numeric | YES | 0 |  |  |
| `cash` | numeric | YES | 0 |  |  |
| `target` | numeric | YES | 25000 |  |  |
| `recorded_date` | date | YES | CURRENT_DATE |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_finance_pkey`

### `cc_grants` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `name` | text | NO |  |  |  |
| `funder` | text | YES |  |  |  |
| `amount` | numeric | YES | 0 |  |  |
| `deadline` | date | YES |  |  |  |
| `status` | text | YES | 'identified'::text |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_grants_status_check`: CHECK ((status = ANY (ARRAY['identified'::text, 'applying'::text, 'submitted'::text, 'awarded'::text, 'rejected'::text])))

**Triggers:**
- `cc_grants_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_grants_pkey`

### `cc_intel` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `type` | text | NO |  |  |  |
| `title` | text | NO |  |  |  |
| `body` | text | YES |  |  |  |
| `source` | text | YES |  |  |  |
| `relevance` | text | YES |  |  |  |
| `imported_at` | timestamp with time zone | YES | now() |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |

**Check constraints:**
- `cc_intel_relevance_check`: CHECK ((relevance = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))
- `cc_intel_type_check`: CHECK ((type = ANY (ARRAY['grants'::text, 'legislation'::text, 'research'::text, 'competitors'::text, 'market'::text, 'daily'::text])))

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_intel_pkey`

### `cc_investors` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `name` | text | NO |  |  |  |
| `contact` | text | YES |  |  |  |
| `email` | text | YES |  |  |  |
| `type` | text | YES | 'Angel'::text |  |  |
| `stage` | text | YES | 'cold'::text |  |  |
| `amount` | numeric | YES | 0 |  |  |
| `next_action` | text | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_investors_stage_check`: CHECK ((stage = ANY (ARRAY['cold'::text, 'intro'::text, 'meeting'::text, 'due-diligence'::text, 'term-sheet'::text, 'passed'::text])))
- `cc_investors_type_check`: CHECK ((type = ANY (ARRAY['Angel'::text, 'VC'::text, 'Family Office'::text, 'Grant Body'::text, 'Corporate'::text])))

**Triggers:**
- `cc_investors_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_investors_pkey`

### `cc_invoices` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `client` | text | NO |  |  |  |
| `amount` | numeric | YES | 0 |  |  |
| `due_date` | date | YES |  |  |  |
| `status` | text | YES | 'outstanding'::text |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_invoices_status_check`: CHECK ((status = ANY (ARRAY['outstanding'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))

**Triggers:**
- `cc_invoices_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_invoices_pkey`

### `cc_knowledge` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `type` | text | NO |  |  |  |
| `title` | text | NO |  |  |  |
| `body` | text | YES |  |  |  |
| `owner` | text | YES |  |  |  |
| `category` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_knowledge_type_check`: CHECK ((type = ANY (ARRAY['sop'::text, 'playbook'::text, 'template'::text, 'learning'::text])))

**Triggers:**
- `cc_knowledge_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_knowledge_pkey`

### `cc_leads` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `company` | text | NO |  |  |  |
| `contact` | text | YES |  |  |  |
| `email` | text | YES |  |  |  |
| `value` | numeric | YES | 0 |  |  |
| `stage` | text | YES | 'prospect'::text |  |  |
| `notes` | text | YES |  |  |  |
| `next_action` | text | YES |  |  |  |
| `last_contact` | date | YES | CURRENT_DATE |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_leads_stage_check`: CHECK ((stage = ANY (ARRAY['prospect'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'won'::text, 'lost'::text])))

**Triggers:**
- `cc_leads_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_leads_pkey`

### `cc_okrs` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `owner` | text | NO |  |  |  |
| `objective` | text | NO |  |  |  |
| `key_result` | text | NO |  |  |  |
| `pct` | integer | YES | 0 |  |  |
| `status` | text | YES | 'on-track'::text |  |  |
| `quarter` | text | YES | 'Q2-2026'::text |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_okrs_pct_check`: CHECK (((pct >= 0) AND (pct <= 100)))
- `cc_okrs_status_check`: CHECK ((status = ANY (ARRAY['on-track'::text, 'at-risk'::text, 'off-track'::text])))

**Triggers:**
- `cc_okrs_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_okrs_pkey`

### `cc_partners` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `name` | text | NO |  |  |  |
| `contact` | text | YES |  |  |  |
| `email` | text | YES |  |  |  |
| `type` | text | YES |  |  |  |
| `stage` | text | YES | 'prospect'::text |  |  |
| `value` | text | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_partners_pkey`

### `cc_posts` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `platform` | text | YES |  |  |  |
| `copy` | text | YES |  |  |  |
| `pillar` | text | YES |  |  |  |
| `status` | text | YES | 'draft'::text |  |  |
| `scheduled_date` | date | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_posts_pillar_check`: CHECK ((pillar = ANY (ARRAY['Physical'::text, 'Mental'::text, 'Social'::text, 'Business'::text])))
- `cc_posts_status_check`: CHECK ((status = ANY (ARRAY['draft'::text, 'needs_review'::text, 'approved'::text, 'posted'::text])))

**Triggers:**
- `cc_posts_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_posts_pkey`

### `cc_revenue` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `source` | text | NO |  |  |  |
| `amount` | numeric | YES | 0 |  |  |
| `type` | text | YES | 'recurring'::text |  |  |
| `start_date` | date | YES | CURRENT_DATE |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_revenue_type_check`: CHECK ((type = ANY (ARRAY['recurring'::text, 'one-off'::text, 'grant'::text])))

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_revenue_pkey`

### `cc_sessions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `title` | text | NO |  |  |  |
| `client` | text | YES |  |  |  |
| `session_date` | date | YES |  |  |  |
| `facilitator` | text | YES |  |  |  |
| `outcome` | text | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_sessions_pkey`

### `cc_swot` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `quadrant` | text | NO |  |  |  |
| `item` | text | NO |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_swot_quadrant_check`: CHECK ((quadrant = ANY (ARRAY['s'::text, 'w'::text, 'o'::text, 't'::text])))

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_swot_pkey`

### `cc_tasks` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `title` | text | NO |  |  |  |
| `assignee` | text | YES |  |  |  |
| `priority` | text | YES | 'medium'::text |  |  |
| `due_date` | date | YES |  |  |  |
| `stage` | text | YES | 'todo'::text |  |  |
| `notes` | text | YES |  |  |  |
| `created_by` | text | NO | 'team@vyvehealth.co.uk'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `cc_tasks_priority_check`: CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text])))
- `cc_tasks_stage_check`: CHECK ((stage = ANY (ARRAY['todo'::text, 'in_progress'::text, 'blocked'::text, 'done'::text])))

**Triggers:**
- `cc_tasks_updated_at` — BEFORE UPDATE

**RLS policies:**
- `cc_team_only` (ALL, roles: public) — (auth.email() = 'team@vyvehealth.co.uk'::text) / CHECK: (auth.email() = 'team@vyvehealth.co.uk'::text)

**Indexes:**
- `cc_tasks_pkey`

### `certificates` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `activity_type` | text | NO |  |  |  |
| `milestone_count` | integer | NO |  |  |  |
| `earned_at` | timestamp with time zone | YES | now() |  |  |
| `charity_moment_triggered` | boolean | YES | false |  |  |
| `charity_partner` | text | YES |  |  |  |
| `certificate_url` | text | YES |  |  |  |
| `global_cert_number` | integer | YES |  |  |  |

**Check constraints:**
- `certificates_activity_type_check`: CHECK ((activity_type = ANY (ARRAY['habits'::text, 'workouts'::text, 'cardio'::text, 'checkins'::text, 'sessions'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`certificates_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `certificates_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `certificates_pkey`
- `idx_certificates_earned_at`
- `idx_certificates_member_email`

### `company_summary` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `company` | text | NO |  | ✓ |  |
| `member_count` | integer | NO | 0 |  |  |
| `active_7d` | integer | NO | 0 |  |  |
| `active_30d` | integer | NO | 0 |  |  |
| `avg_engagement_score` | numeric | YES |  |  |  |
| `total_activities` | integer | NO | 0 |  |  |
| `at_risk_count` | integer | NO | 0 |  |  |
| `needs_support_count` | integer | NO | 0 |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |
| `company_slug` | text | YES |  |  |  |
| `activities_30d` | integer | NO | 0 |  |  |

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `company_summary_pkey`
- `idx_company_summary_active_30d`

### `custom_workouts` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `workout_name` | text | NO |  |  |  |
| `exercises` | jsonb | NO | '[]'::jsonb |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`custom_workouts_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `custom_workouts_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `custom_workouts_pkey`

### `daily_habits` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `activity_date` | date | NO |  |  | ✓ |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |
| `notes` | text | YES |  |  |  |
| `habit_id` | uuid | YES |  |  | ✓ |
| `habit_completed` | boolean | NO | true |  |  |

**Check constraints:**
- `daily_habits_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `habit_id` → `habit_library.id` (`daily_habits_habit_id_fkey`)
- `member_email` → `members.email` (`daily_habits_member_email_fkey`)

**Triggers:**
- `auto_time_fields_daily_habits` — BEFORE INSERT
- `counter_daily_habits` — AFTER INSERT
- `enforce_cap_daily_habits` — BEFORE INSERT
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `daily_habits_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `daily_habits_member_habit_date_unique`
- `daily_habits_pkey`
- `idx_daily_habits_email_logged_at`
- `idx_daily_habits_logged_at`

### `employer_members` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `employer_name` | text | NO |  |  | ✓ |
| `department` | text | YES |  |  |  |
| `job_title` | text | YES |  |  |  |
| `enrolled_at` | timestamp with time zone | YES | now() |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`employer_members_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `employer_members_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `employer_members_member_email_employer_name_key`
- `employer_members_pkey`

### `engagement_emails` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `stream` | text | NO |  |  | ✓ |
| `email_key` | text | NO |  |  | ✓ |
| `sent_at` | timestamp with time zone | NO |  |  |  |
| `brevo_message_id` | text | YES |  |  |  |
| `open_count` | integer | YES | 0 |  |  |
| `click_count` | integer | YES | 0 |  |  |
| `suppressed` | boolean | NO | false |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |

**Check constraints:**
- `engagement_emails_stream_check`: CHECK ((stream = ANY (ARRAY['A'::text, 'B'::text, 'C1'::text, 'C2'::text, 'C3'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`engagement_emails_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `engagement_emails_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `engagement_emails_pkey`
- `idx_engagement_emails_member_email`
- `idx_engagement_emails_stream_sent`
- `uq_engagement_email`

### `exercise_logs` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `exercise_name` | text | NO |  |  |  |
| `activity_date` | date | NO | CURRENT_DATE |  |  |
| `sets_completed` | integer | YES |  |  |  |
| `reps_completed` | integer | YES |  |  |  |
| `weight_kg` | numeric | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`exercise_logs_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `exercise_logs_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `exercise_logs_pkey`
- `idx_exercise_logs_member_date`
- `idx_exercise_logs_member_exercise`

### `exercise_notes` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `exercise_name` | text | NO |  |  | ✓ |
| `note` | text | NO | ''::text |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `members can manage own notes` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `exercise_notes_exercise_idx`
- `exercise_notes_pkey`
- `exercise_notes_unique`

### `exercise_swaps` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `original_exercise` | text | NO |  |  | ✓ |
| `replacement_exercise` | text | NO |  |  |  |
| `swapped_at` | timestamp with time zone | YES | now() |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`exercise_swaps_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `exercise_swaps_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `exercise_swaps_member_email_original_exercise_key`
- `exercise_swaps_pkey`

### `habit_library` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `habit_pot` | text | NO |  |  |  |
| `habit_title` | text | NO |  |  |  |
| `habit_description` | text | YES |  |  |  |
| `habit_prompt` | text | NO |  |  |  |
| `difficulty` | text | NO |  |  |  |
| `active` | boolean | NO | true |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |
| `created_by` | text | YES |  |  |  |

**Check constraints:**
- `habit_library_difficulty_check`: CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])))
- `habit_library_habit_pot_check`: CHECK ((habit_pot = ANY (ARRAY['sleep'::text, 'movement'::text, 'nutrition'::text, 'mindfulness'::text, 'social'::text])))

**RLS policies:**
- `habit_library_public_read` (SELECT, roles: public) — true
- `members_delete_own_custom_habits` (DELETE, roles: public) — (created_by = auth.email())
- `members_insert_own_custom_habits` (INSERT, roles: public) — — / CHECK: (created_by = auth.email())
- `members_select_own_custom_habits` (SELECT, roles: public) — (created_by = auth.email())
- `members_update_own_custom_habits` (UPDATE, roles: public) — (created_by = auth.email()) / CHECK: (created_by = auth.email())

**Indexes:**
- `habit_library_created_by_idx`
- `habit_library_pkey`

### `habit_themes` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `theme` | text | NO |  |  |  |
| `display_name` | text | NO |  |  |  |
| `description` | text | YES |  |  |  |
| `active` | boolean | NO | false |  |  |
| `month_label` | text | YES |  |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |

**Check constraints:**
- `habit_themes_theme_check`: CHECK ((theme = ANY (ARRAY['sleep'::text, 'movement'::text, 'nutrition'::text, 'mindfulness'::text, 'social'::text])))

**RLS policies:**
- `habit_themes_public_read` (SELECT, roles: public) — true

**Indexes:**
- `habit_themes_one_active`
- `habit_themes_pkey`

### `kahunas_checkins` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `activity_date` | date | NO |  |  |  |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `iso_week` | integer | NO |  |  |  |
| `iso_year` | integer | NO |  |  |  |
| `score_wellbeing` | integer | YES |  |  |  |
| `score_sleep` | integer | YES |  |  |  |
| `score_energy` | integer | YES |  |  |  |
| `score_stress` | integer | YES |  |  |  |
| `score_physical` | integer | YES |  |  |  |
| `score_diet` | integer | YES |  |  |  |
| `score_social` | integer | YES |  |  |  |
| `score_motivation` | integer | YES |  |  |  |
| `composite_score` | numeric | YES |  |  |  |
| `ai_recommendation` | text | YES |  |  |  |
| `ai_persona` | text | YES |  |  |  |
| `flow_type` | text | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `weekly_checkins_flow_type_check`: CHECK ((flow_type = ANY (ARRAY['active'::text, 'quiet'::text])))
- `weekly_checkins_score_diet_check`: CHECK (((score_diet >= 1) AND (score_diet <= 10)))
- `weekly_checkins_score_energy_check`: CHECK (((score_energy >= 1) AND (score_energy <= 10)))
- `weekly_checkins_score_motivation_check`: CHECK (((score_motivation >= 1) AND (score_motivation <= 10)))
- `weekly_checkins_score_physical_check`: CHECK (((score_physical >= 1) AND (score_physical <= 10)))
- `weekly_checkins_score_sleep_check`: CHECK (((score_sleep >= 1) AND (score_sleep <= 10)))
- `weekly_checkins_score_social_check`: CHECK (((score_social >= 1) AND (score_social <= 10)))
- `weekly_checkins_score_stress_check`: CHECK (((score_stress >= 1) AND (score_stress <= 10)))
- `weekly_checkins_score_wellbeing_check`: CHECK (((score_wellbeing >= 1) AND (score_wellbeing <= 10)))
- `weekly_checkins_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`weekly_checkins_member_email_fkey`)

**Triggers:**
- `auto_iso_week_checkins` — BEFORE INSERT
- `auto_time_fields_checkins` — BEFORE INSERT
- `counter_checkins` — AFTER INSERT
- `enforce_cap_kahunas_checkins` — BEFORE INSERT
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `kahunas_checkins_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `weekly_checkins_pkey`

### `knowledge_base` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `topic` | text | NO |  |  |  |
| `subtopic` | text | YES |  |  |  |
| `content` | text | NO |  |  |  |
| `source` | text | YES |  |  |  |
| `permit_general_advice` | boolean | YES | true |  |  |
| `active` | boolean | YES | true |  |  |
| `last_updated` | timestamp with time zone | YES | now() |  |  |
| `updated_by` | text | YES |  |  |  |

**RLS policies:**
- `knowledge_base_public_read` (SELECT, roles: public) — true

**Indexes:**
- `knowledge_base_pkey`

### `member_activity_daily` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `member_email` | text | NO |  | ✓ |  |
| `activity_date` | date | NO |  | ✓ |  |
| `habits_count` | integer | NO | 0 |  |  |
| `workouts_count` | integer | NO | 0 |  |  |
| `cardio_count` | integer | NO | 0 |  |  |
| `sessions_count` | integer | NO | 0 |  |  |
| `checkins_count` | integer | NO | 0 |  |  |
| `total_activities` | integer | NO | 0 |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |
| `replays_count` | integer | NO | 0 |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `idx_mad_date`
- `idx_mad_email_date`
- `member_activity_daily_pkey`

### `member_activity_log` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `source_table` | text | NO |  |  | ✓ |
| `source_id` | uuid | NO |  |  | ✓ |
| `member_email` | text | YES |  |  |  |
| `activity_type` | text | YES |  |  |  |
| `activity_label` | text | YES |  |  |  |
| `activity_date` | date | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES |  |  |  |
| `metadata` | jsonb | YES |  |  |  |

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `idx_mal_activity_date`
- `idx_mal_activity_type`
- `idx_mal_email_date`
- `idx_mal_email_logged_at`
- `idx_mal_logged_at`
- `member_activity_log_pkey`
- `member_activity_log_source_table_source_id_key`

### `member_habits` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `habit_id` | uuid | NO |  |  | ✓ |
| `assigned_at` | timestamp with time zone | NO | now() |  |  |
| `assigned_by` | text | NO |  |  |  |
| `active` | boolean | NO | true |  |  |

**Check constraints:**
- `member_habits_assigned_by_check`: CHECK ((assigned_by = ANY (ARRAY['onboarding'::text, 'ai'::text, 'theme_update'::text, 'self'::text])))

**Foreign keys:**
- `habit_id` → `habit_library.id` (`member_habits_habit_id_fkey`)
- `member_email` → `members.email` (`member_habits_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `member_habits_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `member_habits_email_idx`
- `member_habits_member_email_habit_id_key`
- `member_habits_pkey`

### `member_notifications` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `type` | text | NO |  |  |  |
| `title` | text | NO |  |  |  |
| `body` | text | NO |  |  |  |
| `read` | boolean | NO | false |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `member own notifications` (ALL, roles: public) — (auth.email() = member_email) / CHECK: (auth.email() = member_email)

**Indexes:**
- `idx_member_notifications_created_at`
- `idx_member_notifications_lookup`
- `idx_member_notifications_member_email`
- `member_notifications_pkey`

### `member_stats` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `member_email` | text | NO |  | ✓ |  |
| `last_activity_at` | timestamp with time zone | YES |  |  |  |
| `last_activity_type` | text | YES |  |  |  |
| `total_activities` | integer | NO | 0 |  |  |
| `activities_7d` | integer | NO | 0 |  |  |
| `activities_30d` | integer | NO | 0 |  |  |
| `activities_90d` | integer | NO | 0 |  |  |
| `active_days_30d` | integer | NO | 0 |  |  |
| `distinct_types_7d` | integer | NO | 0 |  |  |
| `engagement_score` | integer | NO | 50 |  |  |
| `latest_weight_kg` | numeric | YES |  |  |  |
| `latest_weight_at` | timestamp with time zone | YES |  |  |  |
| `latest_wellbeing_score` | integer | YES |  |  |  |
| `latest_wellbeing_at` | timestamp with time zone | YES |  |  |  |
| `current_programme` | text | YES |  |  |  |
| `programme_week` | integer | YES |  |  |  |
| `cert_count` | integer | NO | 0 |  |  |
| `at_risk` | boolean | NO | false |  |  |
| `needs_support` | boolean | NO | false |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |
| `activity_score` | numeric | NO | 0 |  |  |
| `consistency_score` | numeric | NO | 0 |  |  |
| `variety_score` | numeric | NO | 0 |  |  |
| `wellbeing_score_component` | numeric | NO | 0 |  |  |
| `latest_stress_score` | integer | YES |  |  |  |
| `latest_energy_score` | integer | YES |  |  |  |
| `programme_active` | boolean | YES |  |  |  |
| `programme_paused_at` | timestamp with time zone | YES |  |  |  |
| `joined_at` | timestamp with time zone | YES |  |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`member_stats_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `idx_member_stats_at_risk`
- `idx_member_stats_engagement`
- `idx_member_stats_joined_at`
- `idx_member_stats_last_active_at`
- `idx_member_stats_needs_support`
- `member_stats_pkey`

### `members` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `email` | text | NO |  |  | ✓ |
| `first_name` | text | YES |  |  |  |
| `last_name` | text | YES |  |  |  |
| `phone` | text | YES |  |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `persona` | text | YES |  |  |  |
| `persona_reason` | text | YES |  |  |  |
| `persona_assigned_at` | timestamp with time zone | YES |  |  |  |
| `baseline_wellbeing` | integer | YES |  |  |  |
| `baseline_sleep` | integer | YES |  |  |  |
| `baseline_energy` | integer | YES |  |  |  |
| `baseline_stress` | integer | YES |  |  |  |
| `baseline_physical` | integer | YES |  |  |  |
| `baseline_diet` | integer | YES |  |  |  |
| `baseline_social` | integer | YES |  |  |  |
| `baseline_motivation` | integer | YES |  |  |  |
| `training_location` | text | YES |  |  |  |
| `equipment` | text | YES |  |  |  |
| `injuries` | text | YES |  |  |  |
| `exercises_to_avoid` | text | YES |  |  |  |
| `experience_level` | text | YES |  |  |  |
| `training_days_per_week` | integer | YES |  |  |  |
| `sleep_hours` | numeric | YES |  |  |  |
| `sleep_bedtime` | text | YES |  |  |  |
| `sleep_issues` | text | YES |  |  |  |
| `sleep_wants_help` | boolean | YES |  |  |  |
| `activity_level` | text | YES |  |  |  |
| `height_cm` | numeric | YES |  |  |  |
| `weight_kg` | numeric | YES |  |  |  |
| `tdee_maintenance` | integer | YES |  |  |  |
| `tdee_target` | integer | YES |  |  |  |
| `deficit_percentage` | integer | YES |  |  |  |
| `social_barriers` | text | YES |  |  |  |
| `life_context` | text[] | YES |  |  |  |
| `life_context_detail` | text | YES |  |  |  |
| `alcohol_frequency` | text | YES |  |  |  |
| `sensitive_context` | boolean | YES | false |  |  |
| `past_barriers` | text | YES |  |  |  |
| `success_vision` | text | YES |  |  |  |
| `goal_style` | text | YES |  |  |  |
| `reminder_frequency` | text | YES |  |  |  |
| `tone_preference` | text | YES |  |  |  |
| `overwhelm_response` | text | YES |  |  |  |
| `has_smartphone` | boolean | YES |  |  |  |
| `has_smartwatch` | boolean | YES |  |  |  |
| `specific_goal` | text | YES |  |  |  |
| `additional_info` | text | YES |  |  |  |
| `goal_focus` | text | YES |  |  |  |
| `privacy_employer_reporting` | boolean | YES | true |  |  |
| `notifications_milestones` | boolean | YES | true |  |  |
| `notifications_weekly_summary` | boolean | YES | true |  |  |
| `milestone_level` | integer | YES | 0 |  |  |
| `milestone_message` | text | YES |  |  |  |
| `milestone_read` | boolean | YES | true |  |  |
| `cert_habits_count` | integer | YES | 0 |  |  |
| `cert_workouts_count` | integer | YES | 0 |  |  |
| `cert_cardio_count` | integer | YES | 0 |  |  |
| `cert_checkins_count` | integer | YES | 0 |  |  |
| `cert_sessions_count` | integer | YES | 0 |  |  |
| `kahunas_qa_complete` | boolean | YES | false |  |  |
| `kahunas_qa_completed_at` | timestamp with time zone | YES |  |  |  |
| `stripe_customer_id` | text | YES |  |  |  |
| `subscription_status` | text | YES | 'active'::text |  |  |
| `onboarding_complete` | boolean | YES | false |  |  |
| `onboarding_completed_at` | timestamp with time zone | YES |  |  |  |
| `age` | integer | YES |  |  |  |
| `gender` | text | YES |  |  |  |
| `company` | text | YES |  |  |  |
| `company_slug` | text | YES |  |  |  |
| `welcome_rec_1` | text | YES |  |  |  |
| `welcome_rec_2` | text | YES |  |  |  |
| `welcome_rec_3` | text | YES |  |  |  |
| `welcome_persona_reason` | text | YES |  |  |  |
| `contact_preference` | text | YES |  |  |  |
| `support_areas` | text | YES |  |  |  |
| `support_style` | text | YES |  |  |  |
| `motivation_help` | text | YES |  |  |  |
| `persona_switches` | jsonb | YES |  |  |  |
| `re_engagement_stream` | text | YES |  |  |  |
| `last_active_at` | timestamp with time zone | YES |  |  |  |
| `session_duration_preference` | integer | YES |  |  |  |
| `pwa_installed` | boolean | YES | false |  |  |
| `terms_accepted_at` | timestamp with time zone | YES |  |  |  |
| `terms_version` | text | YES |  |  |  |
| `privacy_accepted_at` | timestamp with time zone | YES |  |  |  |
| `health_data_consent` | boolean | YES | false |  |  |
| `health_data_consent_at` | timestamp with time zone | YES |  |  |  |
| `theme_preference` | text | YES |  |  |  |
| `gender_self_describe` | text | YES |  |  |  |
| `tdee_formula` | text | YES |  |  |  |
| `weight_unit` | text | NO | 'kg'::text |  |  |
| `height_unit` | text | NO | 'cm'::text |  |  |
| `training_goals` | text | YES |  |  |  |
| `barriers` | text | YES |  |  |  |
| `sleep_hours_range` | text | YES |  |  |  |
| `sleep_help` | text | YES |  |  |  |
| `social_help` | text | YES |  |  |  |
| `nutrition_guidance` | text | YES |  |  |  |
| `location` | text | YES |  |  |  |
| `dob` | date | YES |  |  |  |
| `exercise_stream` | character varying | YES | 'workouts'::character varying |  |  |

**Check constraints:**
- `members_baseline_diet_check`: CHECK (((baseline_diet >= 1) AND (baseline_diet <= 10)))
- `members_baseline_energy_check`: CHECK (((baseline_energy >= 1) AND (baseline_energy <= 10)))
- `members_baseline_motivation_check`: CHECK (((baseline_motivation >= 1) AND (baseline_motivation <= 10)))
- `members_baseline_physical_check`: CHECK (((baseline_physical >= 1) AND (baseline_physical <= 10)))
- `members_baseline_sleep_check`: CHECK (((baseline_sleep >= 1) AND (baseline_sleep <= 10)))
- `members_baseline_social_check`: CHECK (((baseline_social >= 1) AND (baseline_social <= 10)))
- `members_baseline_stress_check`: CHECK (((baseline_stress >= 1) AND (baseline_stress <= 10)))
- `members_baseline_wellbeing_check`: CHECK (((baseline_wellbeing >= 1) AND (baseline_wellbeing <= 10)))
- `members_exercise_stream_check`: CHECK (((exercise_stream)::text = ANY ((ARRAY['workouts'::character varying, 'movement'::character varying, 'cardio'::character varying])::text[])))
- `members_persona_check`: CHECK ((persona = ANY (ARRAY['NOVA'::text, 'RIVER'::text, 'SPARK'::text, 'SAGE'::text, 'HAVEN'::text])))
- `members_session_duration_preference_check`: CHECK ((session_duration_preference = ANY (ARRAY[20, 30, 45, 60])))
- `members_theme_preference_check`: CHECK ((theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])))

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `members_own_data` (ALL, roles: public) — (email = auth.email()) / CHECK: (email = auth.email())
- `members_select_own` (SELECT, roles: public) — (auth.email() = email)
- `members_update_own` (UPDATE, roles: public) — (auth.email() = email) / CHECK: (auth.email() = email)

**Indexes:**
- `members_email_key`
- `members_pkey`

### `monthly_checkins` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `iso_month` | text | NO |  |  | ✓ |
| `score_wellbeing` | smallint | YES |  |  |  |
| `score_energy` | smallint | YES |  |  |  |
| `score_stress` | smallint | YES |  |  |  |
| `score_physical` | smallint | YES |  |  |  |
| `score_sleep` | smallint | YES |  |  |  |
| `score_diet` | smallint | YES |  |  |  |
| `score_social` | smallint | YES |  |  |  |
| `score_motivation` | smallint | YES |  |  |  |
| `note_wellbeing` | text | YES |  |  |  |
| `note_energy` | text | YES |  |  |  |
| `note_stress` | text | YES |  |  |  |
| `note_physical` | text | YES |  |  |  |
| `note_sleep` | text | YES |  |  |  |
| `note_diet` | text | YES |  |  |  |
| `note_social` | text | YES |  |  |  |
| `note_motivation` | text | YES |  |  |  |
| `avg_score` | numeric | YES |  |  |  |
| `ai_report` | text | YES |  |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |
| `goal_progress_score` | smallint | YES |  |  |  |
| `goal_progress_note` | text | YES |  |  |  |

**Check constraints:**
- `monthly_checkins_goal_progress_score_check`: CHECK (((goal_progress_score >= 1) AND (goal_progress_score <= 10)))
- `monthly_checkins_score_diet_check`: CHECK (((score_diet >= 1) AND (score_diet <= 10)))
- `monthly_checkins_score_energy_check`: CHECK (((score_energy >= 1) AND (score_energy <= 10)))
- `monthly_checkins_score_motivation_check`: CHECK (((score_motivation >= 1) AND (score_motivation <= 10)))
- `monthly_checkins_score_physical_check`: CHECK (((score_physical >= 1) AND (score_physical <= 10)))
- `monthly_checkins_score_sleep_check`: CHECK (((score_sleep >= 1) AND (score_sleep <= 10)))
- `monthly_checkins_score_social_check`: CHECK (((score_social >= 1) AND (score_social <= 10)))
- `monthly_checkins_score_stress_check`: CHECK (((score_stress >= 1) AND (score_stress <= 10)))
- `monthly_checkins_score_wellbeing_check`: CHECK (((score_wellbeing >= 1) AND (score_wellbeing <= 10)))

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `monthly_checkins_member_insert` (INSERT, roles: public) — — / CHECK: (auth.email() = member_email)
- `monthly_checkins_member_select` (SELECT, roles: public) — (auth.email() = member_email)
- `monthly_checkins_member_update` (UPDATE, roles: public) — (auth.email() = member_email) / CHECK: (auth.email() = member_email)

**Indexes:**
- `idx_monthly_checkins_created_at`
- `idx_monthly_checkins_email_created_at`
- `monthly_checkins_iso_month_idx`
- `monthly_checkins_member_email_idx`
- `monthly_checkins_member_email_iso_month_key`
- `monthly_checkins_pkey`

### `nutrition_common_foods` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `food_name` | text | NO |  |  |  |
| `category` | text | YES |  |  |  |
| `brand` | text | YES | 'Whole Food'::text |  |  |
| `calories_kcal` | numeric | NO | 0 |  |  |
| `protein_g` | numeric | NO | 0 |  |  |
| `carbs_g` | numeric | NO | 0 |  |  |
| `fat_g` | numeric | NO | 0 |  |  |
| `fibre_g` | numeric | YES |  |  |  |
| `serving_size_g` | numeric | NO | 100 |  |  |
| `serving_unit` | text | NO | 'g'::text |  |  |
| `search_terms` | text | NO |  |  |  |
| `source` | text | YES | 'usda'::text |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**RLS policies:**
- `nutrition_common_foods_public_read` (SELECT, roles: public) — true

**Indexes:**
- `idx_ncf_search`
- `idx_ncf_trgm`
- `nutrition_common_foods_pkey`

### `nutrition_logs` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `activity_date` | date | NO | CURRENT_DATE |  |  |
| `logged_at` | timestamp with time zone | NO | now() |  |  |
| `meal_type` | text | NO |  |  |  |
| `food_name` | text | NO |  |  |  |
| `brand` | text | YES |  |  |  |
| `barcode` | text | YES |  |  |  |
| `off_id` | text | YES |  |  |  |
| `calories_kcal` | numeric | NO | 0 |  |  |
| `protein_g` | numeric | NO | 0 |  |  |
| `carbs_g` | numeric | NO | 0 |  |  |
| `fat_g` | numeric | NO | 0 |  |  |
| `fibre_g` | numeric | YES |  |  |  |
| `serving_size_g` | numeric | YES |  |  |  |
| `serving_unit` | text | YES |  |  |  |
| `servings` | numeric | NO | 1 |  |  |

**Check constraints:**
- `nutrition_logs_meal_type_check`: CHECK ((meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snacks'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`nutrition_logs_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `nutrition_logs_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_nutrition_logs_email_date`
- `nutrition_logs_pkey`

### `nutrition_my_foods` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `created_at` | timestamp with time zone | NO | now() |  |  |
| `food_name` | text | NO |  |  | ✓ |
| `brand` | text | YES |  |  | ✓ |
| `barcode` | text | YES |  |  |  |
| `off_id` | text | YES |  |  |  |
| `calories_kcal` | numeric | NO | 0 |  |  |
| `protein_g` | numeric | NO | 0 |  |  |
| `carbs_g` | numeric | NO | 0 |  |  |
| `fat_g` | numeric | NO | 0 |  |  |
| `fibre_g` | numeric | YES |  |  |  |
| `serving_size_g` | numeric | YES |  |  |  |
| `serving_unit` | text | YES |  |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`nutrition_my_foods_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `nutrition_my_foods_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_nutrition_my_foods_email`
- `nutrition_my_foods_member_email_food_name_brand_key`
- `nutrition_my_foods_pkey`

### `persona_switches` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `from_persona` | text | YES |  |  |  |
| `to_persona` | text | NO |  |  |  |
| `switched_at` | timestamp with time zone | YES | now() |  |  |
| `reason` | text | YES |  |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`persona_switches_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `persona_switches_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `persona_switches_pkey`

### `personas` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `name` | text | NO |  |  | ✓ |
| `display_name` | text | NO |  |  |  |
| `tagline` | text | NO |  |  |  |
| `description` | text | NO |  |  |  |
| `suitable_for` | text | NO |  |  |  |
| `never_assign_if` | text | YES |  |  |  |
| `system_prompt` | text | NO |  |  |  |
| `active` | boolean | YES | true |  |  |
| `requires_professional_review` | boolean | YES | false |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `updated_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `personas_name_check`: CHECK ((name = ANY (ARRAY['NOVA'::text, 'RIVER'::text, 'SPARK'::text, 'SAGE'::text, 'HAVEN'::text])))

**RLS policies:**
- `personas_public_read` (SELECT, roles: public) — true

**Indexes:**
- `personas_name_key`
- `personas_pkey`

### `platform_alerts` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `severity` | text | NO |  |  |  |
| `type` | text | NO |  |  |  |
| `source` | text | NO |  |  |  |
| `member_email` | text | YES |  |  |  |
| `details` | text | YES |  |  |  |
| `page` | text | YES |  |  |  |
| `user_agent` | text | YES |  |  |  |
| `resolved` | boolean | YES | false |  |  |
| `notified` | boolean | YES | false |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `platform_alerts_severity_check`: CHECK ((severity = ANY (ARRAY['critical'::text, 'high'::text, 'info'::text])))

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `idx_platform_alerts_dedup`
- `idx_platform_alerts_recent`
- `idx_platform_alerts_unresolved`
- `platform_alerts_pkey`

### `platform_metrics_daily` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `metric_date` | date | NO |  | ✓ |  |
| `new_members` | integer | NO | 0 |  |  |
| `active_users` | integer | NO | 0 |  |  |
| `total_activities` | integer | NO | 0 |  |  |
| `ai_interactions` | integer | NO | 0 |  |  |
| `emails_sent` | integer | NO | 0 |  |  |
| `emails_opened` | integer | NO | 0 |  |  |
| `certificates_earned` | integer | NO | 0 |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |
| `total_members` | integer | NO | 0 |  |  |
| `active_users_7d` | integer | NO | 0 |  |  |
| `active_users_30d` | integer | NO | 0 |  |  |
| `habits_count` | integer | NO | 0 |  |  |
| `workouts_count` | integer | NO | 0 |  |  |
| `cardio_count` | integer | NO | 0 |  |  |
| `sessions_count` | integer | NO | 0 |  |  |
| `checkins_count` | integer | NO | 0 |  |  |
| `unresolved_alerts` | integer | NO | 0 |  |  |

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `idx_pmd_date`
- `platform_metrics_daily_pkey`

### `programme_library` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `programme_name` | text | NO |  |  |  |
| `description` | text | YES |  |  |  |
| `category` | text | NO |  |  |  |
| `difficulty` | text | NO |  |  |  |
| `equipment` | text | NO |  |  |  |
| `days_per_week` | integer | NO |  |  |  |
| `duration_weeks` | integer | NO |  |  |  |
| `sessions_per_week` | integer | NO |  |  |  |
| `programme_json` | jsonb | NO |  |  |  |
| `tags` | text[] | YES |  |  |  |
| `preview_sessions` | jsonb | YES |  |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `is_active` | boolean | YES | true |  |  |
| `sort_order` | integer | YES | 0 |  |  |

**RLS policies:**
- `Anyone can read active library programmes` (SELECT, roles: public) — (is_active = true)

**Indexes:**
- `idx_programme_library_active`
- `idx_programme_library_category`
- `programme_library_pkey`

### `push_subscriptions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `endpoint` | text | NO |  |  | ✓ |
| `p256dh` | text | NO |  |  |  |
| `auth_key` | text | NO |  |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `member own push subscriptions` (ALL, roles: public) — (auth.email() = member_email) / CHECK: (auth.email() = member_email)

**Indexes:**
- `idx_push_subscriptions_member_email`
- `push_subscriptions_member_email_endpoint_key`
- `push_subscriptions_pkey`

### `push_subscriptions_native` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `token` | text | NO |  |  |  |
| `platform` | text | NO |  |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |
| `updated_at` | timestamp with time zone | NO | now() |  |  |

**Check constraints:**
- `push_subscriptions_native_platform_check`: CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`push_subscriptions_native_member_email_fkey`)

**Triggers:**
- `push_subscriptions_native_updated_at` — BEFORE UPDATE
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `member can manage own native push token` (ALL, roles: public) — (auth.email() = member_email) / CHECK: (auth.email() = member_email)

**Indexes:**
- `push_subscriptions_native_member_platform_idx`
- `push_subscriptions_native_pkey`

### `qa_submissions` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `submitted_at` | timestamp with time zone | YES | now() |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`qa_submissions_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `qa_submissions_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `qa_submissions_pkey`

### `replay_views` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `activity_date` | date | NO |  |  | ✓ |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `session_number` | integer | NO | 1 |  | ✓ |
| `category` | text | NO |  |  | ✓ |
| `session_name` | text | YES |  |  |  |
| `youtube_url` | text | YES |  |  |  |
| `minutes_watched` | numeric | YES | 0 |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `replay_views_session_number_check`: CHECK ((session_number = ANY (ARRAY[1, 2])))
- `replay_views_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`replay_views_member_email_fkey`)

**Triggers:**
- `auto_time_fields_replay_views` — BEFORE INSERT
- `replay_views_cert_count_trigger` — AFTER DELETE/INSERT/UPDATE
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `replay_views_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_replay_views_email_logged_at`
- `idx_replay_views_logged_at`
- `replay_views_dedupe`
- `replay_views_member_email_activity_date_category_session_nu_key`
- `replay_views_pkey`

### `running_plan_cache` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `cache_key` | text | NO |  |  | ✓ |
| `goal` | text | NO |  |  |  |
| `level` | text | NO |  |  |  |
| `days_per_week` | integer | NO |  |  |  |
| `timeframe_weeks` | integer | NO |  |  |  |
| `long_run_day` | text | YES |  |  |  |
| `plan_json` | jsonb | NO |  |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `last_used_at` | timestamp with time zone | YES | now() |  |  |
| `use_count` | integer | YES | 1 |  |  |

**RLS policies:**
- `running_plan_cache_public_insert` (INSERT, roles: public) — — / CHECK: true
- `running_plan_cache_public_read` (SELECT, roles: public) — true
- `running_plan_cache_public_update` (UPDATE, roles: public) — true / CHECK: true

**Indexes:**
- `plan_cache_cache_key_key`
- `plan_cache_pkey`

### `service_catalogue` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `type` | text | NO |  |  |  |
| `category` | text | NO |  |  |  |
| `name` | text | NO |  |  |  |
| `description` | text | YES |  |  |  |
| `youtube_url` | text | YES |  |  |  |
| `riverside_url` | text | YES |  |  |  |
| `duration_minutes` | integer | YES |  |  |  |
| `schedule_day` | text | YES |  |  |  |
| `schedule_time` | text | YES |  |  |  |
| `difficulty` | text | YES |  |  |  |
| `active` | boolean | YES | true |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `service_catalogue_type_check`: CHECK ((type = ANY (ARRAY['live_session'::text, 'replay'::text, 'workout_plan'::text, 'running_plan'::text])))

**RLS policies:**
- `service_catalogue_public_read` (SELECT, roles: public) — true

**Indexes:**
- `service_catalogue_pkey`

### `session_chat` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | bigint | NO | nextval('session_chat_id_seq'::regclass) | ✓ |  |
| `session_type` | text | NO |  |  |  |
| `member_email` | text | NO |  |  |  |
| `display_name` | text | NO |  |  |  |
| `message` | text | NO |  |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `members can insert chat` (INSERT, roles: public) — — / CHECK: (auth.email() = member_email)
- `session_chat_authenticated_read` (SELECT, roles: public) — (auth.role() = 'authenticated'::text)

**Indexes:**
- `session_chat_pkey`
- `session_chat_type_created_idx`

### `session_views` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `activity_date` | date | NO |  |  | ✓ |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `session_number` | integer | NO | 1 |  | ✓ |
| `category` | text | NO |  |  | ✓ |
| `session_name` | text | YES |  |  |  |
| `youtube_url` | text | YES |  |  |  |
| `minutes_watched` | numeric | YES | 0 |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `session_views_session_number_check`: CHECK ((session_number = ANY (ARRAY[1, 2])))
- `session_views_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`session_views_member_email_fkey`)

**Triggers:**
- `auto_time_fields_session_views` — BEFORE INSERT
- `counter_sessions` — AFTER INSERT
- `enforce_cap_session_views` — BEFORE INSERT
- `session_views_cert_count_trigger` — AFTER DELETE/INSERT/UPDATE
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `session_views_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_session_views_email_logged_at`
- `idx_session_views_logged_at`
- `session_views_dedupe`
- `session_views_member_email_activity_date_category_session_n_key`
- `session_views_pkey`

### `shared_workouts` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | text | NO |  | ✓ |  |
| `shared_by` | text | NO |  |  |  |
| `session_data` | jsonb | NO |  |  |  |
| `full_programme_json` | jsonb | YES |  |  |  |
| `programme_duration_weeks` | integer | YES |  |  |  |
| `discount_code` | text | NO | 'VYVE10'::text |  |  |
| `views` | integer | YES | 0 |  |  |
| `signups` | integer | YES | 0 |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `expires_at` | timestamp with time zone | YES | (now() + '7 days'::interval) |  |  |
| `share_code` | text | YES |  |  |  |

**Foreign keys:**
- `shared_by` → `members.email` (`shared_workouts_shared_by_fkey`)

**RLS policies:**
- `Members can insert own shares` (INSERT, roles: public) — — / CHECK: (shared_by = auth.email())
- `Members can view own shares` (SELECT, roles: public) — (shared_by = auth.email())

**Indexes:**
- `idx_shared_workouts_id`
- `idx_shared_workouts_share_code`
- `idx_shared_workouts_shared_by`
- `shared_workouts_pkey`

### `vyve_job_runs` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `job_name` | text | NO |  | ✓ |  |
| `last_run_at` | timestamp with time zone | NO | now() |  |  |
| `rows_processed` | integer | YES |  |  |  |
| `notes` | text | YES |  |  |  |

**RLS policies:** _(none — service-role only)_

**Indexes:**
- `vyve_job_runs_pkey`

### `weekly_goals` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | bigint | NO | nextval('weekly_goals_id_seq'::regclass) | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `week_start` | date | NO |  |  | ✓ |
| `habits_target` | integer | NO | 3 |  |  |
| `workouts_target` | integer | NO | 2 |  |  |
| `cardio_target` | integer | NO | 1 |  |  |
| `sessions_target` | integer | NO | 1 |  |  |
| `checkin_target` | integer | NO | 1 |  |  |
| `created_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `weekly_goals_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `weekly_goals_member_email_week_start_key`
- `weekly_goals_pkey`

### `weekly_scores` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `iso_week` | integer | NO |  |  | ✓ |
| `iso_year` | integer | NO |  |  | ✓ |
| `activity_date` | date | YES |  |  |  |
| `wellbeing_score` | integer | YES |  |  |  |
| `engagement_score` | integer | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `weekly_scores_engagement_score_check`: CHECK (((engagement_score >= 0) AND (engagement_score <= 100)))
- `weekly_scores_wellbeing_score_check`: CHECK (((wellbeing_score >= 1) AND (wellbeing_score <= 10)))

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `weekly_scores_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `weekly_scores_member_email_iso_week_iso_year_key`
- `weekly_scores_member_week_unique`
- `weekly_scores_pkey`

### `weight_logs` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `logged_date` | date | NO |  |  | ✓ |
| `weight_kg` | numeric | NO |  |  |  |
| `logged_at` | timestamp with time zone | NO | now() |  |  |

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `weight_logs_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `weight_logs_logged_date_idx`
- `weight_logs_member_date_unique`
- `weight_logs_member_email_idx`
- `weight_logs_pkey`

### `wellbeing_checkins` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `activity_date` | date | NO |  |  |  |
| `day_of_week` | text | YES |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `iso_week` | integer | YES |  |  | ✓ |
| `iso_year` | integer | YES |  |  | ✓ |
| `score_wellbeing` | integer | YES |  |  |  |
| `score_sleep` | integer | YES |  |  |  |
| `score_energy` | integer | YES |  |  |  |
| `score_stress` | integer | YES |  |  |  |
| `score_physical` | integer | YES |  |  |  |
| `score_diet` | integer | YES |  |  |  |
| `score_social` | integer | YES |  |  |  |
| `score_motivation` | integer | YES |  |  |  |
| `composite_score` | numeric | YES |  |  |  |
| `ai_recommendation` | text | YES |  |  |  |
| `ai_persona` | text | YES |  |  |  |
| `flow_type` | text | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |
| `engagement_score` | integer | YES |  |  |  |

**Check constraints:**
- `wellbeing_checkins_flow_type_check`: CHECK ((flow_type = ANY (ARRAY['active'::text, 'quiet'::text])))
- `wellbeing_checkins_score_diet_check`: CHECK (((score_diet IS NULL) OR ((score_diet >= 1) AND (score_diet <= 10))))
- `wellbeing_checkins_score_energy_check`: CHECK (((score_energy IS NULL) OR ((score_energy >= 1) AND (score_energy <= 10))))
- `wellbeing_checkins_score_motivation_check`: CHECK (((score_motivation IS NULL) OR ((score_motivation >= 1) AND (score_motivation <= 10))))
- `wellbeing_checkins_score_physical_check`: CHECK (((score_physical IS NULL) OR ((score_physical >= 1) AND (score_physical <= 10))))
- `wellbeing_checkins_score_sleep_check`: CHECK (((score_sleep IS NULL) OR ((score_sleep >= 1) AND (score_sleep <= 10))))
- `wellbeing_checkins_score_social_check`: CHECK (((score_social IS NULL) OR ((score_social >= 1) AND (score_social <= 10))))
- `wellbeing_checkins_score_stress_check`: CHECK (((score_stress IS NULL) OR ((score_stress >= 1) AND (score_stress <= 10))))
- `wellbeing_checkins_score_wellbeing_check`: CHECK (((score_wellbeing >= 1) AND (score_wellbeing <= 10)))
- `wellbeing_checkins_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`wellbeing_checkins_member_email_fkey`)

**Triggers:**
- `auto_iso_week_wellbeing_checkins` — BEFORE INSERT
- `auto_time_fields_wellbeing_checkins` — BEFORE INSERT
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `wellbeing_checkins_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_wellbeing_checkins_email_logged_at`
- `idx_wellbeing_checkins_logged_at`
- `idx_wellbeing_checkins_member_email`
- `wellbeing_checkins_member_week_unique`
- `wellbeing_checkins_pkey`

### `workout_plan_cache` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  | ✓ |
| `programme_json` | jsonb | NO |  |  |  |
| `plan_duration_weeks` | integer | NO |  |  |  |
| `current_week` | integer | NO | 1 |  |  |
| `current_session` | integer | NO | 1 |  |  |
| `generated_at` | timestamp with time zone | YES | now() |  |  |
| `is_active` | boolean | YES | true |  |  |
| `paused_at` | timestamp with time zone | YES |  |  |  |
| `source` | text | YES | 'onboarding'::text |  |  |
| `source_id` | text | YES |  |  |  |

**Foreign keys:**
- `member_email` → `members.email` (`workout_plan_cache_member_email_fkey`)

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE

**RLS policies:**
- `workout_plan_cache_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_wpc_active`
- `workout_plan_cache_member_email_key`
- `workout_plan_cache_one_active_per_member`
- `workout_plan_cache_pkey`

### `workout_plans` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `plan_name` | text | NO |  |  |  |
| `plan_type` | text | NO |  |  | ✓ |
| `day_name` | text | NO |  |  | ✓ |
| `day_number` | integer | NO |  |  |  |
| `exercise_order` | integer | NO |  |  | ✓ |
| `exercise_name` | text | NO |  |  |  |
| `sets` | text | YES |  |  |  |
| `reps` | text | YES |  |  |  |
| `tempo` | text | YES |  |  |  |
| `rest_seconds` | integer | YES |  |  |  |
| `notes` | text | YES |  |  |  |
| `video_url` | text | YES |  |  |  |
| `equipment_needed` | text | YES |  |  |  |
| `muscle_group` | text | YES |  |  |  |
| `difficulty` | text | YES |  |  |  |
| `active` | boolean | YES | true |  |  |
| `created_at` | timestamp with time zone | YES | now() |  |  |
| `thumbnail_url` | text | YES |  |  |  |

**Check constraints:**
- `workout_plans_difficulty_check`: CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all_levels'::text])))
- `workout_plans_plan_type_check`: CHECK ((plan_type = ANY (ARRAY['PPL'::text, 'Upper_Lower'::text, 'Full_Body'::text, 'Home'::text, 'Movement_Wellbeing'::text])))

**RLS policies:**
- `workout_plans_public_read` (SELECT, roles: public) — true

**Indexes:**
- `workout_plans_pkey`
- `workout_plans_plan_type_day_name_exercise_order_key`

### `workouts` · RLS

| Column | Type | Nullable | Default | PK | Unique |
|---|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | ✓ |  |
| `member_email` | text | NO |  |  |  |
| `activity_date` | date | NO |  |  |  |
| `day_of_week` | text | NO |  |  |  |
| `time_of_day` | text | YES |  |  |  |
| `session_number` | integer | NO | 1 |  |  |
| `plan_name` | text | YES |  |  |  |
| `workout_name` | text | YES |  |  |  |
| `duration_minutes` | integer | YES |  |  |  |
| `logged_at` | timestamp with time zone | YES | now() |  |  |

**Check constraints:**
- `workouts_session_number_check`: CHECK ((session_number = ANY (ARRAY[1, 2])))
- `workouts_time_of_day_check`: CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])))

**Foreign keys:**
- `member_email` → `members.email` (`workouts_member_email_fkey`)

**Triggers:**
- `auto_time_fields_workouts` — BEFORE INSERT
- `counter_workouts` — AFTER INSERT
- `enforce_cap_workouts` — BEFORE INSERT
- `zz_lc_email` — BEFORE INSERT/UPDATE
- `zz_sync_activity_log` — AFTER DELETE/INSERT/UPDATE

**RLS policies:**
- `workouts_own_data` (ALL, roles: public) — (member_email = auth.email()) / CHECK: (member_email = auth.email())

**Indexes:**
- `idx_workouts_email_logged_at`
- `idx_workouts_logged_at`
- `idx_workouts_member_email`
- `workouts_pkey`

---

## Public Functions (32)

- `backfill_platform_metrics(p_days integer)` — func
- `bump_member_activity(p_email text, p_type text, p_date date, p_at timestamp with time zone)` — func
- `cap_cardio()` — func
- `cap_daily_habits()` — func
- `cap_kahunas_checkins()` — func
- `cap_session_views()` — func
- `cap_workouts()` — func
- `compute_engagement_components(p_last_activity_at timestamp with time zone, p_active_days_30d integer, p_distinct_types_7d integer, p_latest_wellbeing integer)` — func
- `compute_engagement_score(p_last_activity_at timestamp with time zone, p_active_days_30d integer, p_distinct_types_7d integer, p_latest_wellbeing integer)` — func
- `get_capped_activity_count(p_email text, p_activity_type text)` — func
- `get_charity_total()` — func
- `increment_cardio_counter()` — func
- `increment_checkin_counter()` — func
- `increment_habit_counter()` — func
- `increment_session_counter()` — func
- `increment_workout_counter()` — func
- `member_age(birth_date date)` — func
- `next_certificate_number()` — func
- `rebuild_member_activity_daily()` — func
- `rebuild_member_activity_daily_incremental()` — func
- `recompute_all_member_stats()` — func
- `recompute_company_summary()` — func
- `recompute_member_stats(p_email text)` — func
- `recompute_platform_metrics(p_date date)` — func
- `set_activity_time_fields()` — func
- `set_checkin_iso_week()` — func
- `update_cc_updated_at()` — func
- `update_cert_sessions_count()` — func
- `update_push_native_updated_at()` — func
- `vyve_lc_email()` — func
- `vyve_refresh_daily(p_email text, p_date date)` — func
- `vyve_sync_activity_log()` — func

---

## Cron Jobs (13)

| Job | Schedule | Active | Command preview |
|---|---|---|---|
| `habit-reminder-daily` | `0 20 * * *` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `monthly-report` | `15 8 1 * *` | ✓ | `SELECT net.http_post(url:='https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1` |
| `streak-reminder-daily` | `0 18 * * *` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `vyve_platform_metrics` | `15 2 * * *` | ✓ | `SELECT public.recompute_platform_metrics();` |
| `vyve_rebuild_mad_incremental` | `*/30 * * * *` | ✓ | `SELECT public.rebuild_member_activity_daily_incremental();` |
| `vyve_recompute_company_summary` | `0 2 * * *` | ✓ | `SELECT public.recompute_company_summary();` |
| `vyve_recompute_member_stats` | `*/15 * * * *` | ✓ | `SELECT public.recompute_all_member_stats();` |
| `vyve_schema_snapshot` | `0 3 * * 0` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `vyve-certificate-checker` | `0 9 * * *` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `vyve-daily-report` | `5 8 * * *` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `vyve-reengagement-daily` | `0 8 * * *` | ✓ | ` SELECT net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `warm-ping-every-5min` | `*/5 * * * *` | ✓ | ` select net.http_post( url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/function` |
| `weekly-report` | `10 8 * * 1` | ✓ | `SELECT net.http_post(url:='https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1` |

---

*Generated by `schema-snapshot-refresh` Edge Function.*
