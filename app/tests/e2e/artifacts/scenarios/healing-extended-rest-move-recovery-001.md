---
scenario_id: healing-extended-rest-move-recovery-001
loop_id: healing-mechanic-extended-rest-move-recovery
tier: mechanic
priority: P1
ptu_assertions: 3
---

## Narrative

Validates that extended rest for Pokemon resets `usedToday` to 0 on all moves, and additionally resets `usedThisScene` to 0 for daily-frequency moves only. At-Will and EOT moves retain their `usedThisScene` count. Character extended rest does NOT touch moves (characters don't have move frequency tracking).

## Setup (API)

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 15,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 5,
  "baseSpAtk": 7,
  "baseSpDef": 7,
  "baseSpeed": 5,
  "types": ["Grass", "Poison"],
  "moves": [
    { "name": "Tackle", "type": "Normal", "frequency": "At-Will", "db": 5, "ac": 2, "damageClass": "Physical", "usedToday": 4, "usedThisScene": 2 },
    { "name": "Leech Seed", "type": "Grass", "frequency": "EOT", "db": 0, "ac": 4, "damageClass": "Status", "usedToday": 2, "usedThisScene": 1 },
    { "name": "Sleep Powder", "type": "Grass", "frequency": "Daily x2", "db": 0, "ac": 6, "damageClass": "Status", "usedToday": 2, "usedThisScene": 1 },
    { "name": "Solar Beam", "type": "Grass", "frequency": "Daily x1", "db": 12, "ac": 2, "damageClass": "Special", "usedToday": 1, "usedThisScene": 1 }
  ]
}
$pokemon_id = response.data.id
<!-- maxHp = 40. Set to full HP so extended rest focuses on move recovery -->

**Non-deterministic API check:** Pokemon created via explicit `POST` with base stats — deterministic.

## Actions

POST /api/pokemon/$pokemon_id/extended-rest

## Assertions

1. **Daily moves restored (reported in response):**
   Sleep Powder (Daily x2): usedToday > 0 → restored
   Solar Beam (Daily x1): usedToday > 0 → restored
   **Assert: response.data.restoredMoves includes "Sleep Powder"** (App-enforced: daily frequency detected)
   **Assert: response.data.restoredMoves includes "Solar Beam"** (App-enforced: daily frequency detected)

2. **All moves have usedToday reset:**
   Verify via GET /api/pokemon/$pokemon_id:
   Tackle (At-Will): usedToday = 0 (was 4), usedThisScene = 2 (unchanged)
   Leech Seed (EOT): usedToday = 0 (was 2), usedThisScene = 1 (unchanged)
   **Assert: all moves have usedToday = 0** (App-enforced: extended-rest resets all)

3. **Daily moves also have usedThisScene reset:**
   Sleep Powder (Daily x2): usedThisScene = 0 (was 1)
   Solar Beam (Daily x1): usedThisScene = 0 (was 1)
   Non-daily moves retain usedThisScene:
   Tackle: usedThisScene = 2 (unchanged)
   Leech Seed: usedThisScene = 1 (unchanged)
   **Assert: daily-frequency moves have usedThisScene = 0** (App-enforced: daily detection + reset)
   **Assert: non-daily moves retain usedThisScene** (App-enforced: only daily frequency resets scene count)

## Teardown

DELETE /api/pokemon/$pokemon_id
