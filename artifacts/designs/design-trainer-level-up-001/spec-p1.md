# P1 Specification

## D. Edge Selection at Milestone Levels

### New File: `app/components/levelup/LevelUpEdgeSection.vue`

Handles edge selection during level-up. There are two sources of edges during advancement:

1. **Regular edges:** +1 edge per even level (2, 4, 6, 8, ...)
2. **Bonus Skill Edges:** +1 Skill Edge at levels 2, 6, and 12 (with rank-up restriction)

Both are presented in this single step.

#### PTU Rules (Core pp. 19-21)

- Every even level: gain 1 Edge for which you qualify
- Level 2: gain 1 bonus Skill Edge. It **may not be used to rank up a skill to Adept Rank** (the rank just unlocked at this level)
- Level 6: gain 1 bonus Skill Edge. It **may not be used to rank up a skill to Expert Rank**
- Level 12: gain 1 bonus Skill Edge. It **may not be used to rank up a skill to Master Rank**

The restriction means the bonus Skill Edge at a skill-cap milestone cannot raise a skill to the **newly unlocked** cap. For example, at level 2, the Adept cap unlocks, and the bonus Skill Edge can raise a skill to Novice but not to Adept. The regular edge gained at the same level (if even) has no such restriction.

#### Props

```typescript
interface Props {
  /** Current edges on the character */
  currentEdges: string[]
  /** Current skill ranks (including pending rank-ups from skill step) */
  effectiveSkills: Record<PtuSkillName, SkillRank>
  /** Regular edges to choose in this level-up session */
  regularEdgesTotal: number
  /** Bonus Skill Edges to choose (from levels 2/6/12 crossed in this advancement) */
  bonusSkillEdges: Array<{
    level: number
    restrictedRank: SkillRankName  // Cannot raise to this rank with this edge
  }>
  /** Edges chosen so far (regular) */
  edgeChoices: string[]
  /** Bonus Skill Edge choices so far */
  bonusSkillEdgeChoices: Array<{ skill: PtuSkillName; fromLevel: number }>
  /** Target level (for general skill rank cap) */
  targetLevel: number
  /** Warnings */
  warnings: CreationWarning[]
}
```

#### Events

```typescript
interface Emits {
  addEdge: [edgeName: string]
  removeEdge: [index: number]
  addBonusSkillEdge: [skill: PtuSkillName, fromLevel: number]
  removeBonusSkillEdge: [index: number]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ Edges (+2 regular, +1 bonus Skill Edge) │
│                                         │
│ ── Regular Edges (2 remaining) ──       │
│ [Enter edge name...        ] [Add Edge] │
│ Selected: Basic Pokeball Proficiency    │
│                                         │
│ ── Bonus Skill Edge (Lv2) ──           │
│ Cannot raise to Adept with this edge.   │
│ ┌─ Body ─────────────────────────────┐ │
│ │ Acrobatics  [Untrained → Novice]   │ │
│ │ Athletics   [Novice]    (blocked)  │ │
│ │ ...                                 │ │
│ └────────────────────────────────────┘ │
│ Selected: Skill Edge: Acrobatics       │
└─────────────────────────────────────────┘
```

#### Component Reuse

This component reuses patterns from `EdgeSelectionSection.vue` (the creation component):
- Free-text edge input with "Add Edge" button (blocks `Skill Edge:` prefix per decree-027 pattern)
- Skill Edge dropdown with category grouping (Body/Mind/Spirit)
- Tag display for selected edges with [x] remove

Key differences from creation:
- **Pathetic skills CAN be raised** during level-up (decree-027 only applies to creation)
- **Bonus Skill Edge has rank restriction:** at level 2, cannot raise to Adept; at level 6, cannot raise to Expert; at level 12, cannot raise to Master
- Multiple bonus Skill Edge slots may appear if the level jump crosses multiple milestones (e.g., jumping from level 1 to level 7 grants bonus Skill Edges for both level 2 and level 6)

#### Bonus Skill Edge Rank Restriction Logic

```typescript
function isBonusSkillEdgeBlocked(
  skill: PtuSkillName,
  restrictedRank: SkillRankName
): boolean {
  const effectiveRank = props.effectiveSkills[skill]
  const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
  const currentIndex = rankProgression.indexOf(effectiveRank)
  const nextRank = rankProgression[currentIndex + 1]
  // Blocked if the next rank matches the restricted rank
  return nextRank === restrictedRank
}
```

Example: At level 2, `restrictedRank = 'Adept'`. A skill at Novice has next rank Adept, so it is blocked. A skill at Untrained has next rank Novice, so it is allowed. A skill at Pathetic has next rank Untrained, so it is allowed.

---

## E. Feature Selection at Milestone Levels

### New File: `app/components/levelup/LevelUpFeatureSection.vue`

