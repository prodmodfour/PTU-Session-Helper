---
review_id: code-review-362
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-057
domain: character-lifecycle
commits_reviewed:
  - bca4a7ef
  - c7561a7b
  - d0c036e7
files_reviewed:
  - app/server/api/characters/index.post.ts
  - app/tests/unit/utils/trainerExperience.test.ts
  - .claude/skills/references/app-surface.md
  - app/utils/trainerExperience.ts
  - app/server/api/characters/[id].put.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T16:45:00Z
follows_up: code-review-353
---

## Review Scope

Re-review of bug-057 D2 fix cycle. Three commits address all three issues raised in code-review-353:

- **C1 (CRITICAL):** Validation error swallowed as 500 in `index.post.ts` -- fixed by moving validation before the try block.
- **H1 (HIGH):** No unit tests for `validateTrainerLevel` -- fixed by adding 9 test cases.
- **M1 (MEDIUM):** `app-surface.md` not updated -- fixed by adding `TRAINER_MIN_LEVEL` and `validateTrainerLevel` to the Trainer XP entry.

Decree check: no active decrees in the character-lifecycle domain apply to trainer level bounds validation. Checked decree-022, 026, 027, 037, 051, 052 -- none relevant.

## Issues

No new issues found. All three prior issues are resolved correctly.

### Prior Issues -- Resolution Verification

**C1 RESOLVED: Validation moved before try block (bca4a7ef)**

The `validateTrainerLevel` call and its `createError({ statusCode: 400 })` throw are now at lines 12-15 of `index.post.ts`, before the `try` block starts at line 17. A 400 error from validation will propagate directly to the client without being caught and re-wrapped as 500. This matches the pattern already established in `[id].put.ts` (lines 18-23). The `readBody` call was also correctly moved outside the try block (it was already inside before), which is fine -- H3's `readBody` throws its own properly-coded errors.

Note: the catch block at line 74 still lacks the `if (error.statusCode) throw error` guard that 6 other endpoints in this directory use. This is a pre-existing inconsistency that predates both the original bug-057 fix and this D2 cycle. Since all known error-throwing code paths (validation, Prisma constraint errors) are now either outside the try block or would correctly be 500s, this is not blocking. It could be addressed in a future consistency pass.

**H1 RESOLVED: 9 unit tests added (c7561a7b)**

The `validateTrainerLevel` describe block (lines 235-285) covers all required cases:
- 3 valid levels: 1 (minimum boundary), 25 (mid-range), 50 (maximum boundary)
- 3 out-of-range: 0 (below min), 51 (above max), -1 (negative)
- 3 type-safety: 1.5 (non-integer), "five" (string), NaN

All 9 tests verify return type (`toBeTypeOf('string')` for errors, `toBeNull()` for valid) and error message content (checking for `TRAINER_MIN_LEVEL`/`TRAINER_MAX_LEVEL` constants or `'integer'` substring). This exceeds the minimum 6 cases requested in code-review-353.

All 42 tests in `trainerExperience.test.ts` pass (verified by running `npx vitest run` from the main repository).

**M1 RESOLVED: app-surface.md updated (d0c036e7)**

The Trainer XP entry now includes `validateTrainerLevel` (described as "bounds check returning error string or null") and `TRAINER_MIN_LEVEL` (value 1). Both are correctly positioned in the existing Trainer XP paragraph alongside the other exports from `utils/trainerExperience.ts`.

## What Looks Good

1. **C1 fix is clean and minimal.** Only the validation and its prerequisite (`readBody`, `level` extraction) were moved outside the try block. The Prisma create call and HP computation remain inside the try block where they belong. The diff is 19 lines changed with no functional side effects.

2. **Test coverage is thorough.** The 9 new tests cover boundary values (1, 50), out-of-range values (0, 51, -1), and type coercion edge cases (float, string, NaN). The assertions check both the return type and message content, preventing silent regression if the error messages change.

3. **Commit granularity is correct.** One commit per issue: fix (bca4a7ef), tests (c7561a7b), docs (d0c036e7). Each is independently reviewable and describes its purpose clearly.

4. **Pattern consistency with `[id].put.ts`.** The create endpoint now follows the same validation-before-try-block pattern as the update endpoint, making the codebase more consistent.

## Verdict

**APPROVED** -- all three issues from code-review-353 are fully resolved. No new issues introduced. The fix is correct, well-tested, and properly documented.
