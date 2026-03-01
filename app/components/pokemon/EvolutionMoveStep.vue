<template>
  <div>
    <h4 class="step-title">
      <PhSword :size="16" />
      Evolution Moves
    </h4>

    <div v-if="evolutionMoves.availableMoves.length === 0" class="no-moves-message">
      No new moves available from this evolution.
    </div>

    <template v-else>
      <p class="move-slots-info">
        Move slots: {{ selectedMoveList.length }} / 6
        <span v-if="slotsAvailable > 0" class="slots-available">
          ({{ slotsAvailable }} open)
        </span>
      </p>

      <!-- Current moves -->
      <div class="current-moves">
        <p class="move-list-label">Current Moves:</p>
        <div
          v-for="(move, idx) in selectedMoveList"
          :key="'current-' + idx"
          class="move-item"
          :class="{ 'move-item--new': isNewMove(move.name) }"
        >
          <div class="move-item__info">
            <span class="move-item__name">{{ move.name }}</span>
            <span :class="['type-badge', `type-badge--${(move.type || 'normal').toLowerCase()}`]">
              {{ move.type || 'Normal' }}
            </span>
            <span class="move-item__class">{{ move.damageClass || 'Status' }}</span>
          </div>
          <button
            v-if="isNewMove(move.name)"
            class="btn btn--sm btn--danger"
            @click="$emit('remove-move', move.name)"
            title="Remove this move"
          >
            <PhX :size="12" />
          </button>
          <button
            v-else-if="hasMovesToLearn"
            class="btn btn--sm btn--secondary"
            @click="toggleReplacing(idx)"
            :class="{ 'btn--active': replacingIndex === idx }"
            title="Replace this move"
          >
            <PhSwap :size="12" />
          </button>
        </div>
      </div>

      <!-- Available evolution moves -->
      <div class="available-moves">
        <p class="move-list-label">Available Evolution Moves:</p>
        <div
          v-for="move in unlearnedEvolutionMoves"
          :key="'evo-' + move.name"
          class="evo-move-item"
        >
          <div class="evo-move-item__info">
            <span class="evo-move-item__name">{{ move.name }}</span>
            <span class="evo-move-item__level">Lv.{{ move.level }}</span>
            <span
              v-if="move.detail"
              :class="['type-badge', `type-badge--${(move.detail.type || 'normal').toLowerCase()}`]"
            >{{ move.detail.type }}</span>
            <span v-if="move.detail" class="evo-move-item__class">{{ move.detail.damageClass }}</span>
          </div>
          <button
            v-if="selectedMoveList.length < 6"
            class="btn btn--sm btn--success"
            @click="$emit('add-move', move)"
            title="Learn this move"
          >
            <PhPlus :size="12" />
          </button>
          <button
            v-else-if="replacingIndex !== null"
            class="btn btn--sm btn--warning"
            @click="handleReplace(move)"
            title="Replace selected move"
          >
            <PhSwap :size="12" />
          </button>
          <span v-else class="evo-move-item__full">Moves full</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhSword, PhPlus, PhX, PhSwap } from '@phosphor-icons/vue'
import type { EvolutionMoveResult } from '~/utils/evolutionCheck'

interface MoveDetail {
  name: string
  type: string
  damageClass: string
  frequency: string
  ac: number | null
  damageBase: number | null
  range: string
  effect: string
}

interface EvolutionMoveWithDetail {
  name: string
  level: number
  detail: MoveDetail | null
}

const props = defineProps<{
  currentMoves: MoveDetail[]
  evolutionMoves: EvolutionMoveResult
  addedMoves: EvolutionMoveWithDetail[]
  removedMoves: string[]
  evolutionMoveDetails: Map<string, MoveDetail>
}>()

const emit = defineEmits<{
  'add-move': [move: EvolutionMoveWithDetail]
  'remove-move': [moveName: string]
  'replace-move': [payload: { oldMoveName: string; newMove: EvolutionMoveWithDetail }]
}>()

const replacingIndex = ref<number | null>(null)

const selectedMoveList = computed((): MoveDetail[] => {
  const removedSet = new Set(props.removedMoves.map(n => n.toLowerCase()))
  const kept = props.currentMoves.filter(m => !removedSet.has(m.name.toLowerCase()))
  const added: MoveDetail[] = props.addedMoves.map(m => {
    const detail = m.detail || props.evolutionMoveDetails.get(m.name)
    return {
      name: m.name, type: detail?.type || 'Normal',
      damageClass: detail?.damageClass || 'Status', frequency: detail?.frequency || 'At-Will',
      ac: detail?.ac ?? null, damageBase: detail?.damageBase ?? null,
      range: detail?.range || 'Melee', effect: detail?.effect || ''
    }
  })
  return [...kept, ...added]
})

const slotsAvailable = computed(() => Math.max(0, 6 - selectedMoveList.value.length))

const unlearnedEvolutionMoves = computed((): EvolutionMoveWithDetail[] => {
  const addedSet = new Set(props.addedMoves.map(m => m.name.toLowerCase()))
  return props.evolutionMoves.availableMoves
    .filter(m => !addedSet.has(m.name.toLowerCase()))
    .map(m => ({
      name: m.name,
      level: m.level,
      detail: props.evolutionMoveDetails.get(m.name) || null
    }))
})

const hasMovesToLearn = computed(() => unlearnedEvolutionMoves.value.length > 0)

function isNewMove(moveName: string): boolean {
  return props.addedMoves.some(m => m.name.toLowerCase() === moveName.toLowerCase())
}

function toggleReplacing(idx: number): void {
  replacingIndex.value = replacingIndex.value === idx ? null : idx
}

function handleReplace(newMove: EvolutionMoveWithDetail): void {
  if (replacingIndex.value === null) return
  const moveToReplace = selectedMoveList.value[replacingIndex.value]
  if (!moveToReplace) return

  emit('replace-move', { oldMoveName: moveToReplace.name, newMove })
  replacingIndex.value = null
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/evolution-modal';
@import '~/assets/scss/components/type-badges';
</style>