Handles feature selection during level-up. Features are gained at odd levels starting from level 3.

#### PTU Rules (Core pp. 19-21)

- Every odd level (3, 5, 7, ...): gain 1 Feature
- Features must come from owned class feature lists (not enforced by the tool -- the GM knows the rules)
- Free-text input (same rationale as creation: hundreds of features across classes, no complete database)

#### Props

```typescript
interface Props {
  /** Current features on the character */
  currentFeatures: string[]
  /** Features chosen so far in this level-up session */
  featureChoices: string[]
  /** Total features to choose */
  totalFeatures: number
  /** Features remaining to choose */
  featuresRemaining: number
  /** Current trainer classes (for informational display) */
  trainerClasses: string[]
}
```

#### Events

```typescript
interface Emits {
  addFeature: [featureName: string]
  removeFeature: [index: number]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ Features (+2)                           │
│                                         │
│ Features Remaining: 1 / 2              │
│                                         │
│ Your Classes: Ace Trainer,              │
│   Type Ace: Fire                        │
│                                         │
│ [Enter feature name...       ] [Add]    │
│                                         │
│ Selected:                               │
│   Elite Trainer                         │
│                                         │
│ Tip: Features should come from your     │
│ owned class feature lists.              │
└─────────────────────────────────────────┘
```

#### Component Reuse

Follows the same pattern as the feature input in `ClassFeatureSection.vue`:
- Free-text input with "Add" button
- Tags for selected features with [x] remove
- Counter showing remaining slots

No Training Feature slot during level-up (that is creation-only).

---

## F. Class Choice at Levels 5 and 10

### New File: `app/components/levelup/LevelUpClassSection.vue`

Prompts for a new trainer class choice at milestone levels. While PTU does not strictly tie class acquisition to specific levels, levels 5 and 10 are conventional points where campaigns introduce new classes, and the tool prompts accordingly.

#### PTU Rules

- Trainers can have up to 4 classes (PTU Core p. 65)
- New classes can theoretically be taken at any level when the trainer has a qualifying Feature
- Levels 5 and 10 are highlighted as natural class expansion points in the advancement table
- This step is **optional** -- the GM can skip it if the trainer already has 4 classes or doesn't want a new one

#### Props

```typescript
interface Props {
  /** Current trainer classes on the character */
  currentClasses: string[]
  /** Max classes allowed */
  maxClasses: number
  /** Levels that prompt class choice in this advancement */
  classChoiceLevels: number[]
  /** New classes chosen so far */
  newClassChoices: string[]
}
```

#### Events

```typescript
interface Emits {
  addClass: [className: string]
  removeClass: [className: string]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ New Trainer Class (Level 5 / Level 10)  │
│                                         │
│ Current Classes (2/4):                  │
│   Ace Trainer, Type Ace: Fire           │
│                                         │
│ Optional: Choose a new trainer class.   │
│                                         │
│ [Search classes...                    ] │
│ ┌─ Introductory ─────────────────────┐ │
│ │ Capture Specialist  [Select]       │ │
│ │ Commander           [Select]       │ │
│ │ Coordinator         [Select]       │ │
│ │ Hobbyist            [Select]       │ │
│ │ Mentor              [Select]       │ │
│ └────────────────────────────────────┘ │
│ ┌─ Battling Style ───────────────────┐ │
│ │ ...                                 │ │
│ └────────────────────────────────────┘ │
│                                         │
│ Newly Selected:                         │
│   Capture Specialist                    │
│                                         │
│ [Skip — No new class]                  │
└─────────────────────────────────────────┘
```

#### Component Reuse

This reuses the class picker UI from `ClassFeatureSection.vue` almost entirely:
- Searchable list grouped by category
- Branching class specialization picker (decree-022: suffix format)
- Martial Artist NOT treated as branching (decree-026)
- Max 4 classes enforced
- Already-selected classes shown as tags

The only difference is context: during level-up, the "current classes" come from the existing character (not the creation form), and the step is explicitly optional with a "Skip" button.

---

## G. Lifestyle Milestone Choices

### New File: `app/components/levelup/LevelUpMilestoneSection.vue`

Presents the milestone bonus choice at levels 5, 10, 20, 30, and 40.

#### PTU Rules (Core pp. 19-21)

| Level | Title | Options |
|-------|-------|---------|
| 5 | Amateur | A: +1 Atk/SpAtk per even level 6-10 (+2 retroactive for L2/L4) **OR** B: 1 General Feature |
| 10 | Capable | A: +1 Atk/SpAtk per even level 12-20 **OR** B: 2 Edges |
| 20 | Veteran | A: +1 Atk/SpAtk per even level 22-30 **OR** B: 2 Edges |
| 30 | Elite | A: +1 Atk/SpAtk per even level 32-40 **OR** B: 2 Edges **OR** C: 1 General Feature |
| 40 | Champion | A: +1 Atk/SpAtk per even level 42-50 **OR** B: 2 Edges **OR** C: 1 General Feature |

