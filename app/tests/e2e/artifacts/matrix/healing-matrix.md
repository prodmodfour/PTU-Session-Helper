---
domain: healing
analyzed_at: 2026-02-19T00:00:00Z
analyzed_by: coverage-analyzer
total_rules: 42
implemented: 25
partial: 5
missing: 12
out_of_scope: 0
coverage_score: 65.5
---

# Feature Completeness Matrix: Healing

## Coverage Score
**65.5%** — (25 + 0.5 * 5) / (42 - 0) * 100

| Classification | Count |
|---------------|-------|
| Implemented | 25 |
| Partial | 5 |
| Missing | 12 |
| Out of Scope | 0 |
| **Total** | **42** |

---

## Implemented Rules

### healing-R001: Tick of Hit Points Definition
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`), `healing-C019` — Get Rest Healing Info (`utils/restHealing.ts:getRestHealingInfo`)

### healing-R002: Rest Definition
- **Classification:** Implemented
- **Mapped to:** `healing-C001` — Character 30-Minute Rest API (`server/api/characters/[id]/rest.post.ts`), `healing-C006` — Pokemon 30-Minute Rest API (`server/api/pokemon/[id]/rest.post.ts`)

### healing-R003: Injury Definition — HP Reduction per Injury
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`), `healing-C015` — Calculate Pokemon Center Time (`utils/restHealing.ts:calculatePokemonCenterTime`)

### healing-R004: Injury Gained from Massive Damage
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`)

### healing-R005: Injury Gained from HP Markers
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`)

### healing-R006: Fainted Condition Definition
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`), `healing-C030` — Apply Healing to Entity (`server/services/combatant.service.ts:applyHealingToEntity`)

### healing-R007: Natural Healing Rate (Rest HP Recovery)
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`)

### healing-R008: Rest Requires Continuous Half Hour
- **Classification:** Implemented
- **Mapped to:** `healing-C001` — Character 30-Minute Rest API (`server/api/characters/[id]/rest.post.ts`), `healing-C006` — Pokemon 30-Minute Rest API (`server/api/pokemon/[id]/rest.post.ts`)

### healing-R009: Rest HP Recovery Daily Cap (8 Hours)
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`)

### healing-R010: Heavily Injured Threshold (5+ Injuries)
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`)

### healing-R011: Heavily Injured Blocks Rest HP Recovery
- **Classification:** Implemented
- **Mapped to:** `healing-C012` — Calculate Rest Healing (`utils/restHealing.ts:calculateRestHealing`)

### healing-R013: Multiple Injuries from Single Attack
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`)

### healing-R014: Fainted Cured by Revive or Healing to Positive HP
- **Classification:** Implemented
- **Mapped to:** `healing-C030` — Apply Healing to Entity (`server/services/combatant.service.ts:applyHealingToEntity`)

### healing-R017: Injury Does Not Affect HP Marker Thresholds
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`)

### healing-R018: Take a Breather — Core Effects
- **Classification:** Implemented
- **Mapped to:** `healing-C029` — Encounter Take a Breather API (`server/api/encounters/[id]/breather.post.ts`), `healing-C034` — Create Default Stage Modifiers (`server/services/combatant.service.ts:createDefaultStageModifiers`), `healing-C046` — Breather Cured Conditions Constant

### healing-R022: Healing Past HP Markers Creates Re-Injury Risk
- **Classification:** Implemented
- **Mapped to:** `healing-C033` — Calculate Damage (`server/services/combatant.service.ts:calculateDamage`)

### healing-R023: Natural Injury Healing (24-Hour Timer)
- **Classification:** Implemented
- **Mapped to:** `healing-C014` — Can Heal Injury Naturally (`utils/restHealing.ts:canHealInjuryNaturally`), `healing-C004` — Character Heal Injury API, `healing-C009` — Pokemon Heal Injury API

### healing-R024: Trainer AP Drain to Remove Injury
- **Classification:** Implemented
- **Mapped to:** `healing-C004` — Character Heal Injury API (`server/api/characters/[id]/heal-injury.post.ts`)

