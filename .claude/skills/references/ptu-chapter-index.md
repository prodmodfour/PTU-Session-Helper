# PTU Chapter Index

Shared reference for all PTU-aware skills. Maps game mechanics to rulebook locations, app code, and key formulas.

## Rulebook Paths

- **Core Rules:** `books/markdown/core/` (12 chapter files)
- **Pokedex:** `books/markdown/pokedexes/` (gen1-gen8 + hisui, one file per species)
- **Errata:** `books/markdown/errata-2.md`
- **Charts:** `books/markdown/useful-charts.md`
- **Pokedex Format Guide:** `books/markdown/pokedexes/how-to-read.md`

## Mechanic-to-Rulebook Map

| Mechanic | Rulebook File | Search Term |
|----------|--------------|-------------|
| Damage calculation | `core/07-combat.md` | "Damage Roll" |
| Type effectiveness | `core/10-indices-and-reference.md` | "Type Chart" |
| Status conditions | `core/07-combat.md` | "Status Afflictions" |
| Combat stages | `core/07-combat.md` | "Combat Stages" |
| Initiative / speed | `core/07-combat.md` | "Initiative" |
| Injuries | `core/07-combat.md` | "Injuries" |
| Resting / healing | `core/07-combat.md` | "Resting" |
| Capture rate | `core/05-pokemon.md` | "Capture Rate" |
| Pokemon evolution | `core/05-pokemon.md` | "Evolution" |
| Move learning | `core/05-pokemon.md` | "Level-Up Moves" |
| Abilities | `core/05-pokemon.md` | "Abilities" |
| Nature / stat adjustment | `core/05-pokemon.md` | "Nature" |
| Trainer stats | `core/02-character-creation.md` | "Stat Points" |
| Trainer classes | `core/04-trainer-classes.md` | (class name) |
| Skills / skill checks | `core/03-skills.md` | (skill name) |
| Movement / terrain | `core/06-playing-the-game.md` | "Movement" |
| Weather effects | `core/06-playing-the-game.md` | "Weather" |
| Encounter tables | `core/11-running-the-game.md` | "Encounter" |
| Wild Pokemon levels | `core/11-running-the-game.md` | "Wild Pokemon" |

## Key Formulas

### HP Calculation
- **Pokemon:** `level + (baseHp * 3) + 10`
- **Trainer:** `(level * 2) + (baseHp * 3) + 10`

### Evasion
- Physical/Special/Speed evasion = `floor(calculatedStat / 5)`
- Uses calculated stats (base + level-up points + nature), NOT base stats
- Max evasion modifier: +6

### Combat Stages
- Range: -6 to +6
- Positive: +20% per stage (multiplicative with stat)
- Negative: -10% per stage (multiplicative with stat)
- Formula: `stat * (1 + stage * 0.2)` for positive, `stat * (1 + stage * 0.1)` for negative

### Damage
- `Damage = Attack Roll + Attack Stat - Defense Stat`
- Attack Roll = dice from Damage Base table + modifiers
- Physical moves use ATK vs DEF
- Special moves use SpATK vs SpDEF
- STAB: +2 to Damage Base when move type matches user type
- Critical hit: maximize damage dice, then roll again and add

### Capture Rate
- Base rate from species data, modified by:
  - Level modifier
  - HP percentage modifier
  - Evolution stage modifier
  - Status conditions (sleep/freeze bonus)
  - Injuries
  - Ball type modifier
  - Shiny/Legendary penalties

### Diagonal Movement
- Alternating cost: 1m, 2m, 1m, 2m...
- Each cell = 1 meter

## App Code Locations

| Mechanic | Client Code | Server Code |
|----------|------------|-------------|
| Combat / damage | `composables/useCombat.ts` | `server/services/combatant.service.ts` |
| Capture | `composables/useCapture.ts` | `server/api/capture/*.ts` |
| Rest / healing | `composables/useRestHealing.ts` | `server/api/characters/[id]/rest.post.ts`, `server/api/pokemon/[id]/rest.post.ts` |
| Move calculation | `composables/useMoveCalculation.ts` | — |
| Stat access | `composables/useEntityStats.ts` | — |
| Range / AoE | `composables/useRangeParser.ts` | — |
| Grid movement | `composables/useGridMovement.ts` | — |
| Encounter management | `composables/useEncounterActions.ts` | `server/services/encounter.service.ts` |
| Pokemon generation | — | `server/services/pokemon-generator.service.ts` |
| Combatant building | — | `server/services/combatant.service.ts` |
| Combat maneuvers | `constants/combatManeuvers.ts` | — |

## Errata Overrides

Always check `books/markdown/errata-2.md` after reading a core chapter. Errata corrections supersede core text. Search for the mechanic name in the errata file.

## How to Look Up Base Stats

Pokemon species data lives in per-Pokemon markdown files:

```
books/markdown/pokedexes/
├── gen1/bulbasaur.md
├── gen1/charmander.md
├── gen2/chikorita.md
├── ...
├── gen8/grookey.md
└── hisui/wyrdeer.md
```

**To find a species file:** lowercase the species name, replace spaces with hyphens.
```
Grep pattern="<species name>" path="books/markdown/pokedexes/" --output_mode files_with_matches
```

**File format:** See `books/markdown/pokedexes/how-to-read.md` for the full format guide. Key sections:
- **Base Stats:** HP, ATK, DEF, SpATK, SpDEF, SPD
- **Type:** Primary and optional secondary type
- **Abilities:** Basic, Advanced, High
- **Level-Up Moves:** Move name + level learned
- **Egg Moves, Tutor Moves, TM Moves**
- **Evolution:** Stage and method
- **Capabilities:** Overland speed, Swim, Jump, Power, etc.

**Generation lookup:** If unsure which gen folder, check `scripts/data/pokemon-gen-lookup.json` which maps every species name to its generation number.
