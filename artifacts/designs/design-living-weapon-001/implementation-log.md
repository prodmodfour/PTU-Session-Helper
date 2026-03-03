# Implementation Log

## Status: p0-implemented (fix cycle complete)

P0 implemented (Sections A-D) + fix cycle applied. P1 and P2 remain.

---

## Timeline

| Date | Action | Details |
|------|--------|---------|
| 2026-02-28 | Design spec created | Full P0/P1/P2 spec for Living Weapon system |
| 2026-03-03 | P0 implemented | 14 commits: data model, constants, capability parsing, service, API endpoints, WebSocket, encounter integration, auto-disengage on removal/recall/switch |
| 2026-03-03 | P0 fix cycle | 8 commits: code-review-297 (C1+H1-H3+M1-M3) + rules-review-270 (HIGH#1-#2+MEDIUM#1) + bug-046 + decree-043 |

---

## P0 Commits

| Commit | Section | Description |
|--------|---------|-------------|
| ad2d0f2b | A | WieldRelationship interface and combatant wield state fields |
| 90e2cc80 | B | Living Weapon constants (LIVING_WEAPON_CONFIG, weapon moves) |
| 71b866bd | B | getLivingWeaponConfig capability parser |
| 5f9e1961 | D | living-weapon.service.ts with pure wield state functions |
| 96b38eb5 | D | wieldRelationships reconstruction from combatant flags |
| 19535e88 | C | POST engage endpoint (Standard Action) |
| 71d661ab | C | POST disengage endpoint (Swift Action) |
| 8ae5a880 | D | WebSocket event handlers (living_weapon_engage/disengage) |
| b57167ef | D | Auto-disengage on combatant removal |
| eef602bd | D | Encounter response and store integration |
| 4a568048 | D | Faint behavior documentation in damage endpoint |
| 39a4bc1c | D | Auto-disengage on Pokemon recall |
| 1d2d3f18 | D | Auto-disengage on Pokemon switch |
| 7eee573a | D | WebSocket state sync includes wieldRelationships |

## P0 Files Changed

### New Files
- `app/constants/livingWeapon.ts` — Species config, weapon move definitions
- `app/server/services/living-weapon.service.ts` — Pure wield state functions
- `app/server/services/living-weapon-state.ts` — State reconstruction from combatant flags
- `app/server/api/encounters/[id]/living-weapon/engage.post.ts` — Engage endpoint
- `app/server/api/encounters/[id]/living-weapon/disengage.post.ts` — Disengage endpoint

### Modified Files
- `app/types/combat.ts` — WieldRelationship interface
- `app/types/encounter.ts` — Combatant wield fields, Encounter wieldRelationships
- `app/utils/combatantCapabilities.ts` — getLivingWeaponConfig()
- `app/server/services/encounter.service.ts` — ParsedEncounter + buildEncounterResponse
- `app/server/routes/ws.ts` — Event handlers + state sync
- `app/stores/encounter.ts` — Living Weapon getters + WebSocket sync
- `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` — Auto-disengage
- `app/server/api/encounters/[id]/recall.post.ts` — Auto-disengage
- `app/server/api/encounters/[id]/switch.post.ts` — Auto-disengage
- `app/server/api/encounters/[id]/damage.post.ts` — Faint behavior comment

## Implementation Notes

### Data Storage Approach
WieldRelationships are **not stored in a dedicated DB column**. Instead, the combatant flags (`wieldingWeaponId`, `wieldedByTrainerId`) are persisted as part of the combatants JSON column. The full `WieldRelationship[]` array is reconstructed at runtime from these flags using `reconstructWieldRelationships()`. This avoids needing a Prisma schema migration for P0.

### Design Deviation: `updateWieldFaintedState`
The spec defines `updateWieldFaintedState` for explicitly updating the fainted flag on wield relationships. Since relationships are reconstructed from combatant flags (which include the entity's HP state), the `isFainted` flag is automatically correct at reconstruction time. The function exists in the service for future use if relationships are stored in a dedicated column, but is not called in the current flow.

## Fix Cycle Commits

| Commit | Issue | Description |
|--------|-------|-------------|
| c924acb4 | decree-043, rules-270 HIGH#1 | Remove Combat Skill Rank gate from engagement |
| ecbc2159 | code-297 M1 | Validate homebrew species (default to Honedge) |
| 48123a55 | code-297 C1/H2/M3, rules-270 HIGH#2/MEDIUM#1 | Overhaul engage endpoint |
| 29e792f4 | code-297 C1/H2/M3, rules-270 MEDIUM#1 | Overhaul disengage endpoint |
| ff8e7f0e | bug-046 | Fix malformed WS broadcast in mount/dismount |
| 80b4f5fa | code-297 H1 | Add WS event types and client handlers |
| a5199014 | code-297 H3 | File unit test coverage ticket (feature-024) |
| d9b6c420 | code-297 M2 | Update app-surface.md |

### Duplicate Code Path Check (L2 Lesson)
Searched all combatant removal paths and added auto-disengage to:
1. `[combatantId].delete.ts` — Direct removal
2. `recall.post.ts` — Pokemon recall
3. `switch.post.ts` — Pokemon switch (recall half)
