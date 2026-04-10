# VYVE Health — External Brain

Zero-dependency knowledge system for AI-assisted development.
Any AI model can load this repo and immediately operate on VYVE Health.

## Folder Structure

```
├── README.md
├── brain/
│   ├── master.md              ← Complete business + technical context
│   ├── how-to-use.md          ← Human operator guide
│   └── schema-snapshot.md     ← Live DB schema (refresh periodically)
├── playbooks/
│   ├── github-operator.md     ← How AI reads/writes to the repo
│   ├── repo-audit.md          ← Full codebase health check
│   ├── feature-build.md       ← End-to-end feature delivery
│   └── bug-fix.md             ← Diagnosing and fixing issues
├── tasks/
│   ├── task-template.md       ← Blank task card
│   ├── backlog.md             ← Prioritised work queue
│   └── completed/             ← Archived done tasks
└── prompts/
    └── cold-start.md          ← Paste into ANY AI to begin work
```

## Quick Start

1. Open a new AI session (any model).
2. Paste the contents of `prompts/cold-start.md`.
3. Tell the AI which task to execute or paste a task from `tasks/`.
4. The AI will load the relevant playbook and begin.

## Last Updated

10 April 2026 — verified against live Supabase (project ixjfklpckgxrwjlfsaaz).
