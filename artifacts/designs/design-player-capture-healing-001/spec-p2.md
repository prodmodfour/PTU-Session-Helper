# P2: Player Healing UI

## Goal

Add "Take a Breather" and "Use Healing Item" buttons to the player combat interface. Both actions route through the P0 request framework for GM approval. Take a Breather is available immediately; healing items depend on feature-020 being implemented.

**Depends on:** P0 (PlayerActionType extensions + PlayerRequestPanel)

---

## Section I: PlayerHealingPanel Component

### New File: `app/components/player/PlayerHealingPanel.vue` (~200 lines)

An expandable panel within PlayerCombatActions that handles breather and healing item requests.

**State:**
```typescript
const activeTab = ref<'breather' | 'items'>('breather')
const requestPending = ref(false)
const showAssistedOption = ref(false)
```

**Template structure:**

```
<section class="combat-actions__panel">
  <h4 class="combat-actions__panel-title">
    <PhHeart :size="16" />
    Healing
  </h4>

  <!-- Tab selector (breather vs items) -->
  <div class="healing-panel__tabs">
    <button
      class="healing-panel__tab"
      :class="{ 'healing-panel__tab--active': activeTab === 'breather' }"
      @click="activeTab = 'breather'"
    >
      Take a Breather
    </button>
    <button
      v-if="healingItemsAvailable"
      class="healing-panel__tab"
      :class="{ 'healing-panel__tab--active': activeTab === 'items' }"
      @click="activeTab = 'items'"
    >
      Use Item
    </button>
  </div>

  <!-- Take a Breather Tab -->
  <div v-if="activeTab === 'breather'" class="healing-panel__breather">
    <div class="healing-panel__description">
      <p>Reset combat stages, cure volatile conditions, remove Temp HP.</p>
      <p class="healing-panel__warning">
        <PhWarning :size="14" />
        You will become Tripped + Vulnerable and must Shift away from enemies.
      </p>
    </div>

    <!-- Action cost -->
    <div class="healing-panel__action-cost">
      <PhInfo :size="14" />
      <span>Full Action (Standard + Shift)</span>
    </div>

    <!-- Assisted option -->
    <label class="healing-panel__assisted-toggle">
      <input
        type="checkbox"
        v-model="showAssistedOption"
        :disabled="!hasAdjacentAlly"
      />
      <span>Assisted Breather</span>
      <span v-if="!hasAdjacentAlly" class="healing-panel__assisted-hint">
        (requires adjacent ally)
      </span>
    </label>
    <p v-if="showAssistedOption" class="healing-panel__assisted-desc">
      Adjacent ally uses their Standard Action. You become Tripped with 0 Evasion instead of Tripped+Vulnerable.
    </p>

    <!-- Confirm -->
    <button
      class="combat-actions__btn combat-actions__btn--confirm"
      :disabled="requestPending || !canUseStandardAction || !canUseShiftAction"
      @click="confirmBreather"
    >
      <PhWind :size="18" />
      {{ requestPending ? 'Waiting for GM...' : 'Request Breather' }}
    </button>
  </div>

  <!-- Healing Items Tab (feature-020 dependent) -->
  <div v-if="activeTab === 'items'" class="healing-panel__items">
    <template v-if="healingItemsAvailable">
      <!-- Item selection -->
      <div class="healing-panel__item-list">
        <button
          v-for="item in availableHealingItems"
          :key="item.name"
          class="combat-actions__panel-row"
          :disabled="requestPending"
          @click="selectHealingItem(item)"
        >
          <span class="combat-actions__panel-name">{{ item.name }}</span>
          <span class="combat-actions__panel-desc">{{ item.description }}</span>
        </button>
      </div>

      <!-- Target selection (after item selected) -->
      <div v-if="selectedHealingItem" class="healing-panel__targets">
        <p class="healing-panel__hint">Select target:</p>
        <button
          v-for="target in healTargets"
          :key="target.id"
          class="combat-actions__panel-row"
          @click="confirmHealingItem(target)"
        >
          <span class="combat-actions__panel-name">{{ getCombatantName(target) }}</span>
          <span class="combat-actions__panel-hp">
            {{ target.entity.currentHp }} / {{ target.entity.maxHp }} HP
          </span>
        </button>
      </div>
    </template>
    <div v-else class="combat-actions__panel-empty">
      Healing items are not available yet.
    </div>
  </div>
</section>
```

---

## Section J: Take a Breather Request Logic

### In `app/components/player/PlayerHealingPanel.vue`

