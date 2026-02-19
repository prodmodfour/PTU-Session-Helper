---
scenario_id: pokemon-lifecycle-nickname-resolution-001
loop_id: pokemon-lifecycle-mechanic-nickname-resolution
tier: mechanic
priority: P2
ptu_assertions: 0
---

## Description

Validates the nickname resolution utility across all paths: custom nickname preserved,
empty/null nickname auto-generates "Species N" (sequential count), whitespace-only nickname
treated as empty, and sequential numbering increments correctly. All tests use deterministic
`POST /api/pokemon` (Lesson 4). No PTU rules — this is an app-level convenience feature.

## Setup (API)

No pre-existing entities needed. Tests create their own Pokemon and track generated names.

## Actions

### Test 1: Custom Nickname Preserved

```
POST /api/pokemon {
  species: "Rattata",
  nickname: "Sparky",
  level: 3,
  types: ["Normal"],
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$custom_id = response.data.id
```

### Test 2: No Nickname — Auto-Generated

```
POST /api/pokemon {
  species: "Rattata",
  level: 3,
  types: ["Normal"],
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$auto1_id = response.data.id
$auto1_nickname = response.data.nickname
```

### Test 3: Sequential Numbering — Next Auto-Generated

Creating another Rattata without a nickname should produce a higher sequential number.

```
POST /api/pokemon {
  species: "Rattata",
  level: 3,
  types: ["Normal"],
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$auto2_id = response.data.id
$auto2_nickname = response.data.nickname
```

### Test 4: Whitespace-Only Nickname Treated as Empty

```
POST /api/pokemon {
  species: "Rattata",
  nickname: "   ",
  level: 3,
  types: ["Normal"],
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$ws_id = response.data.id
```

### Test 5: Different Species — Independent Counter

A different species should have its own counter. Creating a Pidgey should not affect
the Rattata counter.

```
POST /api/pokemon {
  species: "Pidgey",
  level: 3,
  types: ["Normal", "Flying"],
  baseStats: { hp: 4, attack: 5, defense: 4, specialAttack: 4, specialDefense: 4, speed: 6 }
}
$pidgey_id = response.data.id
```

## Assertions

### Test 1: Custom Nickname

1. **Custom nickname preserved exactly:**
   **Assert: response.data.nickname = "Sparky"**

### Test 2: Auto-Generated

2. **Pattern matches "Rattata N":**
   **Assert: $auto1_nickname matches pattern /^Rattata \d+$/**

### Test 3: Sequential Numbering

3. **Pattern matches and number incremented:**
   **Assert: $auto2_nickname matches pattern /^Rattata \d+$/**

4. **Number is higher than Test 2's number:**
   Extract N from both nicknames.
   ```
   auto1_n = parseInt($auto1_nickname.split(" ")[1])
   auto2_n = parseInt($auto2_nickname.split(" ")[1])
   ```
   **Assert: auto2_n = auto1_n + 1**

### Test 4: Whitespace-Only

5. **Whitespace trimmed to empty, auto-generates:**
   **Assert: response.data.nickname matches pattern /^Rattata \d+$/**
   **Assert: response.data.nickname != "   "** (not the raw whitespace)

### Test 5: Independent Species Counter

6. **Pidgey gets its own counter:**
   **Assert: response.data.nickname matches pattern /^Pidgey \d+$/**
   The number is based on existing Pidgey count, not Rattata count.

## Teardown

```
DELETE /api/pokemon/$custom_id
DELETE /api/pokemon/$auto1_id
DELETE /api/pokemon/$auto2_id
DELETE /api/pokemon/$ws_id
DELETE /api/pokemon/$pidgey_id
```
