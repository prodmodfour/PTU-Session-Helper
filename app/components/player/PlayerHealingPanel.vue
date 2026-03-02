<template>
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
        :disabled="requestPending || !canRequestBreather"
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
        <div v-if="!selectedHealingItem" class="healing-panel__item-list">
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
          <div v-if="availableHealingItems.length === 0" class="combat-actions__panel-empty">
            No healing items in inventory.
          </div>
        </div>

        <!-- Target selection (after item selected) -->
        <div v-if="selectedHealingItem" class="healing-panel__targets">
          <p class="healing-panel__hint">Select target for {{ selectedHealingItem.name }}:</p>
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
          <div v-if="healTargets.length === 0" class="combat-actions__panel-empty">
            No valid targets for this item.
          </div>
          <button
            class="combat-actions__btn combat-actions__btn--cancel"
            @click="selectedHealingItem = null"
          >
            Back to items
          </button>
        </div>
      </template>
      <div v-else class="combat-actions__panel-empty">
        Healing items are not available yet.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhHeart, PhWarning, PhInfo, PhWind } from '@phosphor-icons/vue'
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import { HEALING_ITEM_CATALOG, type HealingItemDef } from '~/constants/healingItems'

const emit = defineEmits<{
  'request-sent': []
  cancel: []
}>()

const {
  requestBreather,
  requestHealingItem,
  canUseStandardAction,
  canUseShiftAction,
  myActiveCombatant,
  trainerInventory
} = usePlayerCombat()

const encounterStore = useEncounterStore()
const { getCombatantName } = useCombatantDisplay()

// =============================================
// State
// =============================================

const activeTab = ref<'breather' | 'items'>('breather')
const requestPending = ref(false)
const showAssistedOption = ref(false)
const selectedHealingItem = ref<HealingItemDef | null>(null)

// =============================================
// Breather Logic (Section J)
// =============================================

/**
 * Whether the breather button should be enabled.
 * Take a Breather is a Full Action (Standard + Shift).
 * Both actions must be available.
 */
const canRequestBreather = computed((): boolean => {
  return canUseStandardAction.value && canUseShiftAction.value && !!myActiveCombatant.value
})

/**
 * Whether an adjacent ally is available for assisted breather.
 * Simplified check: if any player-side combatant other than the active one
 * is alive. Full adjacency check happens on the GM side.
 */
const hasAdjacentAlly = computed((): boolean => {
  if (!encounterStore.encounter) return false
  const activeCombatantId = myActiveCombatant.value?.id
  return encounterStore.encounter.combatants.some(c => {
    if (c.id === activeCombatantId) return false
    if (c.side !== 'players' && c.side !== 'allies') return false
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

// =============================================
// Healing Item Logic (Section K)
// =============================================

/**
 * Whether healing items feature (feature-020) is available.
 * Checks that the HEALING_ITEM_CATALOG is populated.
 */
const healingItemsAvailable = computed((): boolean => {
  try {
    return typeof HEALING_ITEM_CATALOG !== 'undefined' && Object.keys(HEALING_ITEM_CATALOG).length > 0
  } catch {
    return false
  }
})

/**
 * Healing items from the trainer's inventory that are in the catalog.
 */
const availableHealingItems = computed((): HealingItemDef[] => {
  if (!healingItemsAvailable.value) return []
  const inventory = trainerInventory.value
  return inventory
    .filter(item => HEALING_ITEM_CATALOG[item.name] !== undefined)
    .map(item => HEALING_ITEM_CATALOG[item.name])
})

const selectHealingItem = (item: HealingItemDef) => {
  selectedHealingItem.value = item
}

/**
 * Valid heal targets: player-side combatants that are damaged or fainted.
 */
const healTargets = computed((): Combatant[] => {
  if (!encounterStore.encounter || !selectedHealingItem.value) return []

  return encounterStore.encounter.combatants.filter(c => {
    if (c.side !== 'players' && c.side !== 'allies') return false
    const hp = c.type === 'pokemon'
      ? (c.entity as Pokemon).currentHp
      : (c.entity as HumanCharacter).currentHp
    const maxHp = c.type === 'pokemon'
      ? (c.entity as Pokemon).maxHp
      : (c.entity as HumanCharacter).maxHp
    return hp < maxHp || hp <= 0
  })
})

/**
 * Find the trainer combatant (the player's human character in the encounter).
 * Needed because healing item use is a trainer action.
 */
const findTrainerCombatant = (): Combatant | null => {
  if (!encounterStore.encounter) return null
  const playerStore = usePlayerIdentityStore()
  const charId = playerStore.characterId
  if (!charId) return null
  return encounterStore.encounter.combatants.find(
    c => c.type === 'human' && c.entityId === charId
  ) ?? null
}

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
</script>

<style lang="scss" scoped>
.healing-panel {
  &__tabs {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }

  &__tab {
    flex: 1;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $glass-border;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $color-text-muted;
    font-size: $font-size-xs;
    font-weight: 600;
    cursor: pointer;
    transition: all $transition-fast;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: $color-bg-hover;
    }

    &--active {
      background: rgba($color-accent-teal, 0.15);
      border-color: rgba($color-accent-teal, 0.4);
      color: $color-accent-teal;
    }
  }

  &__breather {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__description {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    p {
      margin: 0;
      font-size: $font-size-xs;
      color: $color-text-secondary;
      line-height: 1.4;
    }
  }

  &__warning {
    display: flex;
    align-items: flex-start;
    gap: $spacing-xs;
    color: $color-warning !important;
    font-weight: 600;
  }

  &__action-cost {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-muted;
    padding: $spacing-xs $spacing-sm;
    background: rgba($color-info, 0.1);
    border-radius: $border-radius-sm;
  }

  &__assisted-toggle {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text;
    cursor: pointer;

    input[type="checkbox"] {
      accent-color: $color-accent-teal;
    }

    input:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__assisted-hint {
    color: $color-text-muted;
    font-style: italic;
  }

  &__assisted-desc {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    line-height: 1.4;
    padding-left: $spacing-md;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__item-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__targets {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: 0 0 $spacing-xs;
  }

  &__hp {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
