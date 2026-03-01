# P2 Specification: Selection UI and Post-Capture Effects

P2 adds the ball type selection UI in the capture workflow, implements post-capture effects (Heal Ball, Friend Ball, Luxury Ball), and enhances the capture result display with ball-specific information.

**Prerequisite:** P0 and P1 must be fully implemented and reviewed before P2 begins.

---

## I. Ball Type Selection UI

### Capture Workflow Enhancement

The existing capture workflow involves the GM selecting a target Pokemon, viewing the capture rate, and clicking "Attempt Capture." P2 adds a ball type selector to this flow.

### Ball Selector Component

#### New Component: `app/components/capture/BallSelector.vue`

A dropdown/grid selector for choosing the Poke Ball type before a capture attempt.

**Props:**

```typescript
interface BallSelectorProps {
  /** Currently selected ball type */
  modelValue: string
  /** Condition context for showing conditional modifier previews */
  conditionContext?: Partial<BallConditionContext>
  /** Whether to include Safari-only balls */
  includeSafari?: boolean
  /** Whether to show the modifier preview column */
  showModifiers?: boolean
}
```

**Emits:** `@update:modelValue`

**Layout:**

```
+---------------------------------------------+
| Ball Type: [v Basic Ball         ]           |
|---------------------------------------------|
| Basic Balls:                                 |
|   [icon] Basic Ball        +0               |
|   [icon] Great Ball        -10              |
|   [icon] Ultra Ball        -15              |
|   [icon] Master Ball       -100             |
|                                              |
| Apricorn Balls:                              |
|   [icon] Level Ball        +0 (-20 if ...)  |
|   [icon] Moon Ball         +0 (-20 if ...)  |
|   [icon] Love Ball         +0 (-30 if ...)  |
|   [icon] Heavy Ball        +0 (-5/WC ...)   |
|   [icon] Fast Ball         +0 (-20 if ...)  |
|   [icon] Lure Ball         +0 (-20 if ...)  |
|   [icon] Friend Ball       -5  [+1 Loyalty] |
|                                              |
| Special Balls:                               |
|   [icon] Quick Ball        -20 (round 1)    |
|   [icon] Timer Ball        +5  (improves)   |
|   [icon] Net Ball          +0 (-20 if ...)  |
|   [icon] Nest Ball         +0 (-20 if ...)  |
|   [icon] Dusk Ball         +0 (-20 if ...)  |
|   [icon] Dive Ball         +0 (-20 if ...)  |
|   [icon] Repeat Ball       +0 (-20 if ...)  |
|   [icon] Heal Ball         -5  [Heal Max]   |
|   [icon] Luxury Ball       -5  [Happiness]  |
|   [icon] Cherish Ball      -5  [Decorative] |
|   [icon] Premier Ball      +0  [Promo]      |
+---------------------------------------------+
```

**Behavior:**

1. Balls are grouped by category (basic, apricorn, special, safari).
2. Each ball shows its base modifier and a short description of its conditional bonus (if any).
3. When a ball with a conditional is selected, the component shows whether the condition is currently met based on `conditionContext`.
4. Conditional modifiers that are met show in green; unmet show in gray italic.
5. Post-capture effects show as small badges (e.g., "[Heal Max]", "[+1 Loyalty]").
6. The selector uses Phosphor Icons for ball categories, not emojis.

**Icon Mapping (Phosphor Icons):**

| Category | Icon |
|----------|------|
| Basic balls | `PhCircle` |
| Apricorn balls | `PhFlower` |
| Special balls | `PhStar` |
| Safari balls | `PhTree` |
| Conditional met | `PhCheckCircle` (green) |
| Conditional not met | `PhMinusCircle` (gray) |
| Post-capture effect | `PhSparkle` |

### GM Context Toggles

For GM-provided context flags, add toggles to the capture UI:

```
+---------------------------------------------+
| Capture Conditions:                          |
|   [ ] Target was baited (Lure Ball)         |
|   [ ] Dark/low-light (Dusk Ball)            |
|   [ ] Underwater/underground (Dive Ball)     |
+---------------------------------------------+
```

These checkboxes set the `conditionContext` fields. When toggled, the ball modifier preview updates in real-time.

### Integration with Existing Capture Modal

