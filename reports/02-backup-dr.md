# VYVE Health - Backup & Disaster Recovery Report
> Report 2 of 11 | 14 April 2026 | 7 asset categories, 6 DR scenarios
> Database: 20 MB, PostgreSQL 17.6, WAL archiving ON, 15 auth users, 4 storage buckets, 266 objects

## Executive Summary
**CRITICAL: 19 of 20 core Edge Functions have NO external backup.** Only onboarding has a staging copy (7 versions stale). The Composio wipe on 13 April proved this is real. Database has Supabase PITR but no off-platform backup. VAPID private key exists only in Supabase secrets.

## Asset Categories

### Database - PARTIAL
- Supabase PITR active (wal_level=logical, archive_mode=on). 7-day retention
- No off-platform backup. If Supabase project deleted, all data lost
- auth.users password hashes cannot be exported - users need password reset on restore
- SQL functions and triggers not version-controlled
- **ACTION:** Weekly pg_dump EF to external storage (3-4 hrs). Document schema in VYVEBrain (2-3 hrs)

### Supabase Storage - NO BACKUP
- 4 buckets: certificates (HTML), exercise-videos, exercise-thumbnails, cc-documents (private)
- 266 objects. Zero backup mechanism
- Certificates regeneratable. Exercise videos need original sources. cc-documents may be sole copies
- **ACTION:** Storage backup EF weekly (3-4 hrs). Document video sources (Lewis)

### Edge Functions - PARTIAL (CRITICAL)
- 20 core EFs. Only onboarding_v67.ts in VYVEBrain/staging/ (7 versions behind production v74)
- 19 EFs have ZERO external backup
- Composio wipe incident 13 April proved the risk is real
- re-engagement-scheduler (35KB) would take 4-8 hrs to rebuild from scratch
- **ACTION P0:** Back up all 20 core EFs to VYVEBrain/staging/ NOW (1 hr)

### Portal/Marketing - GOOD
- 3 GitHub repos with full git history. Inherent distributed backup
- **ACTION:** Verify 2FA on GitHub, enable branch protection

### Secrets - PARTIAL
- 8 secrets in Supabase env. VAPID_PRIVATE_KEY loss invalidates ALL push subscriptions
- GitHub PAT has expiry date (unknown)
- **ACTION P0:** Encrypted secrets backup (30 mins). Check PAT expiry

### Third-Party Data - NO BACKUP
- Brevo contacts, HubSpot CRM, Make scenarios - no exports
- **ACTION:** Monthly Brevo CSV export, Make scenario JSON export (Lewis)

### DNS - PARTIAL
- Cloudflare DNS records not documented. Domain renewal date not calendared
- **ACTION:** Document DNS records, set auto-renewal

## DR Scenarios
1. **Supabase project deleted:** CRITICAL gap - no independent backup
2. **EF overwritten with bad code:** HIGH gap - 19/20 no backup (has happened)
3. **GitHub account compromised:** LOW gap - git is distributed
4. **Anthropic key compromised:** LOW - straightforward rotation
5. **VAPID key lost:** MEDIUM - all push subscriptions invalidated
6. **Brevo account suspended:** MEDIUM - no backup email provider