#### Props

```typescript
interface Props {
  /** Milestones encountered in this advancement */
  milestones: TrainerMilestone[]
  /** Current milestone choices made */
  milestoneChoices: Record<number, MilestoneChoiceId>
}
```

#### Events

```typescript
interface Emits {
  setMilestoneChoice: [milestoneLevel: number, choiceId: MilestoneChoiceId]
}
```

#### UI Layout

```
┌─────────────────────────────────────────┐
│ Milestone: Amateur Trainer (Level 5)    │
│                                         │
│ Choose one bonus:                       │
│                                         │
│ ○ Lifestyle Stat Points                │
│   +1 Atk or SpAtk per even level 6-10, │
│   +2 retroactive for levels 2 and 4    │
│                                         │
│ ● General Feature                       │
│   Gain one General Feature for which    │
│   you qualify                           │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Milestone: Capable Trainer (Level 10)   │
│                                         │
│ Choose one bonus:                       │
│                                         │
│ ● Lifestyle Stat Points                │
│   +1 Atk or SpAtk per even level 12-20 │
│                                         │
│ ○ Bonus Edges                           │
│   Gain two Edges for which you qualify  │
└─────────────────────────────────────────┘
```

#### Immediate Application of Choices

When the GM selects a milestone option, the choice affects subsequent steps:

- **Lifestyle Stat Points (with retroactive):** Amateur grants +2 retroactive stat points for Atk/SpAtk immediately. These are added to the stat allocation step's pool. The composable detects this and adjusts `statPointsTotal` accordingly. Future even-level stat points (lifestyle) are automatically applied during future level-ups.

- **Bonus Edges:** The chosen edges are added to the edge selection step. If the edge step was already completed, the GM is prompted to return to it.

- **General Feature:** The chosen feature is added to the feature selection step.

This means milestone choices should ideally be presented **before** the edge/feature steps, so the GM can incorporate the bonus into their selections. However, since the step order is fixed and milestones are relatively rare, the practical approach is:

1. Show milestone choices in the milestone step
2. If the choice grants bonus edges/features, dynamically update the counts in the edge/feature steps
3. The summary step shows the combined results

#### Composable Extensions for P1

```typescript
// Added to useTrainerLevelUp composable

// --- P1: Edge Allocation ---
const edgeChoices = ref<string[]>([])
const bonusSkillEdgeChoices = ref<Array<{ skill: PtuSkillName; fromLevel: number }>>([])

const regularEdgesTotal = computed(() =>
  summary.value?.totalEdges ?? 0
)

const bonusSkillEdgeEntries = computed(() =>
  summary.value?.skillRankCapsUnlocked.map(cap => ({
    level: cap.level,
    restrictedRank: cap.cap
  })) ?? []
)

const edgesRemaining = computed(() =>
  regularEdgesTotal.value - edgeChoices.value.length
)

// --- P1: Feature Allocation ---
const featureChoices = ref<string[]>([])

const featuresTotal = computed(() =>
  summary.value?.totalFeatures ?? 0
)

const featuresRemaining = computed(() =>
  featuresTotal.value - featureChoices.value.length
)

// --- P1: Class Choices ---
const newClassChoices = ref<string[]>([])

// --- P1: Milestone Choices ---
const milestoneChoices = ref<Record<number, MilestoneChoiceId>>({})

// --- Updated buildUpdatePayload ---
function buildUpdatePayload(): Partial<HumanCharacter> {
  if (!character.value) return {}

  // Combine existing edges + new regular edges + bonus skill edges
  const allEdges = [
    ...character.value.edges,
    ...edgeChoices.value,
    ...bonusSkillEdgeChoices.value.map(c => `Skill Edge: ${c.skill}`)
  ]

  // Combine existing features + new features
  const allFeatures = [
    ...character.value.features,
    ...featureChoices.value
  ]

  // Combine existing classes + new classes
  const allClasses = [
    ...character.value.trainerClasses,
    ...newClassChoices.value
  ]

  // Apply bonus skill edge rank-ups to skills
  const updatedSkillsWithBonusEdges = { ...updatedSkills.value }
  const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
  for (const { skill } of bonusSkillEdgeChoices.value) {
    const currentRank = updatedSkillsWithBonusEdges[skill] ?? 'Untrained'
    const currentIndex = rankProgression.indexOf(currentRank)
    if (currentIndex < rankProgression.length - 1) {
      updatedSkillsWithBonusEdges[skill] = rankProgression[currentIndex + 1]
    }
  }

  // Apply milestone retroactive stat points (Amateur: +2 to Atk/SpAtk)
  const updatedStatsWithMilestone = { ...updatedStats.value }
  // ... (milestone stat point application logic)

  return {
    level: newLevel.value,
    stats: updatedStatsWithMilestone,
    maxHp: updatedMaxHp.value,
    currentHp: Math.min(character.value.currentHp, updatedMaxHp.value),
    skills: updatedSkillsWithBonusEdges,
    edges: allEdges,
    features: allFeatures,
    trainerClasses: allClasses
  }
}
```

