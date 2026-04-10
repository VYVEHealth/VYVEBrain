# Brain Sync System

## Overview

This playbook maintains the External Brain — a clean, structured, persistent system that allows the business to operate independently of any single AI model or chat session.

The purpose is to:
- preserve confirmed knowledge
- maintain task state
- improve execution workflows
- ensure continuity across AI tools

The goal is NOT to:
- store raw chat logs
- capture brainstorming noise
- duplicate information
- save unverified ideas

---

# Core Principle

Only promote SIGNAL, never NOISE.

Before saving anything, validate:
1. Is it confirmed?
2. Will it matter in future sessions?
3. Does it belong in a structured file?
4. Is it better than what already exists?

If not — do not save it.

---

# Sync Types

## 1. Session Sync

### When to use
Run at the end of any meaningful work session where:
- repo changes were made
- a task was completed
- a new task was created
- a playbook was improved
- a key decision was made

### Trigger
"Run Brain Sync"  
or  
"Run session sync"

---

## 2. Daily Sync

### When to use
Run once at the end of the day to:
- consolidate updates
- clean tasks
- update changelog
- remove duplication

### Trigger
"Run daily sync"

---

## 3. Recovery Sync

### When to use
Run after disruption:
- account issues
- model switching
- context loss

### Trigger
"Run recovery sync"

---

# File Structure

## Brain
- `/brain/master.md` → core knowledge  
- `/brain/how-to-use.md` → operating instructions  
- `/brain/changelog.md` → history of changes  

## Playbooks
- `/playbooks/*.md` → reusable AI workflows  

## Tasks
- `/tasks/open/`  
- `/tasks/completed/`  
- `/tasks/blocked/`  
- `/tasks/task-template.md`  

---

# Update Categories

## Brain Updates
- product logic
- architecture decisions
- business rules

## Playbook Updates
- improved workflows
- new operating modes

## Task Updates
- created
- completed
- blocked

## Changelog Updates
- meaningful changes to system/business

---

# Safety Rules

## Auto-Apply (no review)
- small updates
- additive changes
- task updates
- minor playbook improvements

## Require Review
- deleting or rewriting core knowledge
- architecture changes
- major playbook rewrites
- removing tasks

---

# Branch Strategy

### Default
`brain-sync/YYYY-MM-DD-description`

### Fast Mode
Commit to current branch ONLY if:
- changes are small
- risk is low

### Never
- force push
- delete branches
- rewrite history
- merge to main automatically

---

# Commit Messages

### Session Sync
`brain: sync session updates for [topic]`

### Daily Sync
`brain: daily sync for YYYY-MM-DD`

### Recovery Sync
`brain: recovery sync after [issue]`

### Playbook
`playbook: update [name]`

### Task
`tasks: update [task-name]`

---

# Execution Process

## Step 1: Review session
Extract:
- decisions
- completed work
- new tasks
- reusable improvements

Ignore:
- filler
- repetition
- uncertainty

---

## Step 2: Classify
- Brain
- Playbook
- Task
- Changelog

---

## Step 3: Map to files
Assign exact file paths

---

## Step 4: Deduplicate
Update existing content instead of duplicating

---

## Step 5: Clean content
Write structured markdown only

---

## Step 6: Apply changes
- auto-apply if safe
- review if risky

---

## Step 7: Commit
Use standard format

---

## Step 8: Report
Return:
- files created
- files updated
- commit message
- excluded items

---

# Output Format (Review Mode)

## Brain Sync Review

### Proposed Changes

#### File: /path/file.md
Change type: create | update | move

Content:
[clean markdown]

---

### Commit Message
[message]

### Not Saved
[list]

---

# Output Format (Auto Mode)

## Brain Sync Complete

### Files Created
- /path/file.md

### Files Updated
- /path/file.md

### Files Moved
- old → new

### Commit Message
[message]

### Excluded
[list]

---

# Task Template

# Task: [title]

## Status
Open | Completed | Blocked

## Context
Why this exists

## Instructions
What to do

## Files Affected
- file paths

## Playbook
Which playbook to use

## Expected Outcome
What success looks like

## Notes
Optional details

## Completion Summary
(only when done)

---

# Daily Sync Rules

- move completed → `/tasks/completed/`
- move blocked → `/tasks/blocked/`
- update changelog
- merge duplicate tasks
- clean structure

Do NOT rewrite entire brain unless necessary.

---

# Recovery Sync Rules

- treat repo as source of truth
- rebuild context from files
- then apply updates

---

# Critical Rules

- no raw chat logs
- no vague notes
- no duplication
- no temporary reasoning
- repo = source of truth

---

# Trigger Phrases

- Run Brain Sync
- Run session sync
- Run daily sync
- Run recovery sync
- Sync the brain
- Update external brain

---

# SESSION SYNC PROMPT

Run Brain Sync.

Mode: session sync  
Default: auto-apply low-risk, review high-risk  
Branch: create brain-sync branch  
Commit: session format  

Only save:
- confirmed knowledge
- process improvements
- task updates
- meaningful changes  

Do not save:
- raw chat
- duplicates
- half ideas  

---

# DAILY SYNC PROMPT

Run Brain Sync.

Mode: daily sync  
Default: auto-clean + review structural changes  
Branch: daily branch  
Commit: brain: daily sync for [DATE]

Tasks:
- consolidate updates
- clean tasks
- update changelog
- deduplicate  

---

# RECOVERY SYNC PROMPT

Run Brain Sync.

Mode: recovery sync  

Steps:
1. read brain files
2. reconstruct context
3. identify gaps
4. update system cleanly  

Treat repo as source of truth.

---

# Final Instruction

You are maintaining a clean operational memory system, not a conversation log.

Ensure:
- continuity
- clarity
- reliability
- independence from any AI tool