### healing-R025: Daily Injury Healing Cap (3 per Day)
- **Classification:** Implemented
- **Mapped to:** `healing-C016` — Calculate Pokemon Center Injury Healing (`utils/restHealing.ts:calculatePokemonCenterInjuryHealing`), `healing-C004`, `healing-C009`

### healing-R026: Pokemon Center — Base Healing
- **Classification:** Implemented
- **Mapped to:** `healing-C003` — Character Pokemon Center API (`server/api/characters/[id]/pokemon-center.post.ts`), `healing-C008` — Pokemon Pokemon Center API (`server/api/pokemon/[id]/pokemon-center.post.ts`)

### healing-R027: Pokemon Center — Injury Time Penalty (Under 5)
- **Classification:** Implemented
- **Mapped to:** `healing-C015` — Calculate Pokemon Center Time (`utils/restHealing.ts:calculatePokemonCenterTime`)

### healing-R028: Pokemon Center — Injury Time Penalty (5+ Injuries)
- **Classification:** Implemented
- **Mapped to:** `healing-C015` — Calculate Pokemon Center Time (`utils/restHealing.ts:calculatePokemonCenterTime`)

### healing-R029: Pokemon Center — Injury Removal Cap (3/Day)
- **Classification:** Implemented
- **Mapped to:** `healing-C016` — Calculate Pokemon Center Injury Healing (`utils/restHealing.ts:calculatePokemonCenterInjuryHealing`)

### healing-R032: Extended Rest — Clears Persistent Status Conditions
- **Classification:** Implemented
- **Mapped to:** `healing-C017` — Get Statuses to Clear (`utils/restHealing.ts:getStatusesToClear`), `healing-C018` — Clear Persistent Status Conditions (`utils/restHealing.ts:clearPersistentStatusConditions`), `healing-C044` — Persistent Status Conditions Constant

### healing-R033: Extended Rest — Restores Drained AP
- **Classification:** Implemented
- **Mapped to:** `healing-C002` — Character Extended Rest API (`server/api/characters/[id]/extended-rest.post.ts`)

---

## Partial Rules

### healing-R019: Take a Breather — Action Cost
- **Classification:** Partial
- **Present:** Full Action cost tracked (standard action marked as used), Tripped and Vulnerable conditions applied until end of next turn
- **Missing:** Forced shift movement away from enemies using highest available Movement Capability is not automated; currently the GM must manually position the token
- **Mapped to:** `healing-C029` — Encounter Take a Breather API (`server/api/encounters/[id]/breather.post.ts`)
- **Gap Priority:** P2

### healing-R034: Extended Rest — Daily Move Recovery
- **Classification:** Partial
- **Present:** Pokemon extended rest resets `usedToday` and `usedThisScene` for all moves
- **Missing:** The rule requires that a move only refreshes if "the Move hasn't been used since the previous day" — the app resets all daily moves unconditionally without checking if the move was used on the same day as the rest. This allows a same-day extended rest to incorrectly refresh moves used earlier that day.
- **Mapped to:** `healing-C007` — Pokemon Extended Rest API (`server/api/pokemon/[id]/extended-rest.post.ts`)
- **Gap Priority:** P2

### healing-R039: Basic Restorative Items
- **Classification:** Partial
- **Present:** In-combat healing endpoint (`healing-C028`) allows applying arbitrary HP amounts, and Fainted removal works when healing from 0 HP (`healing-C030`). The GM can manually enter the correct healing amount for any potion.
- **Missing:** No item catalog, item inventory, or item-specific behavior. Full Restore does not auto-clear statuses alongside healing. Revive has no dedicated action that sets HP to a specific value (20 HP or 50%). No "Repulsive" flag handling for herbal items. Item selection is entirely manual math by the GM.
- **Mapped to:** `healing-C028` — Encounter Heal Combatant API, `healing-C030` — Apply Healing to Entity
- **Gap Priority:** P1

### healing-R040: Status Cure Items
- **Classification:** Partial
- **Present:** Status conditions can be manually toggled via the encounter status endpoint (`POST /api/encounters/:id/status`). The GM can manually add/remove any status condition.
- **Missing:** No item catalog or "use Antidote" action. No item that auto-targets the correct condition. No Full Heal or Heal Powder action that removes all persistent statuses in one click. Item usage is entirely manual status toggling by the GM.
- **Mapped to:** Encounter status API (combat domain), manual GM workflow
- **Gap Priority:** P1