---

## H. Updated Step Navigation for P1

With P1 components, the step order becomes:

```typescript
const steps = computed((): string[] => {
  const s: string[] = []

  // Milestones first (they affect edge/feature counts)
  if (summary.value && summary.value.milestones.length > 0) {
    s.push('milestones')
  }

  // Stats and skills (always present)
  s.push('stats', 'skills')

  // Edges (if any even levels crossed or bonus Skill Edges)
  if (summary.value && (summary.value.totalEdges > 0 || summary.value.bonusSkillEdges > 0)) {
    s.push('edges')
  }

  // Features (if any odd levels 3+ crossed)
  if (summary.value && summary.value.totalFeatures > 0) {
    s.push('features')
  }

  // Class choice (if levels 5 or 10 crossed)
  if (summary.value && summary.value.classChoicePrompts.length > 0) {
    s.push('classes')
  }

  // Summary always last
  s.push('summary')

  return s
})
```

**Rationale for milestones first:** The Amateur/Capable/Veteran milestone choice can grant bonus edges or features. By presenting milestones first, the edge/feature step counts are accurate. If the GM picks "Bonus Edges" at the Capable milestone, the edge step shows 2 additional edge slots.

---

## I. WebSocket Sync for Level-Up

When a level-up is applied, the updated character should be broadcast to the Group View. The existing `character_update` WebSocket event handles this:

```typescript
// After level-up is applied and saved via API
const { send } = useWebSocket()
send({
  type: 'character_update',
  data: updatedCharacter
})
```

No new WebSocket events are needed. The existing `character_update` broadcast is sufficient since the Group View simply re-renders the character data it receives.

---

## J. Edge Cases & Error Handling

### Multi-Level Jump Across Multiple Milestones

When jumping from level 1 to level 12, the advancement crosses:
- Level 2: Adept Skills + bonus Skill Edge
- Level 5: Amateur Trainer milestone
- Level 6: Expert Skills + bonus Skill Edge
- Level 10: Capable Trainer milestone
- Level 12: Master Skills + bonus Skill Edge

All milestones are presented in the milestone step. All bonus Skill Edges are presented in the edge step. The stat/skill step shows the combined totals (11 stat points, 11 skill ranks).

### Character Already at Max Level

PTU max trainer level is 50. If the GM tries to set level above 50, the watcher clamps it. The level-up modal is not shown.

### Level-Up During Active Encounter

Level-up during combat is unusual but possible. The modal works the same way. After applying, the character's stats are updated in the encounter via the existing `character_update` WebSocket event.

### Cancellation

If the GM cancels the level-up modal at any point, all choices are discarded. The character's level remains unchanged (the watcher reverted the raw input change before opening the modal).

### Existing Data Inconsistency

If the character's current edges/features/skills don't match what's expected for their level (e.g., a level 5 character with only 2 edges), the level-up workflow does not attempt to correct this. It only adds the **delta** for the new levels. The creation form's validation handles initial state; the level-up handles incremental advancement.

---

## K. Decree Compliance

### decree-022 (Branching Class Specialization)

The `LevelUpClassSection` reuses the branching specialization picker from `ClassFeatureSection.vue`. New branching class instances are stored with the suffix format (`"Type Ace: Water"`). The class picker uses `hasBaseClass()` prefix matching to detect existing instances.

### decree-026 (Martial Artist Not Branching)

Martial Artist is tagged `isBranching: false` in `trainerClasses.ts` and will not show the specialization picker during level-up class selection.

### decree-027 (Pathetic Skill Edge Block -- Creation Only)

**Critical behavioral difference:** decree-027 applies only during character creation. During level-up:
- Pathetic skills CAN be raised via regular skill rank-ups
- Pathetic skills CAN be raised via bonus Skill Edges at levels 2/6/12
- Pathetic skills CAN be raised via regular Skill Edges

The `useTrainerLevelUp` composable does NOT include the Pathetic block. The `isSkillRankAboveCap` function enforces the level-based cap, but the Pathetic lock from creation is not carried forward. This matches PTU RAW: the creation-time restriction lifts after character creation, and the Pathetic-to-Untrained progression via Basic Skills Edge (PTU p. 41) is the intended post-creation mechanic.
