---
scenario_id: pokemon-lifecycle-workflow-wild-spawn-001
loop_id: pokemon-lifecycle-workflow-wild-spawn
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - hp-formula
  - stat-point-distribution
  - move-selection-from-learnset
  - ability-assignment
  - nickname-resolution
  - species-data-lookup
  - capability-inheritance
  - skill-inheritance
non_deterministic: true
non_deterministic_strategy: query-then-compute
---

## Narrative

The GM is mid-session and needs a wild opponent for the party. They have an active encounter
open and spawn a single level 10 Zubat. The system looks up Zubat's species data, distributes
stat points, selects moves from its learnset, picks a random basic ability, auto-generates a
nickname, and adds the Pokemon as an enemy combatant.

## Species Data (from gen1/zubat.md)

| Field | Value |
|-------|-------|
| Species | Zubat |
| Types | Poison, Flying |
| Base HP | 4 |
| Base ATK | 5 |
| Base DEF | 4 |
| Base SpATK | 3 |
| Base SpDEF | 4 |
| Base SPD | 6 |
| Base Stat Total | 26 |
| Basic Abilities | Inner Focus, Infiltrator |
| Evolution Stage | 1 of 3 (Zubat -> Golbat -> Crobat) |

**Learnset at or below Level 10:**

| Level | Move |
|-------|------|
| 1 | Leech Life |
| 5 | Supersonic |
| 7 | Astonish |

3 moves available. All 3 should be selected (below the 6-move cap).

## Setup (API)

```
POST /api/encounters { name: "Route 3: Wild Zubat Test" }
$encounter_id = response.data.id
```

