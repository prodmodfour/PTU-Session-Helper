---
id: refactoring-127
title: Rename project from "PTU Session Helper" to "Rotom Table"
priority: P0
severity: HIGH
status: resolved
domain: project-wide
source: user-request
created_by: user
created_at: 2026-03-04
---

# refactoring-127: Rename project to "Rotom Table"

## Summary

Rename the project from "PTU Session Helper" to **Rotom Table**. The repository
directory/slug must be `rotom_table` (lowercase with underscore). Display name
throughout the app and documentation should be "Rotom Table".

## Naming Convention

| Context | Value |
|---------|-------|
| Display name | Rotom Table |
| Repo directory / slug | `rotom_table` |
| package.json name | `rotom_table` |

## Required Changes

### 1. Repository & Directory
- Rename repo directory from `PTU-Session-Helper` to `rotom_table`
- Update any absolute path references in configs, scripts, or CLAUDE.md files

### 2. package.json
- Update `name` field in `package.json` (root and `app/`)
- Update any `description` fields referencing the old name

### 3. Application UI
- Update page titles, headers, or branding text that say "PTU Session Helper"
- Update any `<title>` tags or meta descriptions

### 4. Documentation
- Update root `CLAUDE.md` project list entry
- Update `app/CLAUDE.md` and any descendant CLAUDE.md files referencing the old name
- Update `README.md` if it exists

### 5. Configuration & Tooling
- Update `nuxt.config.ts` if it references the project name (app title, meta)
- Update any Docker, CI/CD, or deployment configs referencing the old name
- Update `.claude/` project memory paths if hardcoded

### 6. Git Remote
- Rename the GitHub repository (if applicable) to `rotom_table`
- Update git remote URL

## Out of Scope
- No code logic changes — this is purely a naming/branding refactor
- No database migrations needed

## Impact

User-facing branding change. No functional impact. All references to the old name
should be replaced to avoid confusion.