The ball selector integrates into the existing capture workflow. The exact integration point depends on the current capture UI structure. The general pattern:

1. GM opens capture dialog for a wild Pokemon
2. Ball selector appears (defaults to Basic Ball)
3. GM selects ball type
4. Capture rate display updates with ball modifier breakdown
5. GM toggles any context flags (baited, dark, underwater)
6. GM clicks "Throw Ball" (accuracy check -> capture roll)

### Updated Capture Rate Display

The capture rate display shows the ball modifier breakdown alongside the existing capture rate breakdown:

```
+---------------------------------------------+
| Capture Rate: 65                             |
|   Base: 100                                  |
|   Level: -20  (level 10)                     |
|   HP: +15     (22%, below 25%)               |
|   Evolution: +0                              |
|   Status: +5  (Confused)                     |
|   Injuries: +10 (2 injuries)                 |
|   Stuck/Slow: +0                             |
|   Shiny: -10                                 |
|   Legendary: 0                               |
|---------------------------------------------|
| Ball: Ultra Ball                             |
|   Base modifier: -15                         |
|   Conditional: n/a                           |
|   Total ball modifier: -15                   |
|---------------------------------------------|
| Modified roll needed: <= 65                  |
|   Roll - Trainer Level(5) + Ball(-15) + Mods |
|   = Roll - 20 <= 65                          |
|   Effective: Roll <= 85                      |
+---------------------------------------------+
```

---

## J. Post-Capture Effects

### Heal Ball: Full HP Heal on Capture

PTU p.273: "A caught Pokemon will heal to Max HP immediately upon capture."

When a Pokemon is captured with a Heal Ball, after the capture succeeds and the Pokemon is linked to the trainer, its HP is restored to full:

```typescript
// In attempt.post.ts, after successful capture and ownerId update:

if (captureResult.success && ballDef?.postCaptureEffect === 'heal_full') {
  // Heal Ball: restore to real max HP (not injury-reduced)
  // The Pokemon is freshly captured, so we use real max HP
  await prisma.pokemon.update({
    where: { id: body.pokemonId },
    data: {
      currentHp: pokemon.maxHp,
      // Clear injuries on capture? No -- PTU doesn't say Heal Ball clears injuries.
      // It says "heal to Max HP" which means set currentHp = maxHp.
      // Injuries persist but HP is at the real max.
    }
  })

  postCaptureEffectApplied = {
    type: 'heal_full' as const,
    description: `${pokemon.species} was healed to full HP (${pokemon.maxHp}) by the Heal Ball.`,
  }
}
```

**Design decision:** Heal Ball heals to real max HP, not injury-reduced effective max HP. PTU p.273 says "heal to Max HP," and decree-015 establishes that HP calculations use real max HP. Additionally, a freshly captured Pokemon is in a new context -- the Heal Ball effect is separate from combat healing where injury caps apply.

### Friend Ball: +1 Loyalty

PTU p.272: "A caught Pokemon will start with +1 Loyalty."

The app does not currently track Pokemon loyalty. The Friend Ball effect is:

1. Stored in the capture result response (`postCaptureEffect: 'loyalty_plus_one'`)
2. Displayed in the capture result UI ("Caught Pokemon starts with +1 Loyalty")
3. **No mechanical effect** until loyalty tracking is implemented

When loyalty tracking is added in a future feature:

```typescript
if (captureResult.success && ballDef?.postCaptureEffect === 'loyalty_plus_one') {
  await prisma.pokemon.update({
    where: { id: body.pokemonId },
    data: {
      loyalty: { increment: 1 }
    }
  })
}
```

### Luxury Ball: Raised Happiness

PTU p.272: "A caught Pokemon is easily pleased and starts with a raised happiness."

Similar to Friend Ball, happiness is not tracked mechanically. The effect is:

1. Stored in capture result (`postCaptureEffect: 'raised_happiness'`)
2. Displayed in the UI ("Caught Pokemon starts with raised happiness")
3. No mechanical effect until happiness tracking exists

### Post-Capture Effect in Response

The capture attempt response includes post-capture effect info:

```typescript
return {
  success: true,
  data: {
    // ... existing fields ...
    postCaptureEffect: captureResult.success && ballDef?.postCaptureEffect
      ? {
          type: ballDef.postCaptureEffect,
          description: ballDef.postCaptureDescription || '',
        }
      : undefined,
  }
}
```

