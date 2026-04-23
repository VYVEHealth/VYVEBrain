# HealthKit + Health Connect — Build Plan

> **Status:** Mapped 23 April 2026. iOS-first strategy locked in; Android deferred until test device acquired.
> **Target:** iOS live on App Store by mid-to-late May 2026. Android follows as separate mini-project.
> **Owner:** Dean (technical build), Lewis (privacy-policy copy sign-off before submission).

---

## Scope decisions (locked 23 April 2026)

| Decision | Value | Rationale |
|---|---|---|
| Read/write scope | **Reads + writes workouts and weight. No write for cardio.** | Accuracy for cardio (distance, calories) can't be defended to Apple review if we only know duration. Workouts and weight are member-confirmed numbers, safe to write back. |
| Data types v1 | **All 7: workouts, steps, heart rate, weight, active energy, sleep, distance** | Ship once, request once. Fallback plan in risks section if Apple rejects on scope breadth. |
| Platforms v1 | **iOS only** | Dean has iPhone + Apple Watch, no Android device. Android becomes a 4-session follow-up once device acquired. |
| Plugin | **`@capgo/capacitor-health`** (MIT, actively maintained, unified HealthKit + Health Connect API) | Only free unified plugin with modern Health Connect support (not deprecated Google Fit). One TS API, two native backends. Perfect for our Capacitor wrap. |
| Background delivery on iOS | **Deferred to v2** | `HKObserverQuery` with `HKBackgroundDelivery` requires Swift-level Capacitor plugin extension — out of scope. Foreground-plus-periodic sync is sufficient MVP. |

---

## Architecture

```
Member taps "Connect health data" in Settings → permission sheet (iOS)
                        │
Member logs weight on nutrition.html ─────┐
Member completes workout on workouts.html ┤
                                          │
                        ▼                 ▼
┌───────────────────────────────────────────────────────────┐
│ Capacitor WebView — healthbridge.js                       │
│ • pullFromHealthStore()   [read path]                     │
│ • pushWeightToHealthStore(kg, at)   [write path]          │
│ • pushWorkoutToHealthStore({type,start,end,energy?})      │
│ Every write records a ledger entry → server knows to      │
│ suppress read-back on next sync (dedup-on-write)          │
└──────────────────┬────────────────────────────────────────┘
                   │ JWT-authed POST batches
                   ▼
┌───────────────────────────────────────────────────────────┐
│ EF: sync-health-data v1                                   │
│ • read-path: samples → member_health_samples → promote    │
│ • write-path: VYVE activity → ledger queue →              │
│   client flushes queue to native store → confirms uuid    │
│ • dedup: ignore samples whose native_uuid is in the       │
│   write-ledger (prevents reading our own writes back)     │
└──────────────────┬────────────────────────────────────────┘
                   ▼
         member_health_samples
         member_health_connections
         member_health_write_ledger
```

### Why this shape

- **All health-store queries happen client-side in the WebView** (plugin runs native, bridges to JS). Health data goes device → native plugin → JSON → Supabase over TLS. HealthKit never leaves the device to a third party the user didn't authorise.
- **EF never touches HealthKit directly** — only receives de-duplicated JSON batches. Keeps the native attack surface tiny.
- **Raw samples land in `member_health_samples` before promotion** to `workouts`/`cardio`/`weight_logs`. Gives us (a) dedup keyed on platform-native UUID, (b) audit trail for GDPR export, (c) ability to re-run promotion logic without re-pulling from device.
- **Existing cap triggers reused** — `enforce_cap_workouts`, `enforce_cap_cardio` route over-cap to `activity_dedupe` automatically (Hard Rule 34).
- **Write-ledger breaks the shadow-read bug** — without it: VYVE writes workout → HealthKit → next sync pulls it back → we promote → duplicate.

---

## Data model (new tables)

