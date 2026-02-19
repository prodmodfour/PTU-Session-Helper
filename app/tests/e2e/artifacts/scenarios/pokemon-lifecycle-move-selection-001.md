---
scenario_id: pokemon-lifecycle-move-selection-001
loop_id: pokemon-lifecycle-mechanic-move-selection
tier: mechanic
priority: P1
ptu_assertions: 4
non_deterministic: true
non_deterministic_strategy: deterministic-move-selection
---

## Description

Validates move selection from learnset: the generator filters species learnset to entries
at or below the Pokemon's level, then takes the last 6 (most recently learned). Tests three
cases: fewer than 6 available (all selected), exactly 6 available, and more than 6 available
(oldest dropped). Uses wild spawn to exercise the generator's move selection.

Note: While stat distribution is non-deterministic, move selection is deterministic — it
always picks the same moves for a given species and level.

## PTU Rule

"A Pokemon may fill as many of its Move slots as it likes with Moves from its Natural Move
List." and "Pokemon may learn a maximum of 6 Moves from all sources combined."
(core/05-pokemon.md, Managing Pokemon — Moves)

## Species Data

**Caterpie (gen1/caterpie.md) — Learnset:**

| Level | Move |
|-------|------|
| 1 | String Shot |
| 1 | Tackle |
| 15 | Bug Bite |

**Eevee (gen1/eevee.md) — Learnset:**

| Level | Move |
|-------|------|
| 1 | Helping Hand |
| 1 | Growl |
| 1 | Tackle |
| 1 | Tail Whip |
| 5 | Sand Attack |
| 9 | Baby-Doll Eyes |
| 13 | Quick Attack |
| 17 | Bite |
| 21 | Covet |
| 25 | Take Down |

## Setup (API)

```
POST /api/encounters { name: "Move Selection Test" }
$encounter_id = response.data.id
```

## Actions

### Test 1: Fewer than 6 Moves Available (Caterpie L5)

At level 5, Caterpie has 2 moves available: String Shot (L1), Tackle (L1). Bug Bite (L15) is
above level. All 2 should be selected.

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Caterpie", level: 5 }],
  side: "enemies"
}
$caterpie_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$caterpie_id
$cat = response.data
```

### Test 2: Exactly 6 Moves Available (Eevee L9)

At level 9, Eevee has 6 moves available: Helping Hand (L1), Growl (L1), Tackle (L1),
Tail Whip (L1), Sand Attack (L5), Baby-Doll Eyes (L9). Exactly 6, all selected.

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Eevee", level: 9 }],
  side: "enemies"
}
$eevee9_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$eevee9_id
$ev9 = response.data
```

### Test 3: More than 6 Moves Available (Eevee L25)

At level 25, Eevee has 10 moves available (L1 × 4, L5, L9, L13, L17, L21, L25).
Last 6 = Sand Attack (L5), Baby-Doll Eyes (L9), Quick Attack (L13), Bite (L17),
Covet (L21), Take Down (L25). The four L1 moves are dropped.

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Eevee", level: 25 }],
  side: "enemies"
}
$eevee25_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$eevee25_id
$ev25 = response.data
```

## Assertions

### Test 1: Caterpie L5

1. **2 moves selected (all available):** (App-enforced: move-selection-from-learnset)
   **Assert: $cat.moves.length = 2**
   **Assert: move names include "String Shot"**
   **Assert: move names include "Tackle"**

2. **Bug Bite NOT included (above level 5):**
   **Assert: move names do NOT include "Bug Bite"**

### Test 2: Eevee L9

3. **6 moves selected (all available):** (App-enforced: move-selection-from-learnset)
   **Assert: $ev9.moves.length = 6**
   **Assert: move names include "Helping Hand"**
   **Assert: move names include "Growl"**
   **Assert: move names include "Tackle"**
   **Assert: move names include "Tail Whip"**
   **Assert: move names include "Sand Attack"**
   **Assert: move names include "Baby-Doll Eyes"**

### Test 3: Eevee L25

4. **6 moves selected (most recent 6):** (App-enforced: move-selection-from-learnset, 6-move-cap)
   The last 6 of 10 available moves. The four L1 moves (Helping Hand, Growl, Tackle,
   Tail Whip) are dropped in favor of higher-level moves.

   **Assert: $ev25.moves.length = 6**
   **Assert: move names include "Sand Attack"** (L5)
   **Assert: move names include "Baby-Doll Eyes"** (L9)
   **Assert: move names include "Quick Attack"** (L13)
   **Assert: move names include "Bite"** (L17)
   **Assert: move names include "Covet"** (L21)
   **Assert: move names include "Take Down"** (L25)

5. **Older moves dropped:**
   **Assert: move names do NOT include "Helping Hand"**
   **Assert: move names do NOT include "Growl"**
   **Assert: move names do NOT include "Tackle"**
   **Assert: move names do NOT include "Tail Whip"**

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$caterpie_id
DELETE /api/pokemon/$eevee9_id
DELETE /api/pokemon/$eevee25_id
```