## Phase 1: Wild Spawn

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Zubat", level: 10 }],
  side: "enemies"
}
$pokemon_id = response.data.addedPokemon[0].pokemonId
$combatant_id = response.data.addedPokemon[0].combatantId
```

### Assertions (Phase 1 — Spawn Response)

1. **Spawn response structure:**
   addedPokemon array length = 1
   addedPokemon[0].species = "Zubat"
   addedPokemon[0].level = 10
   **Assert: response.data.addedPokemon[0].species = "Zubat"**
   **Assert: response.data.addedPokemon[0].level = 10**

2. **Encounter includes new combatant:**
   The encounter response should contain the new combatant on the "enemies" side
   **Assert: encounter combatants include $combatant_id on side "enemies"**

## Phase 2: Verify Pokemon Record

```
GET /api/pokemon/$pokemon_id
$pokemon = response.data
```

### Assertions (Phase 2 — Species Data Lookup)

3. **Species and types from SpeciesData:** (App-enforced: species-data-lookup)
   Zubat is Poison/Flying per SpeciesData
   **Assert: $pokemon.species = "Zubat"**
   **Assert: $pokemon.types = ["Poison", "Flying"]**

4. **Level preserved from request:** (App-enforced)
   **Assert: $pokemon.level = 10**

5. **Base stats match SpeciesData:** (App-enforced: species-data-lookup)
   **Assert: $pokemon.baseStats.hp = 4**
   **Assert: $pokemon.baseStats.attack = 5**
   **Assert: $pokemon.baseStats.defense = 4**
   **Assert: $pokemon.baseStats.specialAttack = 3**
   **Assert: $pokemon.baseStats.specialDefense = 4**
   **Assert: $pokemon.baseStats.speed = 6**

### Assertions (Phase 2 — Stat Distribution)

6. **Stat points: total distributed = level - 1 = 9:** (App-enforced: stat-point-distribution, hp-formula)
   The generator distributes `level - 1` = 9 stat points across all 6 stats.
   Non-HP calculated stats are in `currentStats`. Calculated HP stat is derived from maxHp.

   ```
   calculatedHp = (maxHp - level - 10) / 3
   hpDistributed = calculatedHp - baseStats.hp
   atkDistributed = currentStats.attack - baseStats.attack
   defDistributed = currentStats.defense - baseStats.defense
   spAtkDistributed = currentStats.specialAttack - baseStats.specialAttack
   spDefDistributed = currentStats.specialDefense - baseStats.specialDefense
   spdDistributed = currentStats.speed - baseStats.speed
   totalDistributed = hpDistributed + atkDistributed + defDistributed
                    + spAtkDistributed + spDefDistributed + spdDistributed
   ```

   **Assert: ($pokemon.maxHp - 10 - 10) is divisible by 3** (HP formula integrity)
   **Assert: totalDistributed = 9**

7. **Each calculated stat >= base stat:** (App-enforced: stat-point-distribution)
   Points are added, never subtracted. Minimum calculated stat = base stat.
   **Assert: $pokemon.currentStats.attack >= 5**
   **Assert: $pokemon.currentStats.defense >= 4**
   **Assert: $pokemon.currentStats.specialAttack >= 3**
   **Assert: $pokemon.currentStats.specialDefense >= 4**
   **Assert: $pokemon.currentStats.speed >= 6**
   **Assert: calculatedHp >= 4** (derived from maxHp)

### Assertions (Phase 2 — HP Formula)

8. **HP formula: maxHp = level + (calculatedHp * 3) + 10:** (App-enforced: hp-formula)
   With level 10 and base HP 4:
   Minimum maxHp (0 HP points): 10 + (4 * 3) + 10 = 32
   Maximum maxHp (all 9 points to HP): 10 + (13 * 3) + 10 = 59
   **Assert: $pokemon.maxHp >= 32**
   **Assert: $pokemon.maxHp <= 59**
   **Assert: $pokemon.currentHp = $pokemon.maxHp** (starts at full health)

### Assertions (Phase 2 — Move Selection)

9. **Moves from learnset at or below level 10:** (App-enforced: move-selection-from-learnset)
   Zubat's learnset at ≤ L10: Leech Life (L1), Supersonic (L5), Astonish (L7)
   Only 3 moves available, below the 6-move cap, so all 3 are selected.

   Move learn-level verification:
   - Leech Life — learned at L1 (gen1/zubat.md: Level-Up Moves) ✓
   - Supersonic — learned at L5 (gen1/zubat.md: Level-Up Moves) ✓
   - Astonish — learned at L7 (gen1/zubat.md: Level-Up Moves) ✓

   **Assert: $pokemon.moves.length = 3**
   **Assert: move names include "Leech Life"**
   **Assert: move names include "Supersonic"**
   **Assert: move names include "Astonish"**

### Assertions (Phase 2 — Ability Assignment)

10. **Single ability from basic list:** (App-enforced: ability-assignment)
    Zubat's basic abilities: Inner Focus, Infiltrator.
    Generator picks one randomly from the first 2.
    **Assert: $pokemon.abilities.length = 1**
    **Assert: $pokemon.abilities[0].name is one of ["Inner Focus", "Infiltrator"]**

### Assertions (Phase 2 — Metadata)

11. **Auto-generated nickname:** (App-enforced: nickname-resolution)
    No nickname provided, so resolveNickname generates "Zubat N" where N = count + 1.
    **Assert: $pokemon.nickname matches pattern /^Zubat \d+$/**

12. **Origin and library flags:** (App-enforced)
    **Assert: $pokemon.origin = "wild"**
    **Assert: $pokemon.isInLibrary = true**

13. **Gender is valid:** (App-enforced: 50/50 random)
    **Assert: $pokemon.gender is one of ["Male", "Female"]**

14. **Fresh combat state:** (App-enforced)
    **Assert: $pokemon.injuries = 0**
    **Assert: $pokemon.statusConditions = []**

### Assertions (Phase 2 — Capability and Skill Inheritance)

15. **Capabilities inherited from SpeciesData:** (App-enforced: capability-inheritance)
    Zubat capabilities: Overland 2, Swim 1, Sky 5, Jump 1/1, Power 1
    **Assert: $pokemon.capabilities includes overland = 2**
    **Assert: $pokemon.capabilities includes sky = 5**
    **Assert: $pokemon.capabilities includes power = 1**

16. **Skills inherited from SpeciesData:** (App-enforced: skill-inheritance)
    Zubat has skills from SpeciesData (exact values depend on seed data).
    **Assert: $pokemon.skills is a non-empty object**

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pokemon_id
```