```sql
-- Raw samples from device health store. One row per (source, native_uuid).
create table public.member_health_samples (
  id           uuid primary key default gen_random_uuid(),
  member_email text not null,
  source       text not null check (source in ('healthkit','health_connect')),
  sample_type  text not null,    -- 'workout'|'steps'|'heart_rate'|'weight'|'active_energy'|'sleep'|'distance'
  native_uuid  text not null,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  value        numeric,
  unit         text,
  workout_type text,
  metadata     jsonb not null default '{}'::jsonb,
  app_source   text,              -- 'Apple Watch' | 'Strava' | 'Garmin Connect' | 'Manual'
  ingested_at  timestamptz not null default now(),
  promoted_to  text,              -- 'workouts' | 'cardio' | 'weight_logs' | null
  promoted_id  uuid,
  unique (member_email, source, native_uuid)
);
create index on member_health_samples (member_email, start_at desc);
create index on member_health_samples (member_email, sample_type, start_at desc);
alter table member_health_samples enable row level security;
create policy hs_self on member_health_samples
  for select using (auth.email() = member_email);

-- Per-member connection state. One row per platform connected.
create table public.member_health_connections (
  member_email     text not null,
  platform         text not null check (platform in ('healthkit','health_connect')),
  granted_scopes   text[] not null default '{}',
  connected_at     timestamptz not null default now(),
  last_sync_at     timestamptz,
  last_sync_status text,
  total_synced     int not null default 0,
  revoked_at       timestamptz,
  primary key (member_email, platform)
);
alter table member_health_connections enable row level security;
create policy hc_self on member_health_connections
  for select using (auth.email() = member_email);

-- Tracks writes from VYVE → health store. Prevents reading our own writes back.
create table public.member_health_write_ledger (
  id                uuid primary key default gen_random_uuid(),
  member_email      text not null,
  platform          text not null check (platform in ('healthkit','health_connect')),
  vyve_source_table text not null,    -- 'workouts' | 'weight_logs'
  vyve_source_id    uuid not null,
  native_uuid       text,              -- populated after client confirms write
  write_status      text not null default 'queued' check (write_status in ('queued','confirmed','failed')),
  queued_at         timestamptz not null default now(),
  confirmed_at      timestamptz,
  error_message     text,
  unique (platform, vyve_source_table, vyve_source_id)
);
create index on member_health_write_ledger (member_email, write_status, queued_at);
alter table member_health_write_ledger enable row level security;
create policy hwl_self on member_health_write_ledger
  for select using (auth.email() = member_email);

-- Auto-queue write-backs when VYVE activity lands
create or replace function queue_health_write_back() returns trigger as $$
begin
  insert into member_health_write_ledger (member_email, platform, vyve_source_table, vyve_source_id)
  select new.member_email, platform, tg_table_name, new.id
  from member_health_connections
  where member_email = new.member_email and revoked_at is null
    and 'write' = any(granted_scopes);  -- only queue if write scope granted
  return new;
end; $$ language plpgsql security definer;

create trigger queue_health_write_back_workouts
  after insert on workouts for each row execute function queue_health_write_back();
create trigger queue_health_write_back_weight
  after insert on weight_logs for each row execute function queue_health_write_back();
```

### Promotion rules (applied inside EF after dedup)

| Sample type | Destination | Notes |
|---|---|---|
| `workout` with strength type (FunctionalStrengthTraining, TraditionalStrengthTraining, MixedCardio when under 15 min, etc.) | `workouts` | Cap trigger handles 2/day |
| `workout` with cardio type (Running, Cycling, Walking, Hiking, Rowing, Swimming, HIIT) | `cardio` | Cap trigger handles 2/day |
| `weight` | `weight_logs` | Upsert on `(member_email, logged_on)` |
| `steps`, `heart_rate`, `active_energy`, `sleep`, `distance` | No promotion | Stored raw for future Wearable Insights panel |

---

## Edge Function: `sync-health-data` v1

Contract:
```
POST /functions/v1/sync-health-data
Authorization: Bearer <supabase user JWT>

{
  "action": "pull_samples" | "confirm_write" | "mark_revoked",
  "platform": "healthkit",
  "granted_scopes": ["steps","workouts","heart_rate","weight","active_energy","sleep","distance","write_workouts","write_weight"],
  "samples": [{ native_uuid, sample_type, start_at, end_at, value, unit, workout_type?, app_source, metadata }],
  "client_last_sync_at": "2026-04-22T19:00:00Z",

  // For confirm_write action:
  "ledger_id": "uuid",
  "native_uuid": "uuid-from-healthkit"
}

Response (pull_samples):
{ "ok": true, "inserted_raw": 17, "promoted": { "workouts": 1, "cardio": 4, "weight_logs": 1, "skipped_cap": 0 },
  "pending_writes": [{ "ledger_id": "...", "vyve_source_table": "workouts", "payload": {...} }],
  "server_last_sync_at": "..." }
```

