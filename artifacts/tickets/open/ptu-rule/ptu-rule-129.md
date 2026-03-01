---
ticket: ptu-rule-129
priority: P3
severity: MEDIUM
status: open
domain: combat
source: decree-039
created_at: 2026-03-01
---

# ptu-rule-129: Roar's forced recall must respect the Trapped condition

## Problem

The current forced switch implementation allows Roar to recall a Trapped Pokemon. Per decree-039, Roar does NOT override Trapped — only moves with explicit text (U-Turn, Baton Pass, Volt Switch, Parting Shot) and trainer features (Round Trip) can bypass Trapped.

When Roar hits a Trapped target, the shift movement should still occur (Trapped restricts recall, not movement), but the 6m recall check should fail because the Pokemon cannot be recalled.

## Expected Behavior

1. Roar hits a Trapped Pokemon
2. The Pokemon shifts away using its highest movement capability (this still happens)
3. If the Pokemon ends within 6m of its Poke Ball, the recall is **blocked** because the Pokemon is Trapped
4. The Pokemon remains on the field at its new position

## Files to Modify

- `app/composables/useSwitching.ts` — forced switch validation must check for Trapped
- `app/server/api/encounter/switch.post.ts` — server-side validation must also check Trapped for forced switches

## Acceptance Criteria

- [ ] Roar cannot recall a Trapped Pokemon
- [ ] Roar's shift movement still applies to Trapped Pokemon
- [ ] U-Turn, Baton Pass, Volt Switch, Parting Shot still bypass Trapped (if implemented)
- [ ] Unit tests cover Trapped + Roar interaction