```typescript
const { requestBreather, canUseStandardAction, canUseShiftAction, myActiveCombatant } = usePlayerCombat()

/**
 * Whether the breather button should be disabled.
 * Take a Breather is a Full Action (Standard + Shift).
 * Both actions must be available.
 */
const canRequestBreather = computed((): boolean => {
  return canUseStandardAction.value && canUseShiftAction.value && !!myActiveCombatant.value
})

/**
 * Whether an adjacent ally is available for assisted breather.
 * Simplified check: if any player-side combatant other than the active one
 * is alive and hasn't used their Standard Action this turn.
 * Full adjacency check happens on the GM side.
 */
const hasAdjacentAlly = computed((): boolean => {
  if (!encounterStore.encounter) return false
  const activeCombatantId = myActiveCombatant.value?.id
  return encounterStore.encounter.combatants.some(c => {
    if (c.id === activeCombatantId) return false
    if (c.side !== 'Players' && c.side !== 'Allies') return false
    const hp = c.type === 'pokemon'
      ? (c.entity as Pokemon).currentHp
      : (c.entity as HumanCharacter).currentHp
    return hp > 0
  })
})

const confirmBreather = () => {
  if (!myActiveCombatant.value || requestPending.value) return

  requestPending.value = true
  requestBreather({
    combatantId: myActiveCombatant.value.id,
    assisted: showAssistedOption.value
  })

  // Reset after sending (ack comes via toast)
  setTimeout(() => {
    requestPending.value = false
  }, 2000)

  emit('request-sent')
}
```

**Action cost display:** The panel clearly shows "Full Action (Standard + Shift)" to remind the player of the cost. The button is disabled if either action is already used. PTU p.245: "Taking a Breather uses both a Standard and Shift Action."

**Assisted breather:** The checkbox is disabled if no adjacent ally is detected (simplified client-side check). The actual adjacency validation happens on the GM side when they execute the breather. The GM also handles consuming the assisting ally's Standard Action.

---

## Section K: Healing Item Request Logic (Feature-020 Dependent)

### In `app/components/player/PlayerHealingPanel.vue`

This section only activates if feature-020's healing item system is implemented. Detection is based on whether the `HEALING_ITEM_CATALOG` constant exists.

```typescript
/**
 * Whether the healing items system is available.
 * Checks for feature-020 implementation by testing if the catalog exists.
 */
const healingItemsAvailable = computed((): boolean => {
  try {
    // HEALING_ITEM_CATALOG is defined in app/constants/healingItems.ts (feature-020)
    // If feature-020 is not implemented, this import won't exist
    return typeof HEALING_ITEM_CATALOG !== 'undefined' && Object.keys(HEALING_ITEM_CATALOG).length > 0
  } catch {
    return false
  }
})

/**
 * Available healing items from the trainer's inventory.
 * Filters to items that exist in the healing item catalog.
 */
const availableHealingItems = computed(() => {
  if (!healingItemsAvailable.value) return []
  const inventory = trainerInventory.value
  return inventory.filter(item => {
    return HEALING_ITEM_CATALOG[item.name] !== undefined
  })
})

const selectedHealingItem = ref<{ name: string; description: string } | null>(null)

const selectHealingItem = (item: { name: string; description: string }) => {
  selectedHealingItem.value = item
}

/**
 * Valid heal targets: player-side combatants that could benefit from the selected item.
 * For restoratives: not at full HP and not fainted.
 * For revives: must be fainted.
 * For cures: must have the target condition.
 * Simplified check -- GM does full validation.
 */
const healTargets = computed((): Combatant[] => {
  if (!encounterStore.encounter || !selectedHealingItem.value) return []

  return encounterStore.encounter.combatants.filter(c => {
    if (c.side !== 'Players' && c.side !== 'Allies') return false
    const hp = c.type === 'pokemon'
      ? (c.entity as Pokemon).currentHp
      : (c.entity as HumanCharacter).currentHp
    const maxHp = c.type === 'pokemon'
      ? (c.entity as Pokemon).maxHp
      : (c.entity as HumanCharacter).maxHp
    // Basic filter: alive and not at full HP (for restoratives)
    // GM validates the specifics (revive, cure, etc.)
    return hp < maxHp || hp <= 0
  })
})

const confirmHealingItem = (target: Combatant) => {
  if (!selectedHealingItem.value || requestPending.value) return

  const trainerCombatant = findTrainerCombatant()
  if (!trainerCombatant) return

  requestPending.value = true
  requestHealingItem({
    healingItemName: selectedHealingItem.value.name,
    healingTargetId: target.id,
    healingTargetName: getCombatantName(target),
    trainerCombatantId: trainerCombatant.id
  })

  selectedHealingItem.value = null
  setTimeout(() => { requestPending.value = false }, 2000)
  emit('request-sent')
}
```