---

## K. Capture Result Display with Ball Info

### Enhanced Capture Result Panel

After a capture attempt, the result display shows ball-specific information:

```
+---------------------------------------------+
| CAPTURE ATTEMPT                              |
|---------------------------------------------|
| Ball: Ultra Ball (-15 modifier)              |
| Target: Pikachu (Lv. 12, 8/35 HP)          |
| Trainer: Ash (Lv. 5)                        |
|---------------------------------------------|
| Accuracy: 14 vs AC 6 -- HIT                 |
|---------------------------------------------|
| Roll: 47                                     |
| - Trainer Level: -5                          |
| + Ball Modifier: -15                         |
| + Other Modifiers: 0                         |
| = Modified Roll: 27                          |
|                                              |
| Capture Rate: 65                             |
| 27 <= 65 -- CAPTURED!                        |
|---------------------------------------------|
| [Heal Ball only:]                            |
| Pikachu was healed to full HP (35/35)!      |
+---------------------------------------------+
```

For failed captures:

```
+---------------------------------------------+
| Roll: 82                                     |
| - Trainer Level: -5                          |
| + Ball Modifier: -15                         |
| = Modified Roll: 62                          |
|                                              |
| Capture Rate: 45                             |
| 62 > 45 -- ESCAPED!                         |
+---------------------------------------------+
```

### Ball Info in Move History / Combat Log

Capture attempts are logged in the encounter's move history (if in combat). The log entry includes the ball type:

```typescript
{
  type: 'capture_attempt',
  round: encounter.round,
  trainerName: trainer.name,
  targetName: pokemon.species,
  ballType: ballType,
  roll: captureResult.roll,
  modifiedRoll: captureResult.modifiedRoll,
  captureRate: rateResult.captureRate,
  success: captureResult.success,
  naturalHundred: captureResult.naturalHundred,
}
```

### WebSocket Broadcast Enhancement

The capture attempt broadcast includes ball information:

```typescript
broadcast({
  type: 'capture_attempt',
  data: {
    pokemonId: body.pokemonId,
    trainerId: body.trainerId,
    ballType,
    captured: captureResult.success,
    roll: captureResult.roll,
    modifiedRoll: captureResult.modifiedRoll,
    captureRate: rateResult.captureRate,
    ballModifier: ballResult.total,
    postCaptureEffect: ballDef?.postCaptureEffect,
  }
})
```

The Group View displays capture attempts in the encounter panel, showing the ball type and whether it was successful.

---

## Implementation Order within P2

1. **I. Ball Selector Component** -- create `BallSelector.vue` with grouped ball list
2. **I. GM Context Toggles** -- add condition flag checkboxes to capture UI
3. **I. Updated Capture Rate Display** -- show ball modifier breakdown
4. **J. Heal Ball Effect** -- implement heal-to-max on capture success
5. **J. Friend Ball / Luxury Ball** -- store effect in response (no mechanical effect)
6. **K. Capture Result Display** -- enhanced result panel with ball info
7. **K. Combat Log / WebSocket** -- include ball type in capture events

---

## Future Considerations

### Ball Inventory Integration

The current design treats ball selection as a UI choice without inventory tracking. When a trainer inventory system is implemented (design-healing-items-001 P2 adds inventory basics), ball consumption can be added:

1. Before capture attempt, check trainer has the ball in inventory
2. After attempt (hit or miss), deduct 1 from inventory
3. Missed throws consume the ball (PTU p.271: "If it misses, the Poke Ball lands harmlessly")
4. GM override to skip inventory check

### Safari Zone Integration

Safari Ball, Sport Ball, and Park Ball are flagged as `category: 'safari'` and hidden from the default selector. A future Safari Zone feature could:

1. Enable the safari category in the ball selector
2. Enforce Safari Ball-only throwing rules
3. Implement the Safari Zone-specific encounter mechanics

### Custom Ball Types

PTU p.273 GM Tip: "You may even want to invent your own custom Poke Balls for your campaign."

The catalog design supports custom balls by adding entries to `POKE_BALL_CATALOG` at runtime or via a GM configuration endpoint. The condition evaluator registry in `pokeBallConditions.ts` can be extended with custom evaluators. This is explicitly deferred to a future feature.
