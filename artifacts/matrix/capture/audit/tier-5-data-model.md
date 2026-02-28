## Tier 5: Data Model (Status Condition Enumeration)

### 22. capture-R002 — Persistent Status Condition Definition

- **Rule:** PTU 1.05 p.246 "Persistent Afflictions": Burned, Frozen, Paralysis (Paralyzed), Poisoned (including Badly Poisoned).
- **Expected behavior:** The PERSISTENT_CONDITIONS constant should contain exactly: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.
- **Actual behavior:** `app/constants/statusConditions.ts:7-9`:
  ```
  PERSISTENT_CONDITIONS = ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']
  ```
  This matches PTU exactly. Badly Poisoned is correctly included as a variant of Poisoned.
- **Classification:** Correct
- **Note:** PTU p.246 lists: Burned, Frozen, Paralysis, Poisoned (with Badly Poisoned as a severity variant of Poison at p.246-247). The code correctly includes all five. Sleep is NOT in this list — Sleep is a Volatile condition in PTU (p.247), and the code correctly places 'Asleep'/'Bad Sleep' in VOLATILE_CONDITIONS.

### 23. capture-R003 — Volatile Status Condition Definition

- **Rule:** PTU 1.05 p.247 "Volatile Afflictions": Bad Sleep, Confused, Cursed, Disabled, Rage (Enraged), Flinch (Flinched), Infatuation (Infatuated), Sleep (Asleep), Suppressed.
- **Expected behavior:** The VOLATILE_CONDITIONS constant should contain the volatile afflictions from PTU.
- **Actual behavior:** `app/constants/statusConditions.ts:11-13`:
  ```
  VOLATILE_CONDITIONS = ['Asleep', 'Bad Sleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']
  ```
  Mapping to PTU names:
  - 'Asleep' = Sleep (PTU p.247) — correct
  - 'Bad Sleep' = Bad Sleep (PTU p.247) — correct
  - 'Confused' = Confused — correct
  - 'Flinched' = Flinch — correct
  - 'Infatuated' = Infatuation — correct
  - 'Cursed' = Cursed — correct
  - 'Disabled' = Disabled — correct
  - 'Enraged' = Rage — correct
  - 'Suppressed' = Suppressed — correct

  All 9 volatile conditions from PTU are present with appropriate name mappings.
- **Classification:** Correct
- **Note:** The name differences (Asleep vs Sleep, Enraged vs Rage, Flinched vs Flinch, Infatuated vs Infatuation) are cosmetic localizations — past-tense/adjective forms used in code vs PTU's noun/verb forms. Semantically equivalent. Stuck and Slowed are correctly placed in OTHER_CONDITIONS (line 16-18), separate from volatile, consistent with decree-014.

---
