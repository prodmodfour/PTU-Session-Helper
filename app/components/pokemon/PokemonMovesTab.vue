<template>
  <div class="tab-content">
    <!-- Last Move Roll Result -->
    <div v-if="lastMoveRoll" class="roll-result roll-result--move">
      <div class="roll-result__header">
        <span class="roll-result__skill">{{ lastMoveRoll.moveName }}</span>
      </div>

      <!-- Attack Roll -->
      <div v-if="lastMoveRoll.attack" class="roll-result__row">
        <span class="roll-result__type">Attack</span>
        <span class="roll-result__total" :class="lastMoveRoll.attack.resultClass">
          {{ lastMoveRoll.attack.result.total }}
        </span>
        <span v-if="lastMoveRoll.attack.extra" class="roll-result__extra">{{ lastMoveRoll.attack.extra }}</span>
        <div class="roll-result__breakdown">{{ lastMoveRoll.attack.result.breakdown }}</div>
      </div>

      <!-- Damage Roll -->
      <div v-if="lastMoveRoll.damage" class="roll-result__row">
        <span class="roll-result__type">{{ lastMoveRoll.damage.isCrit ? 'Crit Damage' : 'Damage' }}</span>
        <span class="roll-result__total" :class="lastMoveRoll.damage.resultClass">
          {{ lastMoveRoll.damage.result.total }}
        </span>
        <span v-if="lastMoveRoll.damage.extra" class="roll-result__extra">{{ lastMoveRoll.damage.extra }}</span>
        <div class="roll-result__breakdown">{{ lastMoveRoll.damage.result.breakdown }}</div>
      </div>
    </div>

    <div class="moves-list">
      <div v-for="(move, idx) in pokemon.moves" :key="idx" class="move-card">
        <div class="move-card__header">
          <span class="move-name">{{ move.name }}</span>
          <span class="move-type type-badge" :class="`type-badge--${(move.type || 'normal').toLowerCase()}`">
            {{ move.type }}
          </span>
        </div>
        <div class="move-card__details">
          <span><strong>Class:</strong> {{ move.damageClass }}</span>
          <span><strong>Freq:</strong> {{ move.frequency }}</span>
          <span v-if="move.ac !== null"><strong>AC:</strong> {{ move.ac }}</span>
          <span v-if="move.damageBase"><strong>Damage:</strong> {{ getMoveDamageFormula(move) }}</span>
        </div>
        <div class="move-card__range">
          <strong>Range:</strong> {{ move.range }}
        </div>
        <div v-if="move.effect" class="move-card__effect">
          {{ move.effect }}
        </div>
        <div class="move-card__rolls">
          <button
            v-if="move.ac !== null"
            class="btn btn--sm btn--secondary"
            @click="rollAttack(move)"
          >
            Attack (AC {{ move.ac }})
          </button>
          <button
            v-if="move.damageBase"
            class="btn btn--sm btn--secondary"
            @click="rollDamage(move, false)"
          >
            Damage
          </button>
          <button
            v-if="move.damageBase"
            class="btn btn--sm btn--accent"
            @click="rollDamage(move, true)"
          >
            Crit!
          </button>
        </div>
      </div>
      <p v-if="!pokemon.moves?.length" class="empty-state">No moves recorded</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, Move } from '~/types'
import type { MoveRollState } from '~/composables/usePokemonSheetRolls'

defineProps<{
  pokemon: Pokemon
  lastMoveRoll: MoveRollState | null
  getMoveDamageFormula: (move: Move) => string
}>()

const emit = defineEmits<{
  'roll-attack': [move: Move]
  'roll-damage': [move: Move, isCrit: boolean]
}>()

const rollAttack = (move: Move) => {
  emit('roll-attack', move)
}

const rollDamage = (move: Move, isCrit: boolean) => {
  emit('roll-damage', move, isCrit)
}
</script>

<style lang="scss" scoped>
.tab-content {
  @include pokemon-tab-content;
}

.moves-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.move-card {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  border-left: 3px solid $color-accent-violet;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .move-name {
      font-weight: 600;
      font-size: $font-size-md;
    }
  }

  &__details {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  &__range {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }

  &__effect {
    font-size: $font-size-sm;
    line-height: 1.5;
    color: $color-text;
  }

  &__rolls {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;
  }
}

.type-badge {
  @include pokemon-sheet-type-badge;
}

.roll-result {
  @include pokemon-roll-result;
}

.empty-state {
  @include pokemon-empty-state;
}

@include pokemon-sheet-keyframes;
</style>