### healing-R042: Action Points — Scene Refresh and Drain/Bind
- **Classification:** Partial
- **Present:** Drained AP is tracked per character (`healing-C048`, `drainedAp` field), restored to 0 by extended rest (`healing-C002`), and can be incremented by AP drain injury healing (`healing-C004`).
- **Missing:** AP scene-end refresh is not automatically triggered when an encounter or scene ends. Bound AP is not tracked (no `boundAp` field or "bind AP" action). Total AP pool is not explicitly tracked (AP value is not stored; only drained amount is).
- **Mapped to:** `healing-C048` — HumanCharacter Healing Fields, `healing-C002` — Character Extended Rest API
- **Gap Priority:** P2

---

## Missing Rules

### healing-R012: Massive Damage Exclusion for Set/Lose HP Moves
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** The damage pipeline (`calculateDamage`) always checks for massive damage on all damage sources. There is no flag or parameter to indicate "set/lose HP" moves (e.g., Pain Split, Endeavor) that should bypass massive damage injury checks. The GM has no way to apply HP changes without triggering the injury system. Workaround: GM can manually adjust HP via direct character/Pokemon update, bypassing the damage pipeline entirely.

### healing-R015: Fainted Clears All Status Conditions
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** When a Pokemon or Trainer becomes Fainted, all Persistent and Volatile status conditions should be automatically cleared. The current damage pipeline (`calculateDamage`) detects faint but does not clear statuses. The heal pipeline (`applyHealingToEntity`) removes the Fainted status when healing to positive HP but does not address the initial clearing at faint-time. The GM must manually remove statuses after a faint.

### healing-R016: Heavily Injured Combat Penalty
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Trainers and Pokemon with 5+ injuries should lose HP equal to their injury count whenever they take a Standard Action or take damage from an attack. No capability implements this automatic HP drain. This is a commonly triggered mechanic when entities are heavily injured in combat. Workaround: GM must manually apply the HP loss each turn using the heal/damage interface.

### healing-R020: Take a Breather — Requires Save Checks
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Confused or Raged entities must pass save checks before they can Take a Breather. The breather endpoint currently executes unconditionally without checking pre-conditions. The GM must enforce save checks manually before clicking the breather button.

### healing-R021: Take a Breather — Assisted by Trainer
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** A trainer can spend a Full Action to assist another entity in Taking a Breather, requiring a Command Check (DC 12) and adjacency. No assisted breather action exists. The GM must handle this narratively and manually apply breather effects if the check succeeds.

### healing-R030: Death from 10 Injuries
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** A Pokemon or Trainer with 10 injuries (or reaching -50 HP / -200% HP, whichever is lower) dies in non-friendly matches. No death detection or notification exists. The injury counter can exceed 10 without any warning. This is a very rare edge case in normal gameplay.

### healing-R031: Fainted Recovery Timer (Potions)
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** When a fainted Pokemon is healed above 0 HP by a potion (as opposed to a Feature or Move like Wish/Heal Pulse), they remain Fainted for 10 more minutes. The current heal pipeline removes Fainted immediately upon healing to positive HP regardless of the healing source. No timer mechanism exists for delayed faint recovery.

### healing-R035: Hit Points Lost from HP Markers vs Damage
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Effects that "lose Hit Points" or "set Hit Points" (as distinct from "dealing damage") should not apply Defensive Stats, should not cause Massive Damage injuries, and should not trigger injury-related mechanics. The app has no mechanism to apply HP changes in this "non-damage" mode. All HP reduction goes through the damage pipeline. Workaround: GM can directly edit HP via the character/Pokemon update API, bypassing the combat damage system.

### healing-R036: Bandages — Double Natural Healing Rate
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Bandages are consumable items that double the natural healing rate (1/8th HP per half hour instead of 1/16th) for 6 hours. No bandage tracking, application, or modified healing rate exists. The rest endpoint always uses 1/16th. GM must manually double the rest result or apply a second rest action.

