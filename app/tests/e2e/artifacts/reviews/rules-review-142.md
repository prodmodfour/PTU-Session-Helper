---
review_id: rules-review-142
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003-track-b-p0
domain: player-view
commits_reviewed:
  - 8f2f0fc
  - 3b62b67
  - 9ad897e
  - 1131ee0
  - 0a6c8b3
  - 6ed4904
  - 8128905
mechanics_verified:
  - character-data-completeness
  - pokemon-data-completeness
  - import-edit-scope-safety
  - evasion-display
  - move-import-integrity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#trainer-stats
  - core/05-pokemon.md#base-stats
  - core/07-combat.md#combat-stages
  - core/07-combat.md#evasion
reviewed_at: 2026-02-24T19:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Character Data Completeness (Export)

- **Rule:** A PTU Trainer character sheet includes: stats (HP, Attack, Defense, SpAtk, SpDef, Speed), level, trainer classes, skills (with ranks), features, edges, equipment (6 slots), inventory, money, status conditions, combat stage modifiers, injuries, AP (current/drained/bound), and background/personality/goals. (`core/02-character-creation.md`)
- **Implementation:** The export endpoint (`app/server/api/player/export/[characterId].get.ts`) delegates to `serializeCharacter()` from `app/server/utils/serializers.ts`. This serializer includes:
  - All 6 base stats (hp, attack, defense, specialAttack, specialDefense, speed) nested under `stats`
  - `currentHp`, `maxHp`, `level`
  - `trainerClasses`, `skills`, `features`, `edges` (all JSON-parsed from DB)
  - `equipment` (6-slot object), `inventory`, `money`
  - `statusConditions`, `stageModifiers`, `injuries`, `temporaryHp`
  - `drainedAp`, `boundAp`, `currentAp`
  - `background`, `personality`, `goals`, `notes`
  - Rest/healing tracking fields (`lastInjuryTime`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`)
  - Player info (`playedBy`, `age`, `gender`, `height`, `weight`)
  - Library state (`isInLibrary`, `location`, `avatarUrl`)
- **Status:** CORRECT -- All PTU-relevant trainer character fields are exported. No fields from the `HumanCharacter` Prisma model are omitted.

### 2. Pokemon Data Completeness (Export)

- **Rule:** A PTU Pokemon sheet includes: species, level, experience, nature, types, base stats (6), calculated stats (6), current HP, max HP, abilities, moves (with full data), held item, capabilities (overland/swim/sky/burrow/etc.), skills, tutor points, training exp, egg groups, stage modifiers, status conditions, injuries, temporary HP, gender, shiny status, sprite. (`core/05-pokemon.md`)
- **Implementation:** The export endpoint uses `serializePokemon()` (line 35, `character.pokemon.map(serializePokemon)`), NOT the more limited `serializeLinkedPokemon()`. The full `serializePokemon()` serializer includes:
  - `species`, `nickname`, `level`, `experience`
  - `nature` (JSON-parsed object with name/raisedStat/loweredStat)
  - `types` (array derived from `type1`/`type2`)
  - `baseStats` (all 6), `currentStats` (all 6)
  - `currentHp`, `maxHp`
  - `stageModifiers` (JSON-parsed)
  - `abilities` (JSON-parsed), `moves` (JSON-parsed with full move data)
  - `heldItem`, `capabilities` (JSON-parsed)
  - `skills` (JSON-parsed), `tutorPoints`, `trainingExp`
  - `eggGroups` (JSON-parsed)
  - `statusConditions` (JSON-parsed), `injuries`, `temporaryHp`
  - `ownerId`, `spriteUrl`, `shiny`, `gender`
  - `isInLibrary`, `origin`, `location`, `notes`
  - Rest/healing tracking (`lastInjuryTime`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`)
- **Status:** CORRECT -- All PTU-relevant Pokemon fields are exported. The choice of `serializePokemon` (full serializer) over `serializeLinkedPokemon` (summary serializer) is correct for a complete export.

### 3. Import Edit Scope Safety

