# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/utils/visionRules.test.ts`

#### isDarknessBasedPreset
- Returns true for 'dim-cave'
- Returns true for 'dark-cave'
- Returns false for 'frozen-lake'
- Returns false for 'hazard-factory'
- Returns false for 'custom-preset-123'
- Returns false for empty string

#### hasVisionCapability
- Returns true for combatant with darkvision
- Returns true for combatant with blindsense
- Returns true for combatant with both capabilities
- Returns false for combatant with empty capabilities array
- Returns false for combatant with undefined visionState
- Returns false for combatant without visionState field

#### hasSpecificVision
- Returns true for combatant with darkvision when checking darkvision
- Returns false for combatant with darkvision when checking blindsense
- Returns true for combatant with blindsense when checking blindsense
- Returns false when visionState is undefined

#### getEffectiveEnvironmentPenalty
- Returns 0 when preset is null
- Returns 0 when preset is undefined
- Returns 6 for dim-cave preset when attacker has no vision capabilities
- Returns 10 for dark-cave preset when attacker has no vision capabilities
- Returns 0 for dim-cave preset when attacker has darkvision
- Returns 0 for dim-cave preset when attacker has blindsense
- Returns 0 for dark-cave preset when attacker has darkvision
- Returns 0 for dark-cave preset when attacker has blindsense
- Returns 0 for dark-cave preset when attacker has both capabilities
- Returns full penalty for frozen-lake preset even with darkvision (not darkness-based)
- Returns full penalty for custom preset with accuracy_penalty even with darkvision
- Returns 0 for preset with no accuracy_penalty effects
- Handles combatant with empty capabilities array (returns full penalty)

---

## Unit Tests (P1)

### `app/tests/unit/utils/visionRules-parse.test.ts`

#### parseVisionFromCapabilities
- Returns ['darkvision'] for "Overland 2, Sky 5, Darkvision"
- Returns ['blindsense'] for "Overland 1, Sky 4, Blindsense"
- Returns ['darkvision', 'blindsense'] when both are present (theoretical)
- Returns [] for "Overland 4, Power 1, Intelligence 3"
- Returns [] for null input
- Returns [] for undefined input
- Returns [] for empty string
- Case-insensitive: returns ['darkvision'] for "overland 2, darkvision"
- Does not match partial strings: "DarkvisionPlus" does not match
- Handles extra whitespace: "Overland 2 , Darkvision , Jump 3" returns ['darkvision']
- Returns [] for capability string with no vision capabilities

---

## Integration Tests (P0)

### Vision Toggle API

1. Create an encounter with one Pokemon combatant
2. POST vision toggle: `{ capability: 'darkvision', enabled: true }`
3. Verify response includes updated combatant with `visionState.capabilities: ['darkvision']`
4. Verify `visionState.sources.darkvision` is `'manual'`
5. POST vision toggle: `{ capability: 'darkvision', enabled: false }`
6. Verify combatant no longer has `visionState` (cleaned up when empty)

### Vision Toggle Validation

1. POST with invalid capability `{ capability: 'xray', enabled: true }`
2. Verify 400 error response
3. POST to non-existent combatant ID
4. Verify 404 error response

### Accuracy Penalty Negation

1. Create encounter with Dim Cave preset (-6 Blindness)
2. Add two Pokemon combatants: one with darkvision, one without
3. Use MoveTargetModal to check accuracy thresholds
4. Verify combatant WITH darkvision: threshold does NOT include -6 penalty
5. Verify combatant WITHOUT darkvision: threshold includes -6 penalty
6. Change preset to Dark Cave (-10 Total Blindness)
7. Verify combatant WITH darkvision: threshold does NOT include -10 penalty
8. Verify combatant WITHOUT darkvision: threshold includes -10 penalty
9. Remove preset (set to None)
10. Verify no environment penalty for either combatant

### Vision State Persistence

1. Create encounter, toggle darkvision on a combatant
2. Reload the encounter from the server
3. Verify visionState is preserved in the combatant JSON

---

## Integration Tests (P1)

### Auto-Detection from Species Data

1. Create encounter with Zubat (species has Blindsense capability)
2. Verify Zubat combatant auto-populated with `visionState.capabilities: ['blindsense']`
3. Verify `visionState.sources.blindsense` is `'species'`
4. Create encounter with Charmander (no vision capabilities in species)
5. Verify Charmander combatant has no visionState
6. Create encounter with Hoothoot (species has Darkvision)
7. Verify Hoothoot has darkvision auto-populated

### Manual Override of Auto-Detection

1. Create encounter with Zubat (auto-detected blindsense)
2. POST vision toggle to REMOVE blindsense: `{ capability: 'blindsense', enabled: false }`
3. Verify Zubat no longer has blindsense
4. Verify the removal persists (not re-auto-detected)

### Server-Side Damage Calculation

1. Create encounter with Dim Cave preset
2. Calculate damage with attacker that has darkvision
3. Verify accuracy threshold does NOT include -6 penalty
4. Calculate damage with attacker that has no vision capabilities
5. Verify accuracy threshold includes -6 penalty

---

## Manual Testing Checklist

### P0: Manual Toggle

- [ ] Open GM view with an active encounter
- [ ] Set environment preset to "Dim Cave"
- [ ] Verify vision toggles appear on CombatantCards
- [ ] Toggle Darkvision ON for a combatant
- [ ] Verify eye icon/badge appears on the CombatantCard
- [ ] Open MoveTargetModal for that combatant attacking a target
- [ ] Verify accuracy threshold does NOT include -6 penalty
- [ ] Open MoveTargetModal for a combatant WITHOUT darkvision
- [ ] Verify accuracy threshold includes -6 penalty
- [ ] Toggle Darkvision OFF
- [ ] Verify badge disappears and penalty re-applies
- [ ] Set preset to "Dark Cave" -- verify -10 penalty applies/negates correctly
- [ ] Set preset to "Frozen Lake" -- verify vision toggles are hidden (not darkness-based)
- [ ] Remove preset -- verify no penalties and toggles hidden
- [ ] Undo after toggling vision -- verify vision state reverts

### P1: Auto-Detection

- [ ] Add Zubat to encounter -- verify Blindsense auto-detected and badge shown
- [ ] Add Hoothoot to encounter -- verify Darkvision auto-detected
- [ ] Add Pikachu to encounter -- verify no vision capabilities
- [ ] Manually remove Zubat's auto-detected Blindsense -- verify it stays removed
- [ ] Manually add Darkvision to Pikachu -- verify it works alongside species-detected ones

### P2: Enhanced Features

- [ ] Bulk vision toggle from EnvironmentSelector -- verify all combatants updated
- [ ] Vision tooltip shows penalty context when hovering
- [ ] Group View shows vision indicators on CombatantCards
- [ ] Vision change broadcasts to Group View via WebSocket

### Edge Cases

- [ ] Encounter with no environment preset -- vision toggles hidden, no penalty logic runs
- [ ] Encounter with custom accuracy_penalty preset -- vision does NOT negate it
- [ ] Combatant with both Darkvision and Blindsense -- penalty still negated (no double-processing)
- [ ] Toggle vision on a fainted combatant -- should work (vision is a capability, not a combat state)
- [ ] Multiple accuracy_penalty effects on a single preset -- all or none negated for darkness presets
- [ ] Human combatant (trainer) with manually toggled Darkvision -- works the same as Pokemon
- [ ] League Battle: vision penalty applies during all phases (declaration, resolution, pokemon)
