/**
 * Pokemon Generator Service
 * Shared logic for generating wild/template/scene Pokemon with full character sheets.
 * Consolidates duplicated generation code from wild-spawn.post.ts, from-scene.post.ts, and load.post.ts.
 */

import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import type { PokemonOrigin } from '~/types/character'

// --- Input / Output types ---

export interface GeneratePokemonInput {
  speciesName: string
  level: number
  nickname?: string | null
  origin: PokemonOrigin
  originLabel?: string          // stored in notes field
  overrideMoves?: MoveDetail[]  // template preservation: skip auto-selection
  overrideAbilities?: Array<{ name: string; effect: string }> // template preservation: skip random pick
}

export interface MoveDetail {
  name: string
  type: string
  damageClass: string
  frequency: string
  ac: number | null
  damageBase: number | null
  range: string
  effect: string
}

export interface GeneratedPokemonData {
  species: string
  level: number
  nickname: string | null
  types: string[]
  baseStats: {
    hp: number; attack: number; defense: number
    specialAttack: number; specialDefense: number; speed: number
  }
  calculatedStats: {
    hp: number; attack: number; defense: number
    specialAttack: number; specialDefense: number; speed: number
  }
  maxHp: number
  moves: MoveDetail[]
  abilities: Array<{ name: string; effect: string }>
  gender: string
  movementCaps: { overland: number; swim: number; sky: number; burrow: number; levitate: number }
  otherCapabilities: string[]
  skills: Record<string, string>
  eggGroups: string[]
}

export interface CreatedPokemon {
  id: string
  species: string
  level: number
  nickname: string | null
  data: GeneratedPokemonData
}

// --- Core functions ---

/**
 * Generate full Pokemon data from species + level.
 * Pure data generation — no DB writes.
 */
export async function generatePokemonData(input: GeneratePokemonInput): Promise<GeneratedPokemonData> {
  // Look up species reference data
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: input.speciesName }
  })

  // Defaults if species not found
  let baseStats = { hp: 5, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
  let types: string[] = ['Normal']
  let abilityNames: string[] = []
  let learnset: Array<{ level: number; move: string }> = []
  let skills: Record<string, string> = {}
  let otherCapabilities: string[] = []
  let movementCaps = { overland: 5, swim: 0, sky: 0, burrow: 0, levitate: 0 }
  let eggGroups: string[] = []

  if (speciesData) {
    baseStats = {
      hp: speciesData.baseHp,
      attack: speciesData.baseAttack,
      defense: speciesData.baseDefense,
      specialAttack: speciesData.baseSpAtk,
      specialDefense: speciesData.baseSpDef,
      speed: speciesData.baseSpeed
    }
    types = speciesData.type2 ? [speciesData.type1, speciesData.type2] : [speciesData.type1]
    abilityNames = JSON.parse(speciesData.abilities)
    learnset = JSON.parse(speciesData.learnset || '[]')
    skills = JSON.parse(speciesData.skills || '{}')
    otherCapabilities = JSON.parse(speciesData.capabilities || '[]')
    movementCaps = {
      overland: speciesData.overland,
      swim: speciesData.swim,
      sky: speciesData.sky,
      burrow: speciesData.burrow,
      levitate: speciesData.levitate
    }
    eggGroups = JSON.parse(speciesData.eggGroups || '[]')
  }

  // Distribute stat points weighted by base stats (PTU: level - 1 points)
  const calculatedStats = distributeStatPoints(baseStats, input.level)

  // HP formula: Level + (HP stat * 3) + 10
  const maxHp = input.level + (calculatedStats.hp * 3) + 10

  // Moves: use overrides if provided, otherwise auto-select from learnset
  const moves = input.overrideMoves
    ? input.overrideMoves
    : await selectMovesFromLearnset(learnset, input.level)

  // Abilities: use overrides if provided, otherwise pick random from species
  const abilities = input.overrideAbilities
    ? input.overrideAbilities
    : pickRandomAbility(abilityNames)

  // Random gender
  const gender = ['Male', 'Female'][Math.floor(Math.random() * 2)]

  return {
    species: input.speciesName,
    level: input.level,
    nickname: input.nickname ?? null,
    types,
    baseStats,
    calculatedStats,
    maxHp,
    moves,
    abilities,
    gender,
    movementCaps,
    otherCapabilities,
    skills,
    eggGroups
  }
}

