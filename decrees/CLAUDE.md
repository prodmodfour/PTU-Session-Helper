# Decrees CLAUDE.md

Context for working with design decrees — binding human rulings on ambiguous design decisions.

## What Are Decrees

When a PTU rule is unclear or has multiple valid interpretations, skills create `decree-need` tickets (in `artifacts/tickets/open/decree/`). The human runs `/address_design_decrees` to make rulings, which are recorded here as `decree-NNN.md` files.

## Authority Level

**Decrees are the HIGHEST authority in the project.** They override (in order):
1. PTU book text (core chapters in `books/markdown/core/`)
2. PTU errata (`books/markdown/errata-2.md`)
3. All skill-level rulings and assumptions

Violations in code reviews are **CRITICAL severity** — reviewers must check relevant decrees before approving any code.

## Decree Format

Each file (`decree-NNN.md`) has:

**YAML Frontmatter:** `decree_id`, `status` (active/superseded), `domain`, `topic`, `title`, `ruled_at`, `supersedes`, `superseded_by`, `source_ticket`, `implementation_tickets`, `tags`

**Body (5 sections):**
1. **The Ambiguity** — What is unclear, with source ticket citation
2. **Options Considered** — 2-3 lettered options (A, B, C) with pros/cons
3. **Ruling** — Starts with "**The true master decrees:**" followed by chosen option and implementation guidance
4. **Precedent** — Generalizable principle for future similar cases
5. **Implementation Impact** — Tickets created, files affected, skills that should cite this decree

## How to Reference Decrees

- **In code comments**: `// per decree-012: enforce type immunity server-side`
- **In type definitions**: Comments near affected types (e.g., `StageSource` cites decree-005)
- **In design specs**: `decree: decree-002, decree-003` in `_index.md` frontmatter
- **In tickets**: `source: decree-005` linking back to the originating decree

## Domain Distribution (42 decrees, all active)

| Domain | Count | Example Topics |
|--------|-------|---------------|
| combat | 12 | minimum damage floor, stage sources, tick damage timing, switching |
| rest | 7 | move refresh, AP restoration, injury healing, Pokemon Center timing |
| vtt | 7 | burst shape, cone width, token blocking, line-of-effect |
| character-lifecycle | 4 | trainer XP, level-up flow |
| capture | 4 | ball modifiers, capture linking |
| vtt-grid | 3 | terrain costs, diagonal lines |
| pokemon-lifecycle | 2 | evolution, base relations |
| encounter | 2 | significance tiers, XP capping |
| healing | 1 | healing item mechanics |

## Current State

42 decrees (`decree-001.md` through `decree-042.md`), all with `status: active`, none superseded. Index at `_index.md`.