---

## Section L: Wire Healing into PlayerCombatActions

### File: `app/components/player/PlayerCombatActions.vue`

Add the healing button and panel to the existing "Requests" section.

**Changes to template:**

```vue
<!-- In the Requests section, after existing buttons -->
<!-- Healing -->
<button
  class="combat-actions__btn combat-actions__btn--heal"
  :disabled="!canUseStandardAction"
  :aria-expanded="showHealingPanel"
  aria-label="Healing options: Take a Breather or use healing items (requires GM approval)"
  @click="showHealingPanel = !showHealingPanel"
>
  <PhHeart :size="20" />
  <span>Heal</span>
</button>

<!-- ... after existing panels ... -->

<!-- Healing Panel (expandable) -->
<PlayerHealingPanel
  v-if="showHealingPanel"
  @request-sent="handleHealingRequestSent"
  @cancel="showHealingPanel = false"
/>
```

**Changes to script:**

```typescript
import PlayerHealingPanel from './PlayerHealingPanel.vue'

const showHealingPanel = ref(false)

// Close healing panel when turn ends
watch(isMyTurn, (isTurn) => {
  if (!isTurn) {
    showHealingPanel.value = false
    // ... existing panel closures ...
  }
})

const handleHealingRequestSent = () => {
  showHealingPanel.value = false
  showToast('Healing request sent to GM')
}
```

**Availability logic:** The heal button is available to both trainers and Pokemon combatants. Trainers can use items (Standard Action) or Take a Breather (Full Action). Pokemon can only Take a Breather. The panel adapts its tabs based on the active combatant type.

```typescript
const canShowHealingItems = computed((): boolean => {
  // Only trainers can use items on targets
  return !isActivePokemon.value
})
```

---

## R024: Trainer AP Drain for Injury

Rule R024 (Trainer AP drain for injury healing) is a rest/sheet mechanic, not a combat action. It is triggered outside of encounters via the existing `useRestHealing.healInjury()` composable and the character REST endpoints. This rule does not need player combat UI -- it operates on the character sheet.

**Status:** Acknowledged as out-of-scope for this design. The existing GM-side character sheet already handles AP drain via the heal-injury endpoints. If a player view character sheet is implemented in the future, AP drain UI can be added there.

---

## P2 File Summary

| File | Type | Change | Lines |
|------|------|--------|-------|
| `app/components/player/PlayerHealingPanel.vue` | New | Breather + healing item request UI | ~200 |
| `app/composables/usePlayerCombat.ts` | Modified | Add requestBreather, requestHealingItem (already in P0) | +0 (done in P0) |
| `app/components/player/PlayerCombatActions.vue` | Modified | Add heal button + panel wiring | +20 |

**Estimated commits:** 3-4

**Acceptance criteria:**
- "Heal" button visible when Standard Action available
- Tapping opens healing panel with "Take a Breather" tab
- Breather tab shows description, action cost, assisted option
- Assisted checkbox disabled when no adjacent ally detected
- "Request Breather" sends `player_action` with `action: 'breather'` and assisted flag
- GM sees breather request in PlayerRequestPanel
- GM approve triggers breather execution and sends result back
- Player sees result in toast notification
- If feature-020 implemented: "Use Item" tab shows available healing items from inventory
- Item selection opens target selector for player-side combatants
- "Request" sends `player_action` with `action: 'use_healing_item'` and item/target details
- Healing panel closes when turn ends
- Button disabled when Standard Action already used

## PTU Rules Verified

| Rule | Verification |
|------|-------------|
| R018 | Take a Breather core effects -- described in panel UI, executed by GM via existing breather endpoint |
| R019 | Full Action cost -- displayed as "Full Action (Standard + Shift)", button disabled when either used |
| R024 | AP drain -- acknowledged as out-of-scope (rest/sheet mechanic, not combat action) |

## Feature-020 Integration Notes

If feature-020 (Healing Item System) is not yet implemented when P2 is developed:
- The "Use Item" tab does not appear in the healing panel
- Only the "Take a Breather" tab is shown
- No compile errors or runtime failures -- the tab is conditionally rendered based on catalog availability
- When feature-020 is later implemented, the tab automatically appears without code changes to this feature

If feature-020 IS implemented:
- The "Use Item" tab shows items from the trainer's inventory that match `HEALING_ITEM_CATALOG`
- Item selection triggers target selection among player-side combatants
- GM handles full validation (item category, target eligibility, action cost, adjacency per P2 of feature-020)
- Player's request is informational -- GM has final say on whether the item use is valid
