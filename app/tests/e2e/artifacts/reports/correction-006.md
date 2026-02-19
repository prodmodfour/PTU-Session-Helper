---
type: SCENARIO_BUG
severity: MEDIUM
filed_by: playtester
date: 2026-02-19
domain: healing
affected_scenarios:
  - healing-workflow-overnight-extended-rest-001
  - healing-workflow-global-new-day-reset-001
  - healing-workflow-injury-healing-cycle-001
  - healing-daily-injury-cap-001
  - healing-ap-drain-injury-001
  - healing-workflow-pokemon-center-full-heal-001
  - healing-natural-injury-timer-001
status: resolved
---

# SCENARIO_BUG: Character API field name mismatches in healing scenarios

## Summary

Multiple healing scenarios use incorrect field names in their character creation and update API payloads.

## Mismatches

### 1. Character creation: `type` vs `characterType`

**Scenarios use:**
```json
POST /api/characters { "name": "Trainer Brock", "type": "player" }
```

**API expects:**
```json
POST /api/characters { "name": "Trainer Brock", "characterType": "player" }
```

The field `type` is silently ignored. Characters default to `characterType: 'npc'`.

### 2. Character creation: `baseHp` vs `hp`

**Scenarios use:**
```json
POST /api/characters { "baseHp": 5 }
```

**API expects:**
```json
POST /api/characters { "hp": 5 }
```

The field `baseHp` is silently ignored. Characters default to `hp: 10`.

### 3. Character creation: missing `maxHp` and `currentHp`

Scenarios assume the API auto-calculates maxHp from the character HP formula `(level * 2) + (hp * 3) + 10`. The API does NOT auto-calculate — it defaults `maxHp` to `body.maxHp || body.currentHp || 10`.

**Scenarios should pass `maxHp` and `currentHp` explicitly:**
```json
POST /api/characters { "name": "Trainer Brock", "level": 10, "hp": 5, "characterType": "player", "maxHp": 45, "currentHp": 45 }
```

## Affected Scenarios

All scenarios that create characters:
- healing-workflow-overnight-extended-rest-001
- healing-workflow-global-new-day-reset-001
- healing-daily-injury-cap-001
- healing-ap-drain-injury-001
- healing-workflow-injury-healing-cycle-001
- healing-workflow-pokemon-center-full-heal-001
- healing-natural-injury-timer-001

## Recommendation

Scenario Crafter should update character creation payloads to use:
- `characterType` instead of `type`
- `hp` instead of `baseHp`
- Explicit `maxHp` and `currentHp` values
