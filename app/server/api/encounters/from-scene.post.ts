// TODO: Extract shared wild Pokemon creation logic from wild-spawn.post.ts into a service.
// This endpoint duplicates that logic for pragmatic reasons (avoid expanding scope mid-feature).

import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'

interface ScenePokemonEntry {
  id: string
  speciesId?: string
  species: string
  level: number
  nickname?: string | null
}

interface SceneCharacterEntry {
  id: string
  characterId: string
  name: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { sceneId, battleType } = body

  if (!sceneId) {
    throw createError({ statusCode: 400, message: 'sceneId is required' })
  }

  try {
    // Fetch the scene
    const scene = await prisma.scene.findUnique({ where: { id: sceneId } })
    if (!scene) {
      throw createError({ statusCode: 404, message: 'Scene not found' })
    }

    // Create the encounter
    const encounter = await prisma.encounter.create({
      data: {
        name: scene.name,
        battleType: battleType || 'full_contact',
        weather: scene.weather ?? null,
        combatants: '[]',
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: '[]',
        isActive: false,
        isPaused: false,
        isServed: false,
        gridEnabled: true,
        gridWidth: 20,
        gridHeight: 15,
        gridCellSize: 40,
        gridBackground: null,
        moveLog: '[]',
        defeatedEnemies: '[]'
      }
    })

    const combatants: unknown[] = []
    const gridWidth = encounter.gridWidth
    const gridHeight = encounter.gridHeight

    // Track occupied cells for auto-placement
    const occupiedCells = new Set<string>()

    const canFit = (x: number, y: number, size: number): boolean => {
      if (x + size > gridWidth || y + size > gridHeight) return false
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
        }
      }
      return true
    }

    const findPosition = (side: 'players' | 'allies' | 'enemies', tokenSize: number) => {
      const sidePositions = {
        players: { startX: 1, endX: 4 },
        allies: { startX: 5, endX: 8 },
        enemies: { startX: gridWidth - 5, endX: gridWidth - 1 }
      }
      const sideConfig = sidePositions[side]
      let position = { x: sideConfig.startX, y: 1 }
      let found = false

      for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
        for (let x = sideConfig.startX; x <= sideConfig.endX - tokenSize + 1 && !found; x++) {
          if (canFit(x, y, tokenSize)) {
            position = { x, y }
            found = true
          }
        }
      }

      // Fallback: try anywhere
      if (!found) {
        for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
          for (let x = 1; x < gridWidth - tokenSize + 1 && !found; x++) {
            if (canFit(x, y, tokenSize)) {
              position = { x, y }
              found = true
            }
          }
        }
      }

      // Mark occupied
      for (let dx = 0; dx < tokenSize; dx++) {
        for (let dy = 0; dy < tokenSize; dy++) {
          occupiedCells.add(`${position.x + dx},${position.y + dy}`)
        }
      }

      return position
    }

    // --- Process scene Pokemon (as wild enemies) ---
    const scenePokemon: ScenePokemonEntry[] = JSON.parse(scene.pokemon)

    for (const wild of scenePokemon) {
      // Look up species data
      let speciesData
      if (wild.speciesId) {
        speciesData = await prisma.speciesData.findUnique({ where: { id: wild.speciesId } })
      }
      if (!speciesData) {
        speciesData = await prisma.speciesData.findUnique({ where: { name: wild.species } })
      }

      let baseStats = { hp: 5, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
      let types: string[] = ['Normal']
      let abilities: string[] = []
      let learnset: Array<{ level: number; move: string }> = []
      let skills: Record<string, string> = {}
      let capabilities: string[] = []
      let movementCaps = { overland: 5, swim: 0, sky: 0, burrow: 0, levitate: 0 }

      if (speciesData) {
        baseStats = {
          hp: speciesData.baseHp, attack: speciesData.baseAttack,
          defense: speciesData.baseDefense, specialAttack: speciesData.baseSpAtk,
          specialDefense: speciesData.baseSpDef, speed: speciesData.baseSpeed
        }
        types = speciesData.type2 ? [speciesData.type1, speciesData.type2] : [speciesData.type1]
        abilities = JSON.parse(speciesData.abilities)
        learnset = JSON.parse(speciesData.learnset || '[]')
        skills = JSON.parse(speciesData.skills || '{}')
        capabilities = JSON.parse(speciesData.capabilities || '[]')
        movementCaps = {
          overland: speciesData.overland, swim: speciesData.swim,
          sky: speciesData.sky, burrow: speciesData.burrow, levitate: speciesData.levitate
        }
      }

      // Distribute stat points weighted by base stats
      const statPoints = Math.max(0, wild.level - 1)
      const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
      const totalBaseStats = statKeys.reduce((sum, key) => sum + baseStats[key], 0)
      const distributedPoints: Record<string, number> = {
        hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
      }

      let remainingPoints = statPoints
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

      const calculatedStats = {
        hp: baseStats.hp + distributedPoints.hp,
        attack: baseStats.attack + distributedPoints.attack,
        defense: baseStats.defense + distributedPoints.defense,
        specialAttack: baseStats.specialAttack + distributedPoints.specialAttack,
        specialDefense: baseStats.specialDefense + distributedPoints.specialDefense,
        speed: baseStats.speed + distributedPoints.speed
      }

      const maxHp = wild.level + (calculatedStats.hp * 3) + 10

      // Get moves the Pokemon would know at its level (up to 6 most recent)
      const knownMoves = learnset.filter(entry => entry.level <= wild.level).slice(-6)

      const moveDetails: Array<{
        name: string; type: string; damageClass: string; frequency: string
        ac: number | null; damageBase: number | null; range: string; effect: string
      }> = []

      for (const moveEntry of knownMoves) {
        const moveData = await prisma.moveData.findUnique({ where: { name: moveEntry.move } })
        if (moveData) {
          moveDetails.push({
            name: moveData.name, type: moveData.type, damageClass: moveData.damageClass,
            frequency: moveData.frequency, ac: moveData.ac, damageBase: moveData.damageBase,
            range: moveData.range, effect: moveData.effect
          })
        } else {
          moveDetails.push({
            name: moveEntry.move, type: 'Normal', damageClass: 'Status',
            frequency: 'At-Will', ac: null, damageBase: null, range: 'Melee', effect: ''
          })
        }
      }

      const selectedAbility = abilities.length > 0
        ? abilities[Math.floor(Math.random() * Math.min(2, abilities.length))]
        : null

      const genders = ['Male', 'Female']
      const gender = genders[Math.floor(Math.random() * 2)]

      // Create Pokemon DB record
      const pokemon = await prisma.pokemon.create({
        data: {
          species: wild.species,
          level: wild.level,
          experience: 0,
          nature: JSON.stringify({ name: 'Hardy', raisedStat: null, loweredStat: null }),
          type1: types[0],
          type2: types[1] || null,
          baseHp: baseStats.hp, baseAttack: baseStats.attack,
          baseDefense: baseStats.defense, baseSpAtk: baseStats.specialAttack,
          baseSpDef: baseStats.specialDefense, baseSpeed: baseStats.speed,
          currentHp: maxHp, maxHp: maxHp,
          currentAttack: calculatedStats.attack, currentDefense: calculatedStats.defense,
          currentSpAtk: calculatedStats.specialAttack, currentSpDef: calculatedStats.specialDefense,
          currentSpeed: calculatedStats.speed,
          stageModifiers: JSON.stringify({
            attack: 0, defense: 0, specialAttack: 0,
            specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
          }),
          abilities: JSON.stringify(selectedAbility ? [{ name: selectedAbility, effect: '' }] : []),
          moves: JSON.stringify(moveDetails),
          capabilities: JSON.stringify({ ...movementCaps, other: capabilities }),
          skills: JSON.stringify(skills),
          statusConditions: JSON.stringify([]),
          gender,
          isInLibrary: false,
          notes: `Wild Pokemon - created from scene "${scene.name}"`
        }
      })

      const tokenSize = 1
      const position = findPosition('enemies', tokenSize)

      combatants.push({
        id: uuidv4(),
        type: 'pokemon',
        entityId: pokemon.id,
        side: 'enemies',
        initiative: calculatedStats.speed,
        initiativeBonus: 0,
        hasActed: false,
        actionsRemaining: 2,
        shiftActionsRemaining: 1,
        turnState: {
          hasActed: false, standardActionUsed: false, shiftActionUsed: false,
          swiftActionUsed: false, canBeCommanded: true, isHolding: false
        },
        injuries: { count: 0, sources: [] as string[] },
        physicalEvasion: Math.floor(calculatedStats.defense / 5),
        specialEvasion: Math.floor(calculatedStats.specialDefense / 5),
        speedEvasion: Math.floor(calculatedStats.speed / 5),
        position,
        tokenSize,
        readyAction: undefined as string | undefined,
        entity: {
          id: pokemon.id,
          species: pokemon.species,
          nickname: undefined as string | undefined,
          level: pokemon.level,
          types,
          gender,
          currentStats: {
            hp: maxHp, attack: calculatedStats.attack, defense: calculatedStats.defense,
            specialAttack: calculatedStats.specialAttack, specialDefense: calculatedStats.specialDefense,
            speed: calculatedStats.speed
          },
          currentHp: maxHp, maxHp: maxHp,
          stageModifiers: {
            attack: 0, defense: 0, specialAttack: 0,
            specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
          },
          abilities: selectedAbility ? [{ name: selectedAbility, effect: '' }] : [],
          moves: moveDetails,
          capabilities: { ...movementCaps, other: capabilities },
          skills,
          statusConditions: [] as string[],
          spriteUrl: undefined as string | undefined,
          shiny: false
        }
      })
    }

    // --- Process scene characters (as player combatants) ---
    const sceneCharacters: SceneCharacterEntry[] = JSON.parse(scene.characters)

    for (const sceneChar of sceneCharacters) {
      if (!sceneChar.characterId) continue

      const character = await prisma.humanCharacter.findUnique({
        where: { id: sceneChar.characterId }
      })
      if (!character) continue

      const charEntity = {
        id: character.id,
        name: character.name,
        level: character.level,
        stats: {
          hp: character.hp, attack: character.attack, defense: character.defense,
          specialAttack: character.specialAttack, specialDefense: character.specialDefense,
          speed: character.speed
        },
        currentHp: character.currentHp,
        maxHp: character.maxHp,
        stageModifiers: JSON.parse(character.stageModifiers),
        statusConditions: JSON.parse(character.statusConditions),
        avatarUrl: character.avatarUrl
      }

      const initiative = character.speed
      const position = findPosition('players', 1)

      combatants.push({
        id: uuidv4(),
        type: 'human',
        entityId: character.id,
        side: 'players',
        initiative,
        initiativeBonus: 0,
        hasActed: false,
        actionsRemaining: 2,
        shiftActionsRemaining: 1,
        turnState: {
          hasActed: false, standardActionUsed: false, shiftActionUsed: false,
          swiftActionUsed: false, canBeCommanded: true, isHolding: false
        },
        injuries: { count: 0, sources: [] as string[] },
        physicalEvasion: Math.floor(character.defense / 5),
        specialEvasion: Math.floor(character.specialDefense / 5),
        speedEvasion: Math.floor(character.speed / 5),
        position,
        tokenSize: 1,
        readyAction: undefined as string | undefined,
        entity: charEntity
      })
    }

    // Save combatants to encounter
    await prisma.encounter.update({
      where: { id: encounter.id },
      data: { combatants: JSON.stringify(combatants) }
    })

    // Build response
    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      weather: encounter.weather ?? null,
      combatants,
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: JSON.parse(encounter.turnOrder),
      trainerTurnOrder: [],
      pokemonTurnOrder: [],
      currentPhase: 'pokemon',
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      gridConfig: {
        enabled: encounter.gridEnabled,
        width: encounter.gridWidth,
        height: encounter.gridHeight,
        cellSize: encounter.gridCellSize,
        background: encounter.gridBackground ?? undefined
      },
      sceneNumber: 1,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to create encounter from scene'
    throw createError({ statusCode: 500, message })
  }
})