### Guardrails
- `verify_jwt: false` (VYVE pattern, Rule 21). Internal JWT validation via `supabase.auth.getUser()`.
- CORS restricted to `online.vyvehealth.co.uk`.
- Batch cap: 500 samples per call. Client chunks if more.
- Reject samples older than 60 days. Reject outliers (steps > 200k/day, workout > 12h, weight < 20kg or > 400kg) — log to `platform_alerts`.
- Filter samples where `native_uuid` matches a confirmed write-ledger entry for this member — prevents shadow-read duplication.
- EF never returns actual health data — only counts + pending write instructions. Keeps GDPR surface clean.

---

## Client orchestrator: `healthbridge.js`

New ~350-line module, loaded on `index.html`, `settings.html`, `nutrition.html`, `workouts.html`.

### Responsibilities

1. **Platform detection** via `Capacitor.getPlatform()` → `'ios' | 'android' | 'web'`. No-op on web; Settings shows "Only available in the VYVE app".
2. **Connection state** from `member-dashboard` v50+ (new `health_connections` block). Cached in `localStorage['vyve_health_state']` with 10-min TTL.
3. **Permission request** via `CapacitorHealth.requestAuthorization({ read: [...], write: [...] })`. User-gesture required.
4. **Sync runner:**
   - On app foreground → if `last_sync_at > 60 min ago`, queue sync
   - On Settings "Sync now" tap → immediate sync
   - After any write action (workout logged, weight logged) → flush write-ledger queue
5. **Write-back methods:**
   - `pushWeightToHealthStore(weightLogId)` — fetches row, writes to HK, confirms via EF with native UUID
   - `pushWorkoutToHealthStore(workoutId)` — same pattern, maps VYVE workout plan type → HKWorkoutActivityType
6. **Error surfacing** — on permission denial, sync error, Health Connect not installed → inline error with remediation steps.

### What it does NOT do
- No direct Supabase writes. Everything via `sync-health-data` EF.
- No sample dedup client-side beyond `since last_sync_at`. Server is SoT.
- No UI rendering of raw samples. That's a future insights panel.

---

## Native plugin config

### iOS (`ios/App/App/Info.plist`)

```xml
<key>NSHealthShareUsageDescription</key>
<string>VYVE reads your workouts, steps, active energy, heart rate, weight, sleep, and distance from Apple Health so your Apple Watch activity counts automatically toward your VYVE certificates (The Warrior, The Relentless, The Architect) — no manual logging needed. Your health data is never used for advertising and is never shared with third parties beyond the secure storage required to run your VYVE account.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>VYVE writes the weight you log in the app, and the workouts you complete in VYVE, back to Apple Health so your data stays in sync with your other health and fitness apps.</string>
```

### Xcode Signing & Capabilities
- Add **HealthKit** capability (checkbox)
- **Clinical Health Records:** OFF
- **Background Delivery:** OFF (v2 feature)
- App ID in Apple Developer portal must have HealthKit entitlement enabled

### Android (deferred)
Manifest and rationale activity documented separately once device acquired. Preserved in plan for future.

---

## Privacy policy update (required by Apple guideline 5.1.1i + Google)

New section in `www.vyvehealth.co.uk/privacy.html`:
- What we read (list all 7 data types)
- Why we read it (automatic activity logging, certificate progress)
- Where it goes (Supabase EU, never shared with advertisers — guideline 5.1.3 defence)
- How to revoke (iOS Settings → Health → Data Access, per-app toggle)
- Retention: deleted on account deletion, exportable via Article 20 tool (on backlog)

### App Store Connect — App Privacy questionnaire
- Data type: **Health & Fitness** (Health data + Fitness data)
- Purpose: **App Functionality**
- Linked to user: **Yes**
- Used for tracking: **No** (guideline 5.1.3 must)

---

## Per-session breakdown

