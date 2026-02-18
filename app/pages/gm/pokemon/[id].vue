<template>
  <div class="pokemon-sheet-page">
    <div class="sheet-header">
      <NuxtLink to="/gm/sheets" class="back-link">
        ← Back to Sheets
      </NuxtLink>
      <div class="sheet-header__actions">
        <template v-if="!isEditing">
          <button class="btn btn--primary" @click="startEditing">
            Edit
          </button>
        </template>
        <template v-else>
          <button class="btn btn--secondary" @click="cancelEditing">
            Cancel
          </button>
          <button class="btn btn--primary" @click="saveChanges" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="sheet-loading">
      Loading...
    </div>

    <div v-else-if="error" class="sheet-error">
      <p>{{ error }}</p>
      <NuxtLink to="/gm/sheets" class="btn btn--primary">
        Return to Sheets
      </NuxtLink>
    </div>

    <div v-else-if="pokemon" class="sheet pokemon-sheet">
      <!-- Header with sprite and basic info -->
      <div class="sheet__header">
        <div class="sheet__sprite">
          <img :src="spriteUrl" :alt="pokemon.species" />
          <span v-if="pokemon.shiny" class="shiny-badge">★</span>
        </div>
        <div class="sheet__title">
          <div class="form-row">
            <div class="form-group">
              <label>Species</label>
              <input v-model="editData.species" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group">
              <label>Nickname</label>
              <input v-model="editData.nickname" type="text" class="form-input" :disabled="!isEditing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group--sm">
              <label>Level</label>
              <input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>EXP</label>
              <input v-model.number="editData.experience" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Gender</label>
              <input v-model="editData.gender" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Shiny</label>
              <input v-model="editData.shiny" type="checkbox" class="form-checkbox" :disabled="!isEditing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input v-model="editData.location" type="text" class="form-input" :disabled="!isEditing" placeholder="e.g., Route 1" />
            </div>
          </div>
          <div class="type-badges">
            <span v-for="t in pokemon.types" :key="t" class="type-badge" :class="`type-badge--${t.toLowerCase()}`">
              {{ t }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="sheet__tabs">
        <button
          v-for="tab in pokemonTabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="sheet__content">
        <!-- Stats Tab -->
        <div v-if="activeTab === 'stats'" class="tab-content">
          <div class="stats-grid">
            <div class="stat-block">
              <label>HP</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.hp || 0 }}</span>
                <span class="stat-current">{{ editData.currentHp }} / {{ editData.maxHp }}</span>
              </div>
              <div v-if="isEditing" class="stat-edit">
                <input v-model.number="editData.currentHp" type="number" class="form-input form-input--sm" />
                <span>/</span>
                <input v-model.number="editData.maxHp" type="number" class="form-input form-input--sm" />
              </div>
            </div>
            <div class="stat-block">
              <label>Attack</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.attack || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.attack || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Defense</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.defense || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.defense || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Sp. Atk</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.specialAttack || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.specialAttack || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Sp. Def</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.specialDefense || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.specialDefense || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Speed</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.speed || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.speed || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Combat State Section -->
          <div class="combat-state">
            <!-- Status Conditions -->
            <div v-if="statusConditions.length > 0" class="combat-state__section">
              <h4>Status Conditions</h4>
              <div class="status-list">
                <span
                  v-for="status in statusConditions"
                  :key="status"
                  class="status-badge"
                  :class="`status-badge--${status.toLowerCase().replace(' ', '-')}`"
                >
                  {{ status }}
                </span>
              </div>
            </div>

            <!-- Injuries -->
            <div v-if="pokemon.injuries > 0" class="combat-state__section">
              <h4>Injuries</h4>
              <div class="injury-display">
                <span class="injury-count">{{ pokemon.injuries }}</span>
                <span class="injury-label">Injur{{ pokemon.injuries === 1 ? 'y' : 'ies' }}</span>
              </div>
            </div>

            <!-- Stage Modifiers -->
            <div v-if="hasStageModifiers" class="combat-state__section">
              <h4>Combat Stages</h4>
              <div class="stage-grid">
                <div v-if="pokemon.stageModifiers?.attack !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.attack)">
                  <span class="stage-stat">ATK</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.attack) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.defense !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.defense)">
                  <span class="stage-stat">DEF</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.defense) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.specialAttack !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.specialAttack)">
                  <span class="stage-stat">SP.ATK</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.specialAttack) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.specialDefense !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.specialDefense)">
                  <span class="stage-stat">SP.DEF</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.specialDefense) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.speed !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.speed)">
                  <span class="stage-stat">SPD</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.speed) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.accuracy !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.accuracy)">
                  <span class="stage-stat">ACC</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.accuracy) }}</span>
                </div>
                <div v-if="pokemon.stageModifiers?.evasion !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.evasion)">
                  <span class="stage-stat">EVA</span>
                  <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.evasion) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>Nature</h4>
            <p v-if="pokemon.nature">
              {{ pokemon.nature.name }}
              <span v-if="pokemon.nature.raisedStat" class="nature-mod nature-mod--up">
                +{{ formatStatName(pokemon.nature.raisedStat) }}
              </span>
              <span v-if="pokemon.nature.loweredStat" class="nature-mod nature-mod--down">
                -{{ formatStatName(pokemon.nature.loweredStat) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Moves Tab -->
        <div v-if="activeTab === 'moves'" class="tab-content">
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

        <!-- Abilities Tab -->
        <div v-if="activeTab === 'abilities'" class="tab-content">
          <div class="abilities-list">
            <div v-for="(ability, idx) in pokemon.abilities" :key="idx" class="ability-card">
              <div class="ability-card__header">
                <span class="ability-name">{{ ability.name }}</span>
                <span v-if="ability.trigger" class="ability-trigger">{{ ability.trigger }}</span>
              </div>
              <p class="ability-effect">{{ ability.effect }}</p>
            </div>
            <p v-if="!pokemon.abilities?.length" class="empty-state">No abilities recorded</p>
          </div>
        </div>

        <!-- Capabilities Tab -->
        <div v-if="activeTab === 'capabilities'" class="tab-content">
          <div v-if="pokemon.capabilities" class="capabilities-grid">
            <div class="cap-item">
              <label>Overland</label>
              <span>{{ pokemon.capabilities.overland || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Swim</label>
              <span>{{ pokemon.capabilities.swim || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Sky</label>
              <span>{{ pokemon.capabilities.sky || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Burrow</label>
              <span>{{ pokemon.capabilities.burrow || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Levitate</label>
              <span>{{ pokemon.capabilities.levitate || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Jump (H/L)</label>
              <span>{{ pokemon.capabilities.jump?.high || 0 }} / {{ pokemon.capabilities.jump?.long || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Power</label>
              <span>{{ pokemon.capabilities.power || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Weight Class</label>
              <span>{{ pokemon.capabilities.weightClass || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Size</label>
              <span>{{ pokemon.capabilities.size || 'Medium' }}</span>
            </div>
          </div>
          <div v-if="pokemon.capabilities?.otherCapabilities?.length" class="info-section">
            <h4>Other Capabilities</h4>
            <div class="tag-list">
              <span v-for="cap in pokemon.capabilities.otherCapabilities" :key="cap" class="tag">
                {{ cap }}
              </span>
            </div>
          </div>
        </div>

        <!-- Skills Tab -->
        <div v-if="activeTab === 'skills'" class="tab-content">
          <!-- Last Roll Result -->
          <div v-if="lastSkillRoll" class="roll-result">
            <div class="roll-result__header">
              <span class="roll-result__skill">{{ lastSkillRoll.skill }}</span>
              <span class="roll-result__total">{{ lastSkillRoll.result.total }}</span>
            </div>
            <div class="roll-result__breakdown">{{ lastSkillRoll.result.breakdown }}</div>
          </div>

          <div v-if="pokemon.skills && Object.keys(pokemon.skills).length" class="skills-grid">
            <div v-for="(value, skill) in pokemon.skills" :key="skill" class="skill-item skill-item--clickable" @click="rollSkill(skill as string, value as string)">
              <label>{{ skill }}</label>
              <span class="skill-dice">{{ value }}</span>
            </div>
          </div>
          <p v-else class="empty-state">No skills recorded</p>

          <div class="info-section">
            <h4>Training</h4>
            <div class="training-info">
              <span><strong>Tutor Points:</strong> {{ pokemon.tutorPoints || 0 }}</span>
              <span><strong>Training EXP:</strong> {{ pokemon.trainingExp || 0 }}</span>
            </div>
          </div>

          <div v-if="pokemon.eggGroups?.length" class="info-section">
            <h4>Egg Groups</h4>
            <div class="tag-list">
              <span v-for="eg in pokemon.eggGroups" :key="eg" class="tag">{{ eg }}</span>
            </div>
          </div>
        </div>

        <!-- Healing Tab -->
        <div v-if="activeTab === 'healing'" class="tab-content">
          <!-- Last Healing Result -->
          <div v-if="lastHealingResult" class="healing-result" :class="lastHealingResult.success ? 'healing-result--success' : 'healing-result--error'">
            {{ lastHealingResult.message }}
          </div>

          <!-- Current Status -->
          <div class="healing-status">
            <div class="healing-status__item">
              <span class="healing-status__label">Current HP</span>
              <span class="healing-status__value">{{ pokemon.currentHp }} / {{ pokemon.maxHp }}</span>
            </div>
            <div class="healing-status__item">
              <span class="healing-status__label">Injuries</span>
              <span class="healing-status__value" :class="{ 'text-danger': pokemon.injuries >= 5 }">
                {{ pokemon.injuries || 0 }}
                <span v-if="pokemon.injuries >= 5" class="healing-status__warning">(Cannot rest-heal)</span>
              </span>
            </div>
            <div v-if="healingInfo" class="healing-status__item">
              <span class="healing-status__label">Rest Today</span>
              <span class="healing-status__value">
                {{ formatRestTime(480 - healingInfo.restMinutesRemaining) }} / 8h
              </span>
            </div>
            <div v-if="healingInfo" class="healing-status__item">
              <span class="healing-status__label">HP per Rest</span>
              <span class="healing-status__value">{{ healingInfo.hpPerRest }} HP</span>
            </div>
            <div v-if="healingInfo" class="healing-status__item">
              <span class="healing-status__label">Injuries Healed Today</span>
              <span class="healing-status__value">{{ healingInfo.injuriesHealedToday }} / 3</span>
            </div>
            <div v-if="healingInfo && healingInfo.hoursSinceLastInjury !== null" class="healing-status__item">
              <span class="healing-status__label">Time Since Last Injury</span>
              <span class="healing-status__value">
                {{ Math.floor(healingInfo.hoursSinceLastInjury) }}h
                <span v-if="healingInfo.canHealInjuryNaturally" class="text-success">(Can heal naturally)</span>
                <span v-else-if="healingInfo.hoursUntilNaturalHeal" class="text-muted">
                  ({{ Math.ceil(healingInfo.hoursUntilNaturalHeal) }}h until natural heal)
                </span>
              </span>
            </div>
          </div>

          <!-- Healing Actions -->
          <div class="healing-actions">
            <div class="healing-action">
              <h4>Rest (30 min)</h4>
              <p>Heal {{ healingInfo?.hpPerRest || 0 }} HP. Requires less than 5 injuries and under 8 hours rest today.</p>
              <button
                class="btn btn--primary"
                :disabled="healingLoading || !healingInfo?.canRestHeal || pokemon.currentHp >= pokemon.maxHp"
                @click="handleRest"
              >
                {{ healingLoading ? 'Resting...' : 'Rest 30 min' }}
              </button>
            </div>

            <div class="healing-action">
              <h4>Extended Rest (4+ hours)</h4>
              <p>Heal HP for 4 hours, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Asleep), restore daily moves.</p>
              <button
                class="btn btn--primary"
                :disabled="healingLoading"
                @click="handleExtendedRest"
              >
                {{ healingLoading ? 'Resting...' : 'Extended Rest' }}
              </button>
            </div>

            <div class="healing-action">
              <h4>Pokemon Center</h4>
              <p>Full HP, all status cleared, daily moves restored. Heals up to 3 injuries/day. Time: 1 hour + 30min per injury.</p>
              <button
                class="btn btn--accent"
                :disabled="healingLoading"
                @click="handlePokemonCenter"
              >
                {{ healingLoading ? 'Healing...' : 'Pokemon Center' }}
              </button>
            </div>

            <div v-if="pokemon.injuries > 0" class="healing-action">
              <h4>Natural Injury Healing</h4>
              <p>Heal 1 injury after 24 hours without gaining new injuries. Max 3 injuries healed per day from all sources.</p>
              <button
                class="btn btn--secondary"
                :disabled="healingLoading || !healingInfo?.canHealInjuryNaturally || healingInfo?.injuriesRemainingToday <= 0"
                @click="handleHealInjury"
              >
                {{ healingLoading ? 'Healing...' : 'Heal Injury Naturally' }}
              </button>
            </div>

            <div class="healing-action healing-action--new-day">
              <h4>New Day</h4>
              <p>Reset daily healing limits: rest time, injuries healed counter.</p>
              <button
                class="btn btn--ghost"
                :disabled="healingLoading"
                @click="handleNewDay"
              >
                {{ healingLoading ? 'Resetting...' : 'New Day' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="editData.notes" class="form-input" rows="6" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Held Item</label>
            <input v-model="editData.heldItem" type="text" class="form-input" :disabled="!isEditing" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, Move } from '~/types'
import { roll, rollCritical, type DiceRollResult } from '~/utils/diceRoller'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const { getSpriteUrl } = usePokemonSprite()

const pokemonId = computed(() => route.params.id as string)
const { getDamageRoll } = useDamageCalculation()

// State
const pokemon = ref<Pokemon | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const editData = ref<Partial<Pokemon>>({})
const activeTab = ref('stats')
const lastSkillRoll = ref<{ skill: string; result: DiceRollResult } | null>(null)
const lastMoveRoll = ref<{
  moveName: string
  attack?: {
    result: DiceRollResult
    resultClass?: string
    extra?: string
  }
  damage?: {
    result: DiceRollResult
    resultClass?: string
    extra?: string
    isCrit: boolean
  }
} | null>(null)

// Check for edit mode from query param
onMounted(async () => {
  if (route.query.edit === 'true') {
    isEditing.value = true
  }
  await loadPokemon()
})

// Watch for route param changes
watch(pokemonId, async () => {
  await loadPokemon()
})

const loadPokemon = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean; data: Pokemon }>(`/api/pokemon/${pokemonId.value}`)
    pokemon.value = response.data
    editData.value = { ...response.data }

    useHead({
      title: `GM - ${response.data.nickname || response.data.species}`
    })
  } catch (e) {
    error.value = 'Pokemon not found'
    console.error('Failed to load Pokemon:', e)
  } finally {
    loading.value = false
  }
}

const spriteUrl = computed(() => {
  if (!pokemon.value) return ''
  return getSpriteUrl(pokemon.value.species, pokemon.value.shiny)
})

// Rest/Healing
const { rest, extendedRest, pokemonCenter, healInjury, newDay, getHealingInfo, formatRestTime, loading: healingLoading } = useRestHealing()
const lastHealingResult = ref<{ success: boolean; message: string } | null>(null)

const healingInfo = computed(() => {
  if (!pokemon.value) return null
  return getHealingInfo({
    maxHp: pokemon.value.maxHp,
    injuries: pokemon.value.injuries || 0,
    restMinutesToday: pokemon.value.restMinutesToday || 0,
    lastInjuryTime: pokemon.value.lastInjuryTime || null,
    injuriesHealedToday: pokemon.value.injuriesHealedToday || 0
  })
})

const handleRest = async () => {
  if (!pokemon.value) return
  const result = await rest('pokemon', pokemon.value.id)
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    await loadPokemon()
  }
}

const handleExtendedRest = async () => {
  if (!pokemon.value) return
  const result = await extendedRest('pokemon', pokemon.value.id)
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    await loadPokemon()
  }
}

const handlePokemonCenter = async () => {
  if (!pokemon.value) return
  const result = await pokemonCenter('pokemon', pokemon.value.id)
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    await loadPokemon()
  }
}

const handleHealInjury = async () => {
  if (!pokemon.value) return
  const result = await healInjury('pokemon', pokemon.value.id, 'natural')
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    await loadPokemon()
  }
}

const handleNewDay = async () => {
  if (!pokemon.value) return
  const result = await newDay('pokemon', pokemon.value.id)
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    await loadPokemon()
  }
}

// Tabs
const pokemonTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'moves', label: 'Moves' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'healing', label: 'Healing' },
  { id: 'notes', label: 'Notes' }
]

const formatStatName = (stat: string) => {
  const names: Record<string, string> = {
    'hp': 'HP',
    'attack': 'Atk',
    'defense': 'Def',
    'specialAttack': 'SpAtk',
    'specialDefense': 'SpDef',
    'speed': 'Spd'
  }
  return names[stat] || stat
}

// Combat state computed properties
const statusConditions = computed(() => {
  if (!pokemon.value?.statusConditions) return []
  return Array.isArray(pokemon.value.statusConditions)
    ? pokemon.value.statusConditions
    : []
})

const hasStageModifiers = computed(() => {
  if (!pokemon.value?.stageModifiers) return false
  const mods = pokemon.value.stageModifiers
  return mods.attack !== 0 || mods.defense !== 0 ||
         mods.specialAttack !== 0 || mods.specialDefense !== 0 ||
         mods.speed !== 0 || mods.accuracy !== 0 || mods.evasion !== 0
})

const formatStageValue = (value: number | undefined): string => {
  if (value === undefined || value === 0) return '0'
  return value > 0 ? `+${value}` : `${value}`
}

const getStageClass = (value: number | undefined): string => {
  if (value === undefined || value === 0) return ''
  return value > 0 ? 'stage-item--positive' : 'stage-item--negative'
}

// Skill rolling
const rollSkill = (skill: string, notation: string) => {
  const result = roll(notation)
  lastSkillRoll.value = { skill, result }
}

// Move helpers
const getAttackStat = (move: Move): number => {
  if (!pokemon.value) return 0
  if (move.damageClass === 'Physical') {
    return pokemon.value.currentStats?.attack || 0
  } else if (move.damageClass === 'Special') {
    return pokemon.value.currentStats?.specialAttack || 0
  }
  return 0
}

const getMoveDamageFormula = (move: Move): string => {
  if (!move.damageBase) return '-'
  const diceNotation = getDamageRoll(move.damageBase)
  const stat = getAttackStat(move)
  if (stat > 0) {
    return `${diceNotation}+${stat}`
  }
  return diceNotation
}

// Move rolling
const rollAttack = (move: Move) => {
  const result = roll('1d20')
  const naturalRoll = result.dice[0]

  let extra = ''
  let resultClass = ''

  if (naturalRoll === 20) {
    extra = 'Natural 20! CRIT!'
    resultClass = 'roll-result__total--crit'
  } else if (naturalRoll === 1) {
    extra = 'Natural 1! Miss!'
    resultClass = 'roll-result__total--miss'
  } else if (move.ac && result.total >= move.ac) {
    extra = `vs AC ${move.ac} - Hit!`
    resultClass = 'roll-result__total--hit'
  } else if (move.ac) {
    extra = `vs AC ${move.ac} - Miss`
    resultClass = 'roll-result__total--miss'
  }

  // New attack clears previous rolls
  lastMoveRoll.value = {
    moveName: move.name,
    attack: {
      result,
      resultClass,
      extra
    }
  }
}

const rollDamage = (move: Move, isCrit: boolean) => {
  if (!move.damageBase) return

  const notation = getDamageRoll(move.damageBase)
  const diceResult = isCrit ? rollCritical(notation) : roll(notation)
  const stat = getAttackStat(move)

  // Add stat to the total
  const total = diceResult.total + stat
  const statLabel = move.damageClass === 'Physical' ? 'Atk' : 'SpAtk'
  const breakdown = stat > 0
    ? `${diceResult.breakdown.replace(/ = \d+$/, '')} + ${stat} (${statLabel}) = ${total}`
    : diceResult.breakdown

  const result: DiceRollResult = {
    ...diceResult,
    total,
    breakdown
  }

  const damageRoll = {
    result,
    resultClass: isCrit ? 'roll-result__total--crit' : undefined,
    extra: isCrit ? 'Critical Hit!' : undefined,
    isCrit
  }

  // If same move, keep the attack roll; otherwise start fresh
  if (lastMoveRoll.value?.moveName === move.name) {
    lastMoveRoll.value = {
      ...lastMoveRoll.value,
      damage: damageRoll
    }
  } else {
    lastMoveRoll.value = {
      moveName: move.name,
      damage: damageRoll
    }
  }
}

// Edit mode
const startEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = true
  // Update URL without navigation
  router.replace({ query: { edit: 'true' } })
}

const cancelEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = false
  router.replace({ query: {} })
}

const saveChanges = async () => {
  if (!pokemon.value) return

  saving.value = true
  try {
    await libraryStore.updatePokemon(pokemon.value.id, editData.value)
    // Reload to get fresh data
    await loadPokemon()
    isEditing.value = false
    router.replace({ query: {} })
  } catch (e) {
    console.error('Failed to save Pokemon:', e)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.pokemon-sheet-page {
  max-width: 900px;
  margin: 0 auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $glass-border;

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.back-link {
  color: $color-text-muted;
  text-decoration: none;
  transition: color $transition-fast;

  &:hover {
    color: $color-text;
  }
}

.sheet-loading,
.sheet-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: $color-text-muted;

  p {
    margin-bottom: $spacing-md;
  }
}

.sheet {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  padding: $spacing-lg;

  &__header {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $glass-border;
  }

  &__sprite {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    overflow: hidden;
    position: relative;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    .shiny-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      color: gold;
      font-size: 1.2rem;
    }
  }

  &__title {
    flex: 1;
  }

  &__tabs {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;
    overflow-x: auto;
  }

  &__content {
    min-height: 300px;
  }
}

.tab-btn {
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: none;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  border-radius: $border-radius-md;
  transition: all $transition-fast;
  white-space: nowrap;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &--active {
    background: $gradient-sv-cool;
    color: $color-text;
  }
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

.type-badges {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
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

// Combat state styles
.combat-state {
  margin-bottom: $spacing-lg;

  &__section {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    background: $color-bg-secondary;
    border-radius: $border-radius-md;

    h4 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-transform: uppercase;
    }
  }
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.status-badge {
  padding: 4px 8px;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  // Persistent conditions
  &--burned { background: #ff6b35; color: #fff; }
  &--frozen { background: #7dd3fc; color: #000; }
  &--paralyzed { background: #facc15; color: #000; }
  &--poisoned { background: #a855f7; color: #fff; }
  &--badly-poisoned { background: #7c3aed; color: #fff; }
  &--asleep { background: #6b7280; color: #fff; }
  &--fainted { background: #1f2937; color: #9ca3af; }

  // Volatile conditions
  &--confused { background: #f472b6; color: #000; }
  &--flinched { background: #fbbf24; color: #000; }
  &--infatuated { background: #ec4899; color: #fff; }
  &--cursed { background: #581c87; color: #fff; }
  &--disabled { background: #64748b; color: #fff; }
  &--encored { background: #22d3ee; color: #000; }
  &--taunted { background: #ef4444; color: #fff; }
  &--tormented { background: #991b1b; color: #fff; }
  &--enraged { background: #dc2626; color: #fff; }
  &--suppressed { background: #475569; color: #fff; }

  // Movement conditions
  &--stuck { background: #92400e; color: #fff; }
  &--trapped { background: #78350f; color: #fff; }
  &--slowed { background: #0369a1; color: #fff; }

  // Default
  background: $color-bg-tertiary;
  color: $color-text;
}

.injury-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .injury-count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: $color-danger;
    color: #fff;
    border-radius: 50%;
    font-size: $font-size-lg;
    font-weight: 700;
  }

  .injury-label {
    color: $color-danger;
    font-weight: 500;
  }
}

.stage-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  min-width: 50px;

  .stage-stat {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
  }

  .stage-value {
    font-size: $font-size-md;
    font-weight: 700;
  }

  &--positive {
    border: 1px solid $color-success;
    .stage-value { color: $color-success; }
  }

  &--negative {
    border: 1px solid $color-danger;
    .stage-value { color: $color-danger; }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
    text-transform: uppercase;
  }

  .stat-values {
    display: flex;
    justify-content: center;
    gap: $spacing-sm;
    align-items: baseline;
  }

  .stat-base {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .stat-current {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text;
  }

  .stat-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;

    .form-input--sm {
      width: 60px;
      padding: $spacing-xs;
      text-align: center;
    }
  }
}

.info-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
  }
}

.nature-mod {
  font-size: $font-size-sm;
  margin-left: $spacing-sm;

  &--up { color: $color-success; }
  &--down { color: $color-danger; }
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

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.ability-card {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .ability-name {
      font-weight: 600;
    }

    .ability-trigger {
      font-size: $font-size-xs;
      padding: $spacing-xs $spacing-sm;
      background: $color-bg-tertiary;
      border-radius: $border-radius-sm;
      color: $color-text-muted;
    }
  }

  .ability-effect {
    font-size: $font-size-sm;
    line-height: 1.5;
    margin: 0;
  }
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.cap-item {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  span {
    font-size: $font-size-lg;
    font-weight: 600;
  }
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;

  label {
    font-size: $font-size-sm;
  }

  span {
    font-weight: 500;
    font-size: $font-size-sm;
  }

  &--clickable {
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-tertiary;
      transform: translateX(4px);

      .skill-dice {
        color: $color-accent-violet;
      }
    }

    &:active {
      transform: translateX(2px);
    }
  }
}

.skill-dice {
  font-family: 'Fira Code', 'Consolas', monospace;
  transition: color $transition-fast;
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

.training-info {
  display: flex;
  gap: $spacing-lg;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
}

.empty-state {
  text-align: center;
  color: $color-text-muted;
  padding: $spacing-xl;
}

.form-row {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .form-group {
    flex: 1;

    &--sm {
      flex: 0 0 auto;
      min-width: 100px;
    }
  }
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: $color-accent-violet;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Healing tab styles
.healing-result {
  padding: $spacing-md;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-weight: 500;

  &--success {
    background: rgba($color-success, 0.15);
    border: 1px solid $color-success;
    color: $color-success;
  }

  &--error {
    background: rgba($color-danger, 0.15);
    border: 1px solid $color-danger;
    color: $color-danger;
  }
}

.healing-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;

  &__item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: $font-size-md;
    font-weight: 600;
  }

  &__warning {
    font-size: $font-size-xs;
    color: $color-danger;
    font-weight: normal;
  }
}

.healing-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
}

.healing-action {
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid $glass-border;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-md;
    color: $color-text;
  }

  p {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  .btn {
    width: 100%;
  }
}

.text-danger {
  color: $color-danger;
}

.text-success {
  color: $color-success;
}

.text-muted {
  color: $color-text-muted;
}
</style>
