---
scenario_id: pokemon-lifecycle-workflow-csv-import-001
loop_id: pokemon-lifecycle-workflow-csv-import
tier: workflow
priority: P1
ptu_assertions: 2
mechanics_tested:
  - csv-stat-parsing
  - csv-move-parsing
  - nature-preservation
  - nickname-resolution
  - hp-formula
non_deterministic: false
---

## Narrative

A player joins the game with an existing Eevee from another campaign. The GM exports their
PTU Google Sheet as CSV and imports it. The import preserves the player's exact stat allocation,
Adamant nature (non-Hardy — the only path for non-default natures), moves, and abilities.
The Pokemon appears in the library with origin 'import' and all fields matching the source sheet.

## Species Data (from gen1/eevee.md)

| Field | Value |
|-------|-------|
| Species | Eevee |
| Types | Normal (from SpeciesData lookup — takes precedence over CSV) |
| Base HP | 6 |
| Basic Abilities | Run Away, Sprint |

## CSV Cell Values

The Playtester should construct a CSV string matching the standard PTU Pokemon Sheet cell
positions. Key cell values (0-indexed row, col):

**Identity:**

| Row | Col | Field | Value |
|-----|-----|-------|-------|
| 0 | 0 | Header | Nickname |
| 0 | 1 | Nickname | Buddy |
| 0 | 7 | Header | Species |
| 0 | 9 | Species | Eevee |
| 1 | 1 | Level | 15 |
| 1 | 9 | Gender | M |
| 2 | 1 | Nature | Adamant |
| 2 | 4 | Raised Stat | ATK |
| 2 | 7 | Lowered Stat | SATK |
| 2 | 9 | Shiny | No |
| 11 | 2 | Held Item | Oran Berry |

**Base Stats (Col 1):**

| Row | Stat | Value |
|-----|------|-------|
| 5 | HP | 6 |
| 6 | ATK | 6 |
| 7 | DEF | 5 |
| 8 | SATK | 5 |
| 9 | SDEF | 7 |
| 10 | SPD | 6 |

**Calculated Stats (Col 6):**

| Row | Stat | Value |
|-----|------|-------|
| 5 | HP | 8 |
| 6 | ATK | 12 |
| 7 | DEF | 7 |
| 8 | SATK | 4 |
| 9 | SDEF | 10 |
| 10 | SPD | 9 |

**Max HP (Row 5, Col 9):** 49
- Derivation: level(15) + (calculatedHp(8) × 3) + 10 = 15 + 24 + 10 = **49**

**Types (Row 32):**

| Col | Value |
|-----|-------|
| 0 | Normal |
| 1 | (empty) |

**Moves (Rows 19-20):**

| Row | Col 0 (Name) | Col 1 (Type) | Col 2 (Category) | Col 3 (DB) | Col 7 (Freq) | Col 8 (AC) | Col 9 (Range) | Col 11 (Effect) |
|-----|---|---|---|---|---|---|---|---|
| 19 | Tackle | Normal | Physical | 5 | At-Will | 2 | Melee | -- |
| 20 | Quick Attack | Normal | Physical | 4 | At-Will | 2 | Melee, Priority | The user may take their turn to use Quick Attack before slower foes. |

Move learn-level verification:
- Tackle — learned at L1 (gen1/eevee.md: Level-Up Moves) ✓
- Quick Attack — learned at L13 (gen1/eevee.md: Level-Up Moves) ✓ (Eevee is L15)

**Abilities (Row 41):**

| Row | Col 0 (Name) | Col 1 (Frequency) | Col 3 (Effect) |
|-----|---|---|---|
| 41 | Run Away | Static | The Pokemon may always flee, even when Trapped. |

**Remaining rows:** Fill with empty values (commas only) to reach at least row 41.
Capabilities (rows 31-33) and skills (rows 58-62) are optional — they will be empty.

## Setup (API)

No pre-existing entities needed. The CSV import endpoint creates the Pokemon.

## Phase 1: Import CSV

Construct the CSV string from the cell values above and submit:

```
POST /api/characters/import-csv {
  csvContent: "<constructed CSV string>"
}
$import_response = response
$pokemon_id = response.data.id
```

### Assertions (Phase 1 — Import Response)

1. **Import success:**
   **Assert: response.success = true**
   **Assert: response.type = "pokemon"**

2. **Summary data correct:**
   **Assert: response.data.species = "Eevee"**
   **Assert: response.data.nickname = "Buddy"**
   **Assert: response.data.level = 15**

## Phase 2: Verify Full Pokemon Record

```
GET /api/pokemon/$pokemon_id
```

### Assertions (Phase 2 — Identity)

3. **Species and nickname:**
   **Assert: response.data.species = "Eevee"**
   **Assert: response.data.nickname = "Buddy"**
   **Assert: response.data.level = 15**

4. **Types from SpeciesData (takes precedence over CSV):**
   Eevee exists in SpeciesData, so type lookup uses DB, not CSV.
   **Assert: response.data.types = ["Normal"]**

5. **Gender preserved:**
   **Assert: response.data.gender = "M"**

6. **Not shiny:**
   **Assert: response.data.shiny = false**

7. **Held item preserved:**
   **Assert: response.data.heldItem = "Oran Berry"**

### Assertions (Phase 2 — Nature Preservation)

8. **Nature preserved from CSV (non-Hardy):** (App-enforced: nature-preservation)
   This is the ONLY Pokemon creation path that produces non-Hardy natures.
   **Assert: response.data.nature.name = "Adamant"**
   **Assert: response.data.nature.raisedStat = "ATK"**
   **Assert: response.data.nature.loweredStat = "SATK"**

### Assertions (Phase 2 — Stats)

9. **Base stats from CSV:** (App-enforced: csv-stat-parsing)
   **Assert: response.data.baseStats.hp = 6**
   **Assert: response.data.baseStats.attack = 6**
   **Assert: response.data.baseStats.defense = 5**
   **Assert: response.data.baseStats.specialAttack = 5**
   **Assert: response.data.baseStats.specialDefense = 7**
   **Assert: response.data.baseStats.speed = 6**

10. **Calculated stats from CSV:** (App-enforced: csv-stat-parsing)
    These are the player's final stats after nature + stat point allocation.
    **Assert: response.data.currentStats.attack = 12**
    **Assert: response.data.currentStats.defense = 7**
    **Assert: response.data.currentStats.specialAttack = 4**
    **Assert: response.data.currentStats.specialDefense = 10**
    **Assert: response.data.currentStats.speed = 9**

11. **Max HP from CSV:** (App-enforced: hp-formula)
    maxHp = level(15) + (calculatedHp(8) × 3) + 10 = 15 + 24 + 10 = **49**
    **Assert: response.data.maxHp = 49**
    **Assert: response.data.currentHp = 49** (starts at full HP)

### Assertions (Phase 2 — Moves)

12. **Moves preserved from CSV:** (App-enforced: csv-move-parsing)
    **Assert: response.data.moves.length = 2**
    **Assert: moves contain "Tackle" with type "Normal", damageClass "Physical"**
    **Assert: moves contain "Quick Attack" with type "Normal", damageClass "Physical"**

### Assertions (Phase 2 — Abilities)

13. **Abilities preserved from CSV:**
    **Assert: response.data.abilities.length = 1**
    **Assert: response.data.abilities[0].name = "Run Away"**

### Assertions (Phase 2 — Origin and Metadata)

14. **Origin is import:** (App-enforced)
    **Assert: response.data.origin = "import"**
    **Assert: response.data.isInLibrary = true**

## Teardown

```
DELETE /api/pokemon/$pokemon_id
```
