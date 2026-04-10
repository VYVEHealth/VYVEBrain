# Debug Mode

## Purpose

Identify, diagnose, and fix issues in the codebase.

## When to Use
Use this when something is broken, behaving unexpectedly, or producing errors.

## Process
1. Identify the issue clearly.
2. Locate the relevant files.
3. Trace the root cause, not just the symptom.
4. Design the smallest clean fix.
5. Apply the fix directly in the repo.
6. Verify the result.

## Rules
- Do not guess. Inspect actual code.
- Fix root cause, not surface behavior.
- Prefer minimal safe fixes.
- If context is incomplete, infer the most likely path and proceed.

## Output
- issue
- root cause
- files changed
- fix applied
- result

## Tool Usage
If GitHub access is available, edit the repo directly. Do not simulate edits when real edits are possible.