/**
 * Create a Pokemon DB record from generated data.
 * Always sets isInLibrary: true (visible in sheets).
 */
export async function createPokemonRecord(
  input: GeneratePokemonInput,
  data: GeneratedPokemonData
): Promise<CreatedPokemon> {
  const pokemon = await prisma.pokemon.create({
    data: {
      species: data.species,
      nickname: data.nickname,
      level: data.level,
      experience: 0,
      nature: JSON.stringify({ name: 'Hardy', raisedStat: null, loweredStat: null }),
      type1: data.types[0],
      type2: data.types[1] || null,
      baseHp: data.baseStats.hp,
      baseAttack: data.baseStats.attack,
      baseDefense: data.baseStats.defense,
      baseSpAtk: data.baseStats.specialAttack,
      baseSpDef: data.baseStats.specialDefense,
      baseSpeed: data.baseStats.speed,
      currentHp: data.maxHp,
      maxHp: data.maxHp,
      currentAttack: data.calculatedStats.attack,
      currentDefense: data.calculatedStats.defense,
      currentSpAtk: data.calculatedStats.specialAttack,
      currentSpDef: data.calculatedStats.specialDefense,
      currentSpeed: data.calculatedStats.speed,
      stageModifiers: JSON.stringify({
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
      }),
      abilities: JSON.stringify(data.abilities),
      moves: JSON.stringify(data.moves),
      capabilities: JSON.stringify({
        ...data.movementCaps,
        other: data.otherCapabilities
      }),
      skills: JSON.stringify(data.skills),
      eggGroups: JSON.stringify(data.eggGroups),
      statusConditions: JSON.stringify([]),
      gender: data.gender,
      isInLibrary: true,
      origin: input.origin,
      notes: input.originLabel || null
    }
  })

  return {
    id: pokemon.id,
    species: pokemon.species,
    level: pokemon.level,
    nickname: pokemon.nickname,
    data
  }
}

/**
 * Generate a Pokemon and create its DB record in one call.
 * Primary entry point for most callers.
 */
export async function generateAndCreatePokemon(input: GeneratePokemonInput): Promise<CreatedPokemon> {
  const data = await generatePokemonData(input)
  return createPokemonRecord(input, data)
}

// --- Combatant builder ---

export interface CombatantData {
  id: string
  type: 'pokemon'
  entityId: string
  side: string
  initiative: number
  initiativeBonus: number
  hasActed: boolean
  actionsRemaining: number
  shiftActionsRemaining: number
  turnState: {
    hasActed: boolean
    standardActionUsed: boolean
    shiftActionUsed: boolean
    swiftActionUsed: boolean
    canBeCommanded: boolean
    isHolding: boolean
  }
  injuries: { count: number; sources: string[] }
  physicalEvasion: number
  specialEvasion: number
  speedEvasion: number
  position?: { x: number; y: number }
  tokenSize: number
  readyAction: string | undefined
  entity: {
    id: string
    species: string
    nickname: string | undefined
    level: number
    types: string[]
    gender: string
    currentStats: {
      hp: number; attack: number; defense: number
      specialAttack: number; specialDefense: number; speed: number
    }
    currentHp: number
    maxHp: number
    stageModifiers: {
      attack: number; defense: number; specialAttack: number
      specialDefense: number; speed: number; accuracy: number; evasion: number
    }
    abilities: Array<{ name: string; effect: string }>
    moves: MoveDetail[]
    capabilities: { overland: number; swim: number; sky: number; burrow: number; levitate: number; other: string[] }
    skills: Record<string, string>
    statusConditions: string[]
    spriteUrl: string | undefined
    shiny: boolean
  }
}

/**
 * Build a combatant JSON wrapper from a created Pokemon.
 * Evasions use calculated stats (not base stats) per PTU rules.
 */
