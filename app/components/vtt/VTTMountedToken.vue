<template>
  <div
    class="vtt-mounted-token"
    :style="containerStyle"
    :data-testid="`vtt-mounted-token-${mountToken.combatantId}`"
  >
    <!-- Mount Token (full size) -->
    <VTTToken
      :token="mountToken"
      :cell-size="cellSize"
      :combatant="mountCombatant"
      :is-current-turn="isCurrentTurn"
      :is-selected="isSelected"
      :is-multi-selected="isMultiSelected"
      :is-gm="isGm"
      :elevation="elevation"
      :is-flanked="isFlanked"
      :is-own-token="isOwnToken"
      :is-pending-move="isPendingMove"
      :display-hp-override="displayHpOverride"
      class="vtt-mounted-token__mount"
      @select="handleMountSelect"
    />

    <!-- Rider Token (60% scale, lower-right quadrant) -->
    <div
      class="vtt-mounted-token__rider"
      :style="riderStyle"
      :title="riderDisplayName"
      @click.stop="handleRiderClick"
    >
      <div class="vtt-mounted-token__rider-avatar">
        <img
          v-if="riderAvatarUrl"
          :src="riderAvatarUrl"
          :alt="riderDisplayName"
          class="vtt-mounted-token__rider-sprite"
          @error="handleRiderSpriteError($event)"
        />
        <span v-else class="vtt-mounted-token__rider-initial">
          {{ riderDisplayName.charAt(0).toUpperCase() }}
        </span>
      </div>

      <!-- Rider HP Bar (thin bar) -->
      <div class="vtt-mounted-token__rider-hp">
        <div
          class="vtt-mounted-token__rider-hp-fill"
          :style="{ width: `${riderHpPercent}%` }"
          :class="riderHpColorClass"
        />
      </div>
    </div>

    <!-- Easy Intercept Badge (PTU p.218) -->
    <div class="vtt-mounted-token__intercept-badge" title="Easy Intercept: no distance requirement (PTU p.218)">
      <PhShieldChevron :size="10" weight="bold" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import { PhShieldChevron } from '@phosphor-icons/vue'

interface TokenData {
  combatantId: string
  position: { x: number; y: number }
  size: number
}

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const props = defineProps<{
  mountToken: TokenData
  riderToken: TokenData
  cellSize: number
  mountCombatant: Combatant
  riderCombatant: Combatant
  isCurrentTurn?: boolean
  isSelected?: boolean
  isMultiSelected?: boolean
  isGm?: boolean
  elevation?: number
  isFlanked?: boolean
  isOwnToken?: boolean
  isPendingMove?: boolean
  displayHpOverride?: number
}>()

const emit = defineEmits<{
  selectMount: [combatantId: string, event: MouseEvent]
  selectRider: [combatantId: string, event: MouseEvent]
}>()

const RIDER_SCALE = 0.6

// Container style: positioned at mount's position, same size as mount token
const containerStyle = computed(() => {
  const size = props.cellSize * props.mountToken.size
  return {
    position: 'absolute' as const,
    left: `${props.mountToken.position.x * props.cellSize}px`,
    top: `${props.mountToken.position.y * props.cellSize}px`,
    width: `${size}px`,
    height: `${size}px`,
    pointerEvents: 'none' as const,
  }
})

// Rider overlay style: 60% scale, positioned in lower-right quadrant
const riderStyle = computed(() => {
  const mountSize = props.cellSize * props.mountToken.size
  const riderSize = mountSize * RIDER_SCALE
  return {
    width: `${riderSize}px`,
    height: `${riderSize}px`,
    right: '2px',
    bottom: '8px',
  }
})

// Rider display
const riderEntity = computed(() => props.riderCombatant?.entity)

const riderDisplayName = computed(() => {
  if (!riderEntity.value) return '???'
  if (props.riderCombatant.type === 'pokemon') {
    const pokemon = riderEntity.value as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (riderEntity.value as HumanCharacter).name
})

const riderAvatarBroken = ref(false)
const riderAvatarUrl = computed(() => {
  if (!riderEntity.value) return null
  if (props.riderCombatant.type === 'pokemon') {
    const pokemon = riderEntity.value as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  if (riderAvatarBroken.value) return null
  return getTrainerSpriteUrl((riderEntity.value as HumanCharacter).avatarUrl)
})

const riderHpPercent = computed(() => {
  if (!riderEntity.value) return 100
  const current = riderEntity.value.currentHp
  const max = riderEntity.value.maxHp
  if (max === 0) return 0
  return Math.max(0, Math.min(100, (current / max) * 100))
})

const riderHpColorClass = computed(() => {
  if (riderHpPercent.value > 50) return 'hp-high'
  if (riderHpPercent.value > 25) return 'hp-medium'
  return 'hp-low'
})

const handleRiderSpriteError = (event: Event) => {
  if (props.riderCombatant.type === 'pokemon') {
    const img = event.target as HTMLImageElement
    img.src = '/images/pokemon-placeholder.svg'
  } else {
    riderAvatarBroken.value = true
  }
}

const handleMountSelect = (combatantId: string, event: MouseEvent) => {
  emit('selectMount', combatantId, event)
}

const handleRiderClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('selectRider', props.riderCombatant.id, event)
}
</script>

<style lang="scss" scoped>
.vtt-mounted-token {
  pointer-events: none;
  z-index: 3;
}

.vtt-mounted-token__mount {
  pointer-events: auto;
}

.vtt-mounted-token__rider {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease;
  z-index: 5;

  &:hover {
    transform: scale(1.1);
    z-index: 10;
  }
}

.vtt-mounted-token__rider-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vtt-mounted-token__rider-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
}

.vtt-mounted-token__rider-initial {
  font-size: 0.7em;
  font-weight: 700;
  color: $color-text;
}

.vtt-mounted-token__rider-hp {
  position: absolute;
  bottom: 1px;
  left: 10%;
  right: 10%;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.vtt-mounted-token__rider-hp-fill {
  height: 100%;
  transition: width 0.3s ease;

  &.hp-high {
    background: $color-success;
  }

  &.hp-medium {
    background: #f59e0b;
  }

  &.hp-low {
    background: $color-danger;
  }
}

.vtt-mounted-token__intercept-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(100, 200, 255, 0.8);
  padding: 2px;
  border-radius: 3px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  pointer-events: auto;
  cursor: help;
}
</style>