- **Rule:** Per the design spec (`design-player-view-infra-001.md`, "What Players Can Edit Offline" table), only these fields are player-editable offline: character background/personality/goals/notes, Pokemon nicknames, Pokemon held items, Pokemon move order/selection from known moves. All mechanical fields (stats, new moves, equipment, money, inventory) require GM context and are NOT editable.
- **Implementation:** The import endpoint (`app/server/api/player/import/[characterId].post.ts`) enforces this through:
  - **Character**: Only `background`, `personality`, `goals`, `notes` are iterated (line 107: `const charEditableFields = ['background', 'personality', 'goals', 'notes'] as const`). No stat, equipment, money, or inventory fields are writable.
  - **Pokemon**: Only `nickname`, `heldItem`, and `moves` (reorder only) are processed (lines 159, 179, 199). No stat, ability, or level fields are writable.
  - **Move reorder safety**: The import filters moves to only accept IDs that already exist on the server (line 201-205: `const validImportMoves = importPokemon.moves.filter(m => serverMoveIds.has(m.id))`). This prevents injecting new moves the Pokemon doesn't know. The server-side move data is preserved (line 209-211: `serverMoves.find(sm => sm.id === importMove.id)`) -- only the ORDER changes, not the move data itself.
  - **Zod validation**: The import payload is validated with a Zod schema that uses `.passthrough()` on character and `.optional()` on pokemon, so extra fields in the payload are ignored, not applied.
- **Status:** CORRECT -- The import enforces a conservative edit scope that prevents players from modifying combat-relevant mechanical values. GM authority over game state is preserved.

### 4. Evasion Display in PlayerCharacterSheet

- **Rule:** "Physical Evasion = floor(Defense / 5), Special Evasion = floor(Special Defense / 5), Speed Evasion = floor(Speed / 5)" using calculated stats (base + nature + level-up), NOT base stats. Combat stages apply as multipliers before the division. (`core/07-combat.md`, evasion section)
- **Implementation:** The `PlayerCharacterSheet.vue` (lines 347-361) computes evasions using `calculateEvasion()` from `utils/damageCalculation.ts`. It passes:
  - `props.character.stats.defense` / `.specialDefense` / `.speed` -- these are the **calculated stats** from the serializer (which maps `character.defense`, `character.specialDefense`, `character.speed` from the DB -- these are the calculated stat values, not base stats)
  - `props.character.stageModifiers.defense` / `.specialDefense` / `.speed` -- combat stage modifiers
  - `evasionBonus` from equipment bonuses
  - `statBonus` (e.g., Focus item +5) from equipment bonuses
  - The `calculateEvasion` function applies `applyStageModifier(baseStat, combatStage)` which uses the asymmetric stage multiplier table (positive = +20%/stage, negative = -10%/stage), then divides by 5 and floors, capped at 6, clamped to min 0.
- **Status:** CORRECT -- Evasion calculation uses the correct formula with calculated stats, asymmetric combat stages, and proper equipment bonus stacking.

### 5. Move Import Integrity

- **Rule:** In PTU, Pokemon learn moves through level-up, TM, tutor, or egg moves. A Pokemon can only use moves it has learned. The move list is managed by the GM during level-up events. (`core/05-pokemon.md`)
- **Implementation:** The import endpoint's move handling (lines 199-235) ensures:
  1. Only moves with IDs matching existing server-side moves are accepted (`serverMoveIds.has(m.id)`)
  2. The actual move DATA comes from the server (`serverMoves.find(sm => sm.id === importMove.id)`), not from the import payload
  3. Moves not included in the import are appended at the end (not deleted)
  4. The net effect is strictly a reorder operation -- no new moves can be added, no move data can be tampered with
- **Status:** CORRECT -- The import cannot introduce moves the Pokemon doesn't know, preserving PTU move learning rules.

## Summary

Track B P0 is a pure infrastructure feature (JSON export/import for offline data portability + LAN address display). There are no heavy PTU mechanical calculations being introduced. The implementation correctly:

1. **Exports all PTU-relevant fields** for both trainers and Pokemon using the full serializers, ensuring data completeness for offline review.
2. **Restricts import scope** to only flavor/planning fields (background, personality, goals, notes, nicknames, held items, move order), preventing players from modifying combat-mechanical values without GM oversight.
3. **Preserves move integrity** by only allowing reorder of existing server-side moves, not injection of new ones.
4. **Correctly displays evasion** in the PlayerCharacterSheet using calculated stats with asymmetric combat stages per PTU rules.
5. **Handles conflicts conservatively** -- server wins when the server has been modified after the export timestamp.

The `ServerAddressDisplay` component and server-info endpoint are purely networking infrastructure with no PTU mechanical implications.

## Rulings

No rulings required. No PTU mechanics are being computed incorrectly or omitted.

## Verdict

**APPROVED** -- No PTU rule violations found. All exported data is complete, import scope is correctly restricted, and the PlayerCharacterSheet evasion display uses the correct formula.

## Required Changes

None.
