# Encounter System

## Sides (Implemented)
- **Players**: Player-controlled combatants
- **Allies**: NPC allies (optional)
- **Enemies**: Hostile combatants

## Battle Types (Implemented)
- **Trainer Battle**: League-style with trainer/pokemon phases
- **Full Contact**: Standard initiative-based combat

## Combat Features (Implemented)
- Initiative sorting by Speed + bonuses
- Turn progression with current turn indicator
- Round tracking
- Damage application (set damage, not rolled)
- Healing (HP, Temp HP, injuries)
- Status condition management
- Combat stage modifiers (-6 to +6)
- Move logging with targets and effects
- "Take a Breather" action

## Undo/Redo System (Implemented)
- Snapshot-based history (50 states max)
- Undo: Ctrl+Z
- Redo: Ctrl+Shift+Z or Ctrl+Y
- Descriptive action names in tooltips

## Views

### Group View (`/group`)
- Read-only display for players
- Health shown as percentage for enemies
- Health shown as Current/Max for players
- Current turn indicator
- Pokemon sprites and status effects
- 4K TV optimized

### GM View (`/gm`)
- Full control over all combatants
- Add/remove combatants from library
- Apply damage, healing, status, stages
- Advance turns and rounds
- Serve/unserve to Group View
- Undo/redo any action

## Future Enhancements
- [ ] Automatic XP calculation
- [ ] Level up handling
- [ ] Ready action with custom text
- [ ] Move frequency tracking (Scene/Daily limits)
