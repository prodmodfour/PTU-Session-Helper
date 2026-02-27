# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/api/declare.test.ts`
- Declaration is recorded for the current turn's trainer
- Rejects declaration when phase is not `trainer_declaration`
- Rejects declaration from wrong combatant (not current turn)
- Rejects declaration from Pokemon combatant (trainers only)
- Rejects duplicate declaration (same combatant, same round)
- Rejects declaration with missing required fields
- Rejects declaration with invalid actionType
- Declaration includes correct round number
- Declaration stores trainer display name

### `app/tests/unit/api/next-turn-league.test.ts`
- Declaration phase -> resolution phase transition when all trainers declared
- Resolution turn order is high-to-low speed (reverse of declaration order)
- Resolution phase -> pokemon phase transition when all resolutions done
- Pokemon phase -> new round -> trainer_declaration with cleared declarations
- Declarations array is cleared on new round start
- No trainers: skip declaration/resolution, go straight to pokemon
- No Pokemon: skip pokemon phase, start new round after resolution
- `currentTurnIndex` resets to 0 on each phase transition
- Phase transitions respect weather duration decrement (only on new round)
- `resetCombatantsForNewRound` only called on actual new round (not phase transitions)

### `app/tests/unit/api/start-league.test.ts`
- League Battle start initializes `declarations` to empty array
- `currentPhase` is set to `trainer_declaration`
- `turnOrder` matches `trainerTurnOrder` (low-to-high speed)
- `trainerTurnOrder` sorts trainers by ascending speed

### `app/tests/unit/services/encounter-service.test.ts`
- `buildEncounterResponse` includes `declarations` field
- `buildEncounterResponse` accepts declarations override in options
- `ParsedEncounter` type includes declarations

### `app/tests/unit/stores/encounter.test.ts`
- `currentDeclarations` getter filters by current round
- `currentResolutionDeclaration` getter returns null outside resolution phase
- `currentResolutionDeclaration` getter returns correct declaration during resolution
- `submitDeclaration` action calls correct API endpoint
- `updateFromWebSocket` handles declarations field

## Integration Tests (P0)

### Full League Battle Round Flow
1. Create encounter with battleType `trainer`
2. Add 2 human combatants (trainers) and 2 Pokemon combatants
3. Start encounter -> verify `trainer_declaration` phase, trainers in low-to-high speed order
4. Declare action for trainer 1 (slowest) -> verify stored in declarations
5. Next turn -> trainer 2 is current
6. Declare action for trainer 2 (fastest) -> verify both declarations stored
7. Next turn -> verify transition to `trainer_resolution` phase
8. Verify resolution order is high-to-low speed (trainer 2 first, then trainer 1)
9. Execute trainer 2's declared action (existing move/action endpoint)
10. Next turn -> trainer 1 resolves
11. Execute trainer 1's declared action
12. Next turn -> verify transition to `pokemon` phase
13. Verify Pokemon are in high-to-low speed order
14. Act with each Pokemon
15. Next turn after last Pokemon -> verify new round, `trainer_declaration`, empty declarations

## Unit Tests (P1)

### `app/tests/unit/api/next-turn-league-edge-cases.test.ts`
- Fainted trainer auto-skipped during declaration phase
- Fainted trainer auto-skipped during resolution phase
- Trainer with no declaration auto-skipped during resolution phase
- Multiple fainted trainers in sequence are all skipped
- If all remaining trainers are fainted, phase transitions immediately

### `app/tests/unit/api/initiative-reorder-league.test.ts`
- Speed change during declaration phase: undeclared trainers re-sorted, declared frozen
- Speed change during resolution phase: unresolved trainers re-sorted, resolved frozen
- Speed change during pokemon phase: standard reorder behavior (existing tests)
- `trainerTurnOrder` and `pokemonTurnOrder` updated after reorder

### Component Tests (P1)
- `DeclarationPanel.vue`: renders only during declaration phase
- `DeclarationPanel.vue`: form validation prevents empty submissions
- `DeclarationPanel.vue`: "Declare & Next" calls both submitDeclaration and nextTurn
- `DeclarationSummary.vue`: renders all declarations for current round
- `DeclarationSummary.vue`: highlights currently-resolving trainer
- `DeclarationSummary.vue`: marks resolved trainers with check icon
- `DeclarationSummary.vue`: hidden when no declarations exist

## Manual Testing Checklist

### Happy Path
- [ ] Start a League Battle encounter with 2+ trainers and 2+ Pokemon
- [ ] Verify "Declaration Phase" label appears
- [ ] Verify trainers are listed in low-to-high speed order
- [ ] Record declarations for each trainer
- [ ] Verify transition to "Resolution Phase" with reversed (high-to-low) order
- [ ] Verify declared actions are visible during resolution
- [ ] Execute each trainer's declared action
- [ ] Verify transition to "Pokemon Phase"
- [ ] Complete Pokemon turns
- [ ] Verify new round starts with fresh declaration phase and empty declarations

### Edge Cases
- [ ] Fainted trainer is auto-skipped in declaration phase
- [ ] Fainted trainer is auto-skipped in resolution phase
- [ ] Undo during declaration phase restores previous declarations
- [ ] Undo during resolution phase restores previous state
- [ ] Speed CS change during declaration reorders remaining declarers
- [ ] Adding a combatant mid-declaration phase updates turn order
- [ ] Full Contact battle is completely unaffected by these changes

### Group View
- [ ] Group View shows declaration summary during resolution phase
- [ ] Group View updates declarations in real-time via WebSocket
- [ ] Phase label is visible and accurate on Group View

---
