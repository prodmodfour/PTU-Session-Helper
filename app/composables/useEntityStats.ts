/**
 * Composable for safely accessing entity stats from various formats
 * Handles both nested (currentStats.attack) and flat (currentAttack) formats
 */
import type { StageModifiers } from '~/types'

// Default stage modifiers
const DEFAULT_STAGES: StageModifiers = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0
}

export function useEntityStats() {
  /**
   * Safely get stage modifiers from an entity
   * Handles both object and JSON string formats
   */
  const getStageModifiers = (entity: unknown): StageModifiers => {
    if (!entity || typeof entity !== 'object') return { ...DEFAULT_STAGES }

    const e = entity as Record<string, unknown>
    if (!e.stageModifiers) return { ...DEFAULT_STAGES }

    // Handle case where stageModifiers is a JSON string
    if (typeof e.stageModifiers === 'string') {
      try {
        return { ...DEFAULT_STAGES, ...JSON.parse(e.stageModifiers) }
      } catch {
        return { ...DEFAULT_STAGES }
      }
    }

    return { ...DEFAULT_STAGES, ...(e.stageModifiers as Partial<StageModifiers>) }
  }

  /**
   * Get a Pokemon's attack stat from various formats
   */
  const getPokemonAttackStat = (entity: unknown): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    // Try currentStats.attack first
    if (e.currentStats && typeof e.currentStats === 'object') {
      const cs = e.currentStats as Record<string, unknown>
      if (typeof cs.attack === 'number') return cs.attack
    }
    // Try flat field (database format)
    if (typeof e.currentAttack === 'number') return e.currentAttack
    // Try baseStats.attack
    if (e.baseStats && typeof e.baseStats === 'object') {
      const bs = e.baseStats as Record<string, unknown>
      if (typeof bs.attack === 'number') return bs.attack
    }
    // Try flat base field
    if (typeof e.baseAttack === 'number') return e.baseAttack
    return 0
  }

  /**
   * Get a Pokemon's special attack stat from various formats
   */
  const getPokemonSpAtkStat = (entity: unknown): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    if (e.currentStats && typeof e.currentStats === 'object') {
      const cs = e.currentStats as Record<string, unknown>
      if (typeof cs.specialAttack === 'number') return cs.specialAttack
    }
    if (typeof e.currentSpAtk === 'number') return e.currentSpAtk
    if (e.baseStats && typeof e.baseStats === 'object') {
      const bs = e.baseStats as Record<string, unknown>
      if (typeof bs.specialAttack === 'number') return bs.specialAttack
    }
    if (typeof e.baseSpAtk === 'number') return e.baseSpAtk
    return 0
  }

  /**
   * Get a Pokemon's defense stat from various formats
   */
  const getPokemonDefenseStat = (entity: unknown): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    if (e.currentStats && typeof e.currentStats === 'object') {
      const cs = e.currentStats as Record<string, unknown>
      if (typeof cs.defense === 'number') return cs.defense
    }
    if (typeof e.currentDefense === 'number') return e.currentDefense
    if (e.baseStats && typeof e.baseStats === 'object') {
      const bs = e.baseStats as Record<string, unknown>
      if (typeof bs.defense === 'number') return bs.defense
    }
    if (typeof e.baseDefense === 'number') return e.baseDefense
    return 0
  }

  /**
   * Get a Pokemon's special defense stat from various formats
   */
  const getPokemonSpDefStat = (entity: unknown): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    if (e.currentStats && typeof e.currentStats === 'object') {
      const cs = e.currentStats as Record<string, unknown>
      if (typeof cs.specialDefense === 'number') return cs.specialDefense
    }
    if (typeof e.currentSpDef === 'number') return e.currentSpDef
    if (e.baseStats && typeof e.baseStats === 'object') {
      const bs = e.baseStats as Record<string, unknown>
      if (typeof bs.specialDefense === 'number') return bs.specialDefense
    }
    if (typeof e.baseSpDef === 'number') return e.baseSpDef
    return 0
  }

  /**
   * Get a Pokemon's speed stat from various formats
   */
  const getPokemonSpeedStat = (entity: unknown): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    if (e.currentStats && typeof e.currentStats === 'object') {
      const cs = e.currentStats as Record<string, unknown>
      if (typeof cs.speed === 'number') return cs.speed
    }
    if (typeof e.currentSpeed === 'number') return e.currentSpeed
    if (e.baseStats && typeof e.baseStats === 'object') {
      const bs = e.baseStats as Record<string, unknown>
      if (typeof bs.speed === 'number') return bs.speed
    }
    if (typeof e.baseSpeed === 'number') return e.baseSpeed
    return 0
  }

  /**
   * Get a human character's stat
   */
  const getHumanStat = (
    entity: unknown,
    stat: 'attack' | 'specialAttack' | 'defense' | 'specialDefense' | 'speed'
  ): number => {
    if (!entity || typeof entity !== 'object') return 0
    const e = entity as Record<string, unknown>

    if (e.stats && typeof e.stats === 'object') {
      const stats = e.stats as Record<string, unknown>
      if (typeof stats[stat] === 'number') return stats[stat] as number
    }
    if (typeof e[stat] === 'number') return e[stat] as number
    return 0
  }

  /**
   * Get attack or special attack stat based on damage class
   */
  const getAttackStat = (
    entity: unknown,
    isPokemon: boolean,
    damageClass: 'Physical' | 'Special' | 'Status'
  ): number => {
    if (damageClass === 'Status') return 0

    if (damageClass === 'Physical') {
      return isPokemon
        ? getPokemonAttackStat(entity)
        : getHumanStat(entity, 'attack')
    } else {
      return isPokemon
        ? getPokemonSpAtkStat(entity)
        : getHumanStat(entity, 'specialAttack')
    }
  }

  /**
   * Get defense or special defense stat based on damage class
   */
  const getDefenseStat = (
    entity: unknown,
    isPokemon: boolean,
    damageClass: 'Physical' | 'Special' | 'Status'
  ): number => {
    if (damageClass === 'Status') return 0

    if (damageClass === 'Physical') {
      return isPokemon
        ? getPokemonDefenseStat(entity)
        : getHumanStat(entity, 'defense')
    } else {
      return isPokemon
        ? getPokemonSpDefStat(entity)
        : getHumanStat(entity, 'specialDefense')
    }
  }

  return {
    getStageModifiers,
    getPokemonAttackStat,
    getPokemonSpAtkStat,
    getPokemonDefenseStat,
    getPokemonSpDefStat,
    getPokemonSpeedStat,
    getHumanStat,
    getAttackStat,
    getDefenseStat,
    DEFAULT_STAGES
  }
}