| # | Session | Pre-req | Deliverables | Member-visible? |
|---|---|---|---|---|
| 1 | **DB + EF foundation** | None | 3 migrations (`member_health_samples`, `member_health_connections`, `member_health_write_ledger`), queue_health_write_back trigger, `sync-health-data` EF v1 ACTIVE, 3-layer smoketest with synthetic data | No |
| 2 | **iOS plugin + native capability** | HealthKit entitlement confirmed on Apple Developer portal | `npm i @capgo/capacitor-health`, `npx cap sync ios`, Info.plist keys, HealthKit capability in Xcode, test build on Dean's iPhone: permission sheet renders, read samples, write test workout, verify in Health app | Dev build only |
| 3 | **healthbridge.js + Settings UI + iOS read path** | Session 2 complete | `healthbridge.js` with platform detection + permission + sync runner + error surfacing; Settings "Connect health data" section with toggle, last-sync, manual "Sync now"; `member-dashboard` v50 with `health_connections` block; Apple Watch workout appears on workouts.html/cardio.html | Dev build only |
| 4 | **Write-path + dedup ledger validation** | Session 3 complete | `pushWeightToHealthStore` + `pushWorkoutToHealthStore`, trigger-queued writes flushed on next sync, ledger-filter prevents duplicate promotion on read-back, round-trip tested | Dev build only |
| 5 | **Privacy page + submission prep** | Session 4 complete, Lewis reviews privacy copy | `privacy.html` updated with HealthKit section, App Privacy questionnaire filled in App Store Connect, Health & Fitness declaration set, Build 3 submitted to App Store | In review |
| 6 | **Apple review response + launch** | Apple review (3–7 days calendar) | Reply to any Apple question, hotfix if rejected, production cutover | **iOS LIVE** |
| — | *Android: plugin + Manifest + Settings UI* | Android device acquired | 4-session follow-up mini-project | |
| — | *Android: write-path + Play Store + Health Connect audit* | | (Google Health Connect audit: 1–2 weeks) | **Android LIVE** |

**Total iOS: 6 sessions.** Calendar time ~2 weeks including Apple review.
**Total Android (later): ~4 sessions + Google audit.**

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Apple rejects on NSHealthShareUsageDescription too generic | Medium | Info.plist string names specific VYVE features (certificates, tracks) |
| Apple rejects on broad 7-scope request | Medium | Fallback: split into phase 1 (workouts + weight + steps + active energy) and phase 2 (HR + sleep + distance) in a v1.1 ship 2 weeks later |
| Double-counting (Apple Watch → HK → VYVE sync → also manually logged) | Medium | Cap trigger ceiling + `app_source` UI surfacing for user clarity |
| Shadow-read (we write workout to HK → next sync reads it back) | High (without ledger) | `member_health_write_ledger` with native_uuid match filter |
| Capacitor version compatibility | Low | Verify current Capacitor version in session 1; plugin supports 5+ |
| Health data flows to Anthropic for AI personalisation | Deferred | **Not in v1.** Article 9 data; consent wording refresh needed before enabling. Separate product decision. |
| Cardio-write accuracy challenged by Apple | N/A | Not writing cardio in v1 |

---

## Mapping rules (reference tables — will be implemented in EF)

### HealthKit workout types → VYVE buckets

**Maps to `workouts` table:**
- FunctionalStrengthTraining
- TraditionalStrengthTraining
- CoreTraining
- Pilates
- Yoga (when > 30 min)
- MixedCardio (when duration ≤ 15 min)
- CrossTraining

**Maps to `cardio` table:**
- Running
- Cycling
- Walking (when ≥ 15 min continuous)
- Hiking
- Rowing
- Swimming
- HighIntensityIntervalTraining
- Elliptical
- StairClimbing
- MixedCardio (when duration > 15 min)

**Ignored in v1** (stored raw, not promoted):
- Yoga (when ≤ 30 min — counts as mobility)
- Dance, Golf, Baseball, Basketball etc. (leisure sports)
- MindAndBody (too broad)

### VYVE workout plan types → HKWorkoutActivityType (write path)

Mapping built from `workout_plans.category` column. Defaults to `HKWorkoutActivityTypeTraditionalStrengthTraining` for any unrecognised VYVE category. Full mapping table in session 4 ship.

---

## Questions parked for later

- **Background delivery on iOS.** Needs Swift plugin extension. v2 feature. Ticket created post-launch.
- **Wearable Insights dashboard panel.** Uses raw samples (steps, HR, sleep) that v1 ingests but doesn't surface. Natural follow-up once data is flowing for 2 weeks.
- **AI personalisation from health data.** Article 9 consent wording refresh needed. Lewis to review before enabling.
- **HealthKit write-back for cardio.** Needs distance + calorie accuracy chain we don't currently have. v2+.

---

*Plan committed to brain 23 April 2026.*
