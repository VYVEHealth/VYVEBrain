# How to Use the External Brain

> This guide is for Dean (CTO) — the human operator.

## Daily Workflow

### Starting a Session with Any AI
1. Open any AI tool (Claude, ChatGPT, Gemini, etc.).
2. Paste `prompts/cold-start.md` as your first message.
3. Or attach `brain/master.md` if the AI supports file upload.
4. State your task clearly.

### Idea to Execution
```
1. IDEA        -> One sentence
2. TASK CARD   -> Copy tasks/task-template.md, fill in (2 min)
3. PLAYBOOK    -> Pick the right one
4. EXECUTE     -> Paste task card into AI session
5. VERIFY      -> Check expected outcome
6. ARCHIVE     -> Move to tasks/completed/
```

## Choosing a Playbook
| Situation | Playbook |
|-----------|----------|
| Read/write GitHub files | github-operator.md |
| Codebase health check | repo-audit.md |
| New page/feature/EF | feature-build.md |
| Something broken | bug-fix.md |

## Choosing an AI Model
| Task | Model |
|------|-------|
| Complex architecture, audits | Claude Opus / GPT-4o |
| Single file edits, bug fixes | Claude Sonnet / GPT-4o-mini |
| Content, emails, copy | Any model |
| Emergency recovery | Whatever is available |

## Updating the Brain
- After schema changes, EF deploys, features, business decisions
- Update the relevant file + date
- Quarterly: run repo-audit playbook, refresh everything

## Emergency: Lost All AI Access
1. Sign up for any AI
2. Paste cold-start.md
3. Resume work. The brain is in GitHub, not in any AI's memory.
