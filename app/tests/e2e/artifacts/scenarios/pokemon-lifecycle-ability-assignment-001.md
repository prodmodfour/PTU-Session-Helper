---
scenario_id: pokemon-lifecycle-ability-assignment-001
loop_id: pokemon-lifecycle-mechanic-ability-assignment
tier: mechanic
priority: P1
ptu_assertions: 3
non_deterministic: true
non_deterministic_strategy: set-membership
---

## Description

Validates that the generator assigns exactly 1 ability from the species' first 2 basic
abilities. Tests a species with 2 basic abilities (random pick), a species with only 1
basic ability (always selected), and verifies the ability effect is always empty string
(not looked up from AbilityData). Uses wild spawn to exercise the generator.

## PTU Rule

"All Pokemon are born with a single Ability, chosen from their Basic Abilities. Normally
the GM will decide what Ability a Pokemon starts with, either randomly or by choosing one."
(core/05-pokemon.md, Managing Pokemon — Abilities)

## Species Data

**Zubat (gen1/zubat.md):** Basic Abilities = Inner Focus, Infiltrator (2 choices)
**Caterpie (gen1/caterpie.md):** Basic Abilities = Shield Dust (1 choice only)

## Setup (API)

```
POST /api/encounters { name: "Ability Assignment Test" }
$encounter_id = response.data.id
```

## Actions

### Test 1: Species with 2 Basic Abilities (Zubat)

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Zubat", level: 5 }],
  side: "enemies"
}
$zubat_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$zubat_id
$zubat = response.data
```

### Test 2: Species with 1 Basic Ability (Caterpie)

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Caterpie", level: 5 }],
  side: "enemies"
}
$caterpie_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$caterpie_id
$caterpie = response.data
```

## Assertions

### Test 1: Zubat (2 basic abilities)

1. **Exactly 1 ability assigned:** (App-enforced: ability-assignment)
   **Assert: $zubat.abilities.length = 1**

2. **Ability is from basic list:** (App-enforced: ability-assignment)
   Generator picks randomly from first 2 abilities: Inner Focus or Infiltrator.
   **Assert: $zubat.abilities[0].name is one of ["Inner Focus", "Infiltrator"]**

3. **Ability effect is empty:** (App-enforced)
   The generator does not look up ability effects from AbilityData.
   **Assert: $zubat.abilities[0].effect = ""**

### Test 2: Caterpie (1 basic ability)

4. **Exactly 1 ability assigned:** (App-enforced: ability-assignment)
   **Assert: $caterpie.abilities.length = 1**

5. **Only option selected:** (App-enforced: ability-assignment)
   Caterpie has only 1 basic ability (Shield Dust). It must be selected.
   **Assert: $caterpie.abilities[0].name = "Shield Dust"**

6. **Ability effect is empty:**
   **Assert: $caterpie.abilities[0].effect = ""**

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$zubat_id
DELETE /api/pokemon/$caterpie_id
```