### healing-R037: Bandages — Heal One Injury After Full Duration
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** If bandages remain in place for their full 6-hour duration, they heal one Injury. No bandage timer or automatic injury healing from bandages exists. Depends on bandage system (healing-R036) being implemented first.

### healing-R038: Bandages — Broken by Damage
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Taking any damage or HP loss while bandaged immediately cancels the bandage effect. Depends on bandage system (healing-R036) being implemented first. Low standalone priority.

### healing-R041: Applying Restorative Items — Action Economy
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Using a Restorative Item is a Standard Action. The target forfeits their next Standard and Shift Action (unless the user has Medic Training Edge). Self-use is a Full-Round Action with no further forfeiture. The app has no action economy tracking for item usage. Healing a combatant during an encounter does not consume any action or impose any turn penalties on the target.

---

## Out of Scope

No rules were classified as Out of Scope. All 42 healing rules are relevant to the session helper's purpose of running PTU combat and rest encounters.

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check. Core scope first, formulas/conditions first, foundation rules before derived.

**Foundation Rules (core)**
1. `healing-R001` — Implemented — core/formula — Tick of Hit Points Definition
2. `healing-R003` — Implemented — core/formula — Injury Definition (HP Reduction per Injury)
3. `healing-R004` — Implemented — core/condition — Injury Gained from Massive Damage
4. `healing-R005` — Implemented — core/condition — Injury Gained from HP Markers
5. `healing-R006` — Implemented — core/condition — Fainted Condition Definition
6. `healing-R002` — Implemented — core/condition — Rest Definition

**Derived Core Formulas/Conditions/Interactions**
7. `healing-R007` — Implemented — core/formula — Natural Healing Rate (1/16th maxHp)
8. `healing-R010` — Implemented — core/condition — Heavily Injured Threshold (5+)
9. `healing-R013` — Implemented — core/interaction — Multiple Injuries from Single Attack
10. `healing-R022` — Implemented — situational/interaction — Healing Past HP Markers Re-Injury Risk

**Core Constraints**
11. `healing-R017` — Implemented — core/constraint — Injury Does Not Affect HP Marker Thresholds
12. `healing-R008` — Implemented — core/constraint — Rest Requires Continuous Half Hour
13. `healing-R009` — Implemented — core/constraint — Rest HP Recovery Daily Cap (8 Hours)
14. `healing-R011` — Implemented — core/constraint — Heavily Injured Blocks Rest HP Recovery
15. `healing-R025` — Implemented — core/constraint — Daily Injury Healing Cap (3/Day)
16. `healing-R029` — Implemented — core/constraint — Pokemon Center Injury Removal Cap (3/Day)

**Core Workflows**
17. `healing-R014` — Implemented — core/workflow — Fainted Cured by Healing to Positive HP
18. `healing-R018` — Implemented — core/workflow — Take a Breather Core Effects
19. `healing-R023` — Implemented — core/workflow — Natural Injury Healing (24h Timer)
20. `healing-R026` — Implemented — core/workflow — Pokemon Center Base Healing
21. `healing-R032` — Implemented — core/workflow — Extended Rest Clears Persistent Statuses

**Core Modifiers**
22. `healing-R033` — Implemented — core/modifier — Extended Rest Restores Drained AP
23. `healing-R027` — Implemented — core/modifier — Pokemon Center Injury Time Penalty (Under 5)

**Situational Implemented**
24. `healing-R024` — Implemented — situational/workflow — Trainer AP Drain to Remove Injury
25. `healing-R028` — Implemented — situational/modifier — Pokemon Center Injury Time Penalty (5+)

**Partial Rules (present portion to verify)**
26. `healing-R019` — Partial (present: action cost tracking, Tripped/Vulnerable) — core/constraint
27. `healing-R034` — Partial (present: move usage reset on extended rest) — core/workflow
28. `healing-R039` — Partial (present: arbitrary HP healing amounts in combat) — core/enumeration
29. `healing-R040` — Partial (present: manual status condition toggling) — core/enumeration
30. `healing-R042` — Partial (present: drained AP tracking and restoration) — cross-domain-ref/workflow