export function buildPokemonCombatant(
  pokemon: CreatedPokemon,
  side: string,
  position?: { x: number; y: number },
  tokenSize: number = 1
): CombatantData {
  const { data } = pokemon
  return {
    id: uuidv4(),
    type: 'pokemon',
    entityId: pokemon.id,
    side,
    initiative: data.calculatedStats.speed,
    initiativeBonus: 0,
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    },
    injuries: { count: 0, sources: [] },
    physicalEvasion: Math.floor(data.calculatedStats.defense / 5),
    specialEvasion: Math.floor(data.calculatedStats.specialDefense / 5),
    speedEvasion: Math.floor(data.calculatedStats.speed / 5),
    position,
    tokenSize,
    readyAction: undefined,
    entity: {
      id: pokemon.id,
      species: data.species,
      nickname: data.nickname ?? undefined,
      level: data.level,
      types: data.types,
      gender: data.gender,
      currentStats: {
        hp: data.maxHp,
        attack: data.calculatedStats.attack,
        defense: data.calculatedStats.defense,
        specialAttack: data.calculatedStats.specialAttack,
        specialDefense: data.calculatedStats.specialDefense,
        speed: data.calculatedStats.speed
      },
      currentHp: data.maxHp,
      maxHp: data.maxHp,
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
      },
      abilities: data.abilities,
      moves: data.moves,
      capabilities: {
        ...data.movementCaps,
        other: data.otherCapabilities
      },
      skills: data.skills,
      statusConditions: [],
      spriteUrl: undefined,
      shiny: false
    }
  }
}

// --- Internal helpers ---

/**
 * Distribute (level - 1) stat points weighted by base stats.
 */
function distributeStatPoints(
  baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
  level: number
): { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number } {
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const totalBaseStats = statKeys.reduce((sum, key) => sum + baseStats[key], 0)
  const distributedPoints: Record<string, number> = {
    hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
  }

  let remainingPoints = Math.max(0, level - 1)
  while (remainingPoints > 0) {
    const roll = Math.random() * totalBaseStats
    let cumulative = 0
    for (const key of statKeys) {
      cumulative += baseStats[key]
      if (roll < cumulative) {
        distributedPoints[key]++
        remainingPoints--
        break
      }
    }
  }

  return {
    hp: baseStats.hp + distributedPoints.hp,
    attack: baseStats.attack + distributedPoints.attack,
    defense: baseStats.defense + distributedPoints.defense,
    specialAttack: baseStats.specialAttack + distributedPoints.specialAttack,
    specialDefense: baseStats.specialDefense + distributedPoints.specialDefense,
    speed: baseStats.speed + distributedPoints.speed
  }
}

/**
 * Select up to 6 most recent moves from learnset at or below the given level.
 * Fetches full MoveData for each; falls back to a stub if not found.
 */
async function selectMovesFromLearnset(
  learnset: Array<{ level: number; move: string }>,
  level: number
): Promise<MoveDetail[]> {
  const knownMoves = learnset
    .filter(entry => entry.level <= level)
    .slice(-6)

  const moveDetails: MoveDetail[] = []
  for (const moveEntry of knownMoves) {
    const moveData = await prisma.moveData.findUnique({
      where: { name: moveEntry.move }
    })
    if (moveData) {
      moveDetails.push({
        name: moveData.name,
        type: moveData.type,
        damageClass: moveData.damageClass,
        frequency: moveData.frequency,
        ac: moveData.ac,
        damageBase: moveData.damageBase,
        range: moveData.range,
        effect: moveData.effect
      })
    } else {
      moveDetails.push({
        name: moveEntry.move,
        type: 'Normal',
        damageClass: 'Status',
        frequency: 'At-Will',
        ac: null,
        damageBase: null,
        range: 'Melee',
        effect: ''
      })
    }
  }
  return moveDetails
}

/**
 * Pick a random ability from the first 2 ability names.
 * Returns an array with a single ability object, or empty if none available.
 */
function pickRandomAbility(abilityNames: string[]): Array<{ name: string; effect: string }> {
  if (abilityNames.length === 0) return []
  const selected = abilityNames[Math.floor(Math.random() * Math.min(2, abilityNames.length))]
  return [{ name: selected, effect: '' }]
}
