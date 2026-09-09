# Session prompt — credential rotation (enterprise B3)

Load brain, then read `playbooks/enterprise-readiness.md` — this is the last open item on my side of
Wave 2, and it's the one with the most blast radius, which is why it gets its own session rather
than being tacked onto the end of something else.

We need to rotate the service_role key and the anon key, and — more importantly for an auditor —
write down a rotation cadence, because rotation with no documented schedule is itself a finding.

The reason this is delicate rather than routine: the service_role key gained an extra consumer on
the Hetzner live-session runner at PM-714, and it's used by a lot of Edge Functions and cron jobs.
Anything that gets missed fails hard rather than degrading quietly, and some of it fails in places
I won't notice for a day — a cron that silently stops, an email that stops sending.

So build the full consumer checklist **before** touching anything. Every Edge Function that reads
`SUPABASE_SERVICE_ROLE_KEY`, every cron job, the Hetzner box at 159.69.95.90, anything in Supabase
Vault that embeds it, and any local tooling. I'd rather spend most of this session on the inventory
and the sequencing than on the rotation itself. Tell me what the rollback looks like at each step
before we start, and tell me which things I'll need to verify by hand afterwards.

Note the anon key is genuinely public — it ships in client code by design — so rotating it is about
hygiene and the documented cadence, not about a leak. It does mean every client bundle needs the new
value, and members on bundled builds only get that via OTA, so the sequencing there matters too.
The OTA channel is currently held; check the brain for where that stands before assuming.

Two related things worth folding in while we're on credentials, both from PM-1141/1142:
generate Google backup codes for `team@vyvehealth.co.uk` and store them somewhere that isn't Google
(that account is effectively the identity provider for the whole estate), and do the one-off MFA
audit across every account in `policies/key-person-handover.md` §2, recording the method as well as
whether it's enabled.

Close with the usual atomic brain commit, and update the rotation cadence into
`brain/security_questionnaire.md` and `policies/access-mfa-offboarding.md` — the schedule existing
in writing is the bit that closes the finding.
