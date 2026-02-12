# Verify PTU Rules Compliance

Verify that recent code changes correctly implement PTU 1.05 mechanics.

## Trigger

Use this skill when:
- User runs `/verify-ptu`
- After editing game mechanics code
- When implementing new PTU features

## Instructions

You are verifying that code changes correctly implement Pokemon Tabletop United 1.05 rules.

### Step 1: Identify Changed Mechanics

Check what mechanics-related files were recently modified:

```bash
git diff --name-only HEAD~3 | grep -E "(combat|capture|heal|damage|rest|move|stat|encounter)" || echo "No recent mechanics changes"
```

Or if checking specific files, read them directly.

### Step 2: Map Changes to Rulebook Sections

**Key rulebook locations:**

| Mechanic | Rulebook Section |
|----------|------------------|
| Damage calculation | `core/07-combat.md` - search "Damage Roll" |
| Type effectiveness | `core/10-indices-and-reference.md` - search "Type Chart" |
| Status conditions | `core/07-combat.md` - search "Status Afflictions" |
| Capture rate | `core/05-pokemon.md` - search "Capture Rate" |
| Rest/healing | `core/07-combat.md` - search "Resting" |
| Combat stages | `core/07-combat.md` - search "Combat Stages" |
| Initiative/speed | `core/07-combat.md` - search "Initiative" |
| Injuries | `core/07-combat.md` - search "Injuries" |
| Pokemon stats | `pokedexes/gen*/` or `pokedexes/hisui/` - species-specific data |
| Errata/corrections | `errata-2.md` - rule corrections |

### Step 3: Cross-Reference Implementation

For each changed mechanic:

1. **Read the code** - Understand what the implementation does
2. **Read the rulebook** - Find the corresponding PTU rule using Grep:
   ```
   Grep pattern="<mechanic keyword>" path="/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/core/"
   ```
   For species data:
   ```
   Grep pattern="<pokemon name>" path="/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/pokedexes/"
   ```
3. **Compare** - Check if the code matches the rules

### Step 4: Report Findings

Output a structured report:

```markdown
## PTU Rules Verification Report

### Files Checked
- [ ] `composables/useCombat.ts`
- [ ] `server/services/combatant.service.ts`

### Mechanics Verified

#### Damage Calculation
- **Rule**: [Quote from rulebook]
- **Implementation**: [What the code does]
- **Status**: CORRECT / INCORRECT / NEEDS REVIEW

#### [Other mechanics...]

### Issues Found
1. [Description of any rule violations]

### Recommendations
- [Suggested fixes if any issues found]
```

## Rulebook Paths

- Core Rules: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/core/` (12 chapter files)
- Pokedex: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/pokedexes/` (gen1-gen8 + hisui dirs)
- Errata: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/errata-2.md`
- Charts: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/useful-charts.md`

## Key Files Containing Game Mechanics

**Composables (client-side logic):**
- `app/composables/useCombat.ts` - Combat calculations
- `app/composables/useCapture.ts` - Capture mechanics
- `app/composables/useRestHealing.ts` - Rest and healing
- `app/composables/useMoveCalculation.ts` - Move calculations
- `app/composables/useEntityStats.ts` - Stat calculations

**Services (server-side logic):**
- `app/server/services/combatant.service.ts` - Damage, healing, status effects
- `app/server/services/encounter.service.ts` - Encounter management

**Constants:**
- `app/constants/combatManeuvers.ts` - Combat maneuver definitions

**API routes:**
- `app/server/api/encounters/[id]/damage.post.ts`
- `app/server/api/encounters/[id]/heal.post.ts`
- `app/server/api/capture/*.ts`
