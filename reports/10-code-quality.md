# VYVE Health - Code Quality & Tech Debt Report
> Report 10 of 11 | 14 April 2026 | 67 files, 4 bugs, 10 debt items, 6 strengths
> Based on: GitHub repo tree (vyve-site), platform_alerts, EF code review

## Executive Summary
Architecture is simple and effective for current scale. 4 active JS bugs from platform_alerts. 183KB legacy file. 16 live/replay pages with ~310KB duplication. Zero automated tests. Good documentation via VYVEBrain.

## Repo Overview
- 39 HTML files (1,245 KB total)
- 14 JS files (355 KB total, incl. supabase.min.js 185 KB)
- 67 files total

### Largest Pages
| File | Size | Notes |
|------|------|-------|
| VYVE_Health_Hub.html | 183 KB | LEGACY - candidate for deletion |
| index.html | 80 KB | Dashboard - at modularisation threshold |
| nutrition.html | 73 KB | Next modularisation candidate |
| settings.html | 63 KB | Complex modals |
| running-plan.html | 60 KB | AI plan generator |

### Duplication
- 8 live session pages (~22KB each = 178KB) - nearly identical, consolidate to 1
- 8 replay pages (~17KB each = 131KB) - same pattern, consolidate to 1
- Total savings: ~280KB, 14 fewer files

## Active Bugs (from platform_alerts)
| Bug | Page | Error | Fix |
|-----|------|-------|-----|
| BUG-001 | workouts-library.js:40 | SyntaxError: Invalid token | Fix syntax at line 40 |
| BUG-002 | yoga-live.html:142 | switchTab not defined | Declare or import function |
| BUG-003 | index.html:853 | getTimeGreeting not defined | Declare or import function |
| BUG-004 | workouts.html | showToast not defined | Declare or import function |

## Tech Debt (10 items)
1. **MEDIUM:** 183KB legacy VYVE_Health_Hub.html - verify unused, delete
2. **MEDIUM:** 8 live session pages duplicated - consolidate to 1 parameterised
3. **MEDIUM:** 8 replay pages duplicated - consolidate to 1 parameterised
4. **LOW:** 5 HTML files exceed 50KB modularisation threshold
5. **MEDIUM:** EF version comments don't match Supabase versions - remove from code
6. **HIGH:** Zero automated tests - start with EF integration tests (6-8 hrs)
7. **LOW:** No inline JSDoc documentation
8. **LOW:** No CI/CD pipeline - defer until tests exist
9. **LOW:** No accessibility audit - defer until enterprise requirement
10. **MEDIUM:** ~24 utility EFs still deployed - audit and delete unused

## Architecture Strengths
1. Single-file HTML is appropriate at current scale
2. Workouts modularisation (6 modules) is the correct pattern
3. Edge Function architecture is clean and consistent
4. VYVEBrain is excellent knowledge management
5. Theme system properly implemented (84 colours fixed in April audit)
6. Auth pattern standardised across all pages
