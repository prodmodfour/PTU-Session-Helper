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
  animation: fadeIn 0.2s ease-out;
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
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;

  &--normal { background: #A8A878; color: #fff; }
  &--fire { background: #F08030; color: #fff; }
  &--water { background: #6890F0; color: #fff; }
  &--electric { background: #F8D030; color: #000; }
  &--grass { background: #78C850; color: #fff; }
  &--ice { background: #98D8D8; color: #000; }
  &--fighting { background: #C03028; color: #fff; }
  &--poison { background: #A040A0; color: #fff; }
  &--ground { background: #E0C068; color: #000; }
  &--flying { background: #A890F0; color: #fff; }
  &--psychic { background: #F85888; color: #fff; }
  &--bug { background: #A8B820; color: #fff; }
  &--rock { background: #B8A038; color: #fff; }
  &--ghost { background: #705898; color: #fff; }
  &--dragon { background: #7038F8; color: #fff; }
  &--dark { background: #705848; color: #fff; }
  &--steel { background: #B8B8D0; color: #000; }
  &--fairy { background: #EE99AC; color: #000; }
}

.roll-result {
  background: linear-gradient(135deg, rgba($color-accent-violet, 0.15) 0%, rgba($color-accent-scarlet, 0.1) 100%);
  border: 1px solid rgba($color-accent-violet, 0.3);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-lg;
  animation: rollIn 0.3s ease-out;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__skill {
    font-weight: 600;
    color: $color-text;
  }

  &__total {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $color-accent-violet;

    &--crit {
      color: #ffd700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    &--hit {
      color: $color-success;
    }

    &--miss {
      color: $color-danger;
    }
  }

  &__type {
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    color: $color-text-muted;
  }

  &__extra {
    font-size: $font-size-sm;
    margin-left: $spacing-sm;
    color: $color-text-muted;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm 0;
    border-bottom: 1px solid rgba($glass-border, 0.5);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-of-type {
      padding-top: 0;
    }
  }

  &__breakdown {
    width: 100%;
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-family: 'Fira Code', 'Consolas', monospace;
  }
}

@keyframes rollIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.empty-state {
  text-align: center;
  color: $color-text-muted;
  padding: $spacing-xl;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
