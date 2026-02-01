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
| Damage calculation | `Pokemon Tabletop United 1.05 Core.md` - search "Damage Roll" |
| Type effectiveness | `Pokemon Tabletop United 1.05 Core.md` - search "Type Chart" |
| Status conditions | `Pokemon Tabletop United 1.05 Core.md` - search "Status Afflictions" |
| Capture rate | `Pokemon Tabletop United 1.05 Core.md` - search "Capture Rate" |
| Rest/healing | `Pokemon Tabletop United 1.05 Core.md` - search "Resting" |
| Combat stages | `Pokemon Tabletop United 1.05 Core.md` - search "Combat Stages" |
| Initiative/speed | `Pokemon Tabletop United 1.05 Core.md` - search "Initiative" |
| Injuries | `Pokemon Tabletop United 1.05 Core.md` - search "Injuries" |
| Pokemon stats | `Combined_Pokedex.md` - species-specific data |
| Errata/corrections | `errata_2.md` - rule corrections |

### Step 3: Cross-Reference Implementation

For each changed mechanic:

1. **Read the code** - Understand what the implementation does
2. **Read the rulebook** - Find the corresponding PTU rule using Grep:
   ```
   Grep pattern="<mechanic keyword>" path="/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/"
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

- Core Rules: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/Pokemon Tabletop United 1.05 Core.md`
- Pokedex: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/Combined_Pokedex.md`
- Errata: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/errata_2.md`
- Charts: `/home/ashraf/pokemon_ttrpg/session_helper/books/markdown/Useful Charts.md`

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
