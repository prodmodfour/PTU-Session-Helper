import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'

interface WildPokemonInput {
  speciesId?: string
  speciesName: string
  level: number
}

export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!encounterId) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const wildPokemon: WildPokemonInput[] = body.pokemon || []
  const side = body.side || 'enemies'

  if (wildPokemon.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one Pokemon is required'
    })
  }

  try {
    // Find the encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse existing combatants
    const combatants = JSON.parse(encounter.combatants)
    const createdPokemon: any[] = []

    // Grid dimensions for auto-placement
    const gridWidth = encounter.gridWidth || 20
    const gridHeight = encounter.gridHeight || 15

    // Build a set of all occupied cells
    const occupiedCells = new Set<string>()
    for (const c of combatants) {
      if (!c.position) continue
      const size = c.tokenSize || 1
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          occupiedCells.add(`${c.position.x + dx},${c.position.y + dy}`)
        }
      }
    }

    // Check if a position can fit a token of given size
    const canFit = (x: number, y: number, size: number): boolean => {
      if (x + size > gridWidth || y + size > gridHeight) return false
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
        }
      }
      return true
    }

    // Side positions for auto-placement
    const sidePositions = {
      players: { startX: 1, endX: 4 },
      allies: { startX: 5, endX: 8 },
      enemies: { startX: gridWidth - 5, endX: gridWidth - 1 }
    }

    // Process each wild Pokemon
    for (const wild of wildPokemon) {
      // Look up species data
      let speciesData
      if (wild.speciesId) {
        speciesData = await prisma.speciesData.findUnique({
          where: { id: wild.speciesId }
        })
      }
      if (!speciesData) {
        speciesData = await prisma.speciesData.findUnique({
          where: { name: wild.speciesName }
        })
      }

      // Calculate stats based on level
      let baseStats = {
        hp: 50,
        attack: 50,
        defense: 50,
        specialAttack: 50,
        specialDefense: 50,
        speed: 50
      }
      let types: string[] = ['Normal']
      let abilities: string[] = []

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
        abilities = JSON.parse(speciesData.abilities)
      }

      // Calculate HP based on PTU formula: Base + (Level * 2)
      const maxHp = baseStats.hp + (wild.level * 2)

      // Create the wild Pokemon record (not in library)
      const pokemon = await prisma.pokemon.create({
        data: {
          species: wild.speciesName,
          level: wild.level,
          experience: 0,
          nature: JSON.stringify({ name: 'Hardy', raisedStat: null, loweredStat: null }),
          type1: types[0],
          type2: types[1] || null,
          baseHp: baseStats.hp,
          baseAttack: baseStats.attack,
          baseDefense: baseStats.defense,
          baseSpAtk: baseStats.specialAttack,
          baseSpDef: baseStats.specialDefense,
          baseSpeed: baseStats.speed,
          currentHp: maxHp,
          maxHp: maxHp,
          currentAttack: baseStats.attack,
          currentDefense: baseStats.defense,
          currentSpAtk: baseStats.specialAttack,
          currentSpDef: baseStats.specialDefense,
          currentSpeed: baseStats.speed,
          stageModifiers: JSON.stringify({
            attack: 0, defense: 0, specialAttack: 0,
            specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
          }),
          abilities: JSON.stringify(abilities.length > 0 ? [{ name: abilities[0], effect: '' }] : []),
          moves: JSON.stringify([]),
          statusConditions: JSON.stringify([]),
          gender: 'Genderless',
          isInLibrary: false, // Wild Pokemon not added to library
          notes: 'Wild Pokemon - generated from encounter table'
        }
      })

      // Calculate initiative
      const initiative = baseStats.speed
      const tokenSize = 1

      // Find position for this combatant
      const sideConfig = sidePositions[side as keyof typeof sidePositions] || sidePositions.enemies
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

      // If no position found in designated area, try anywhere
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

      // Mark this position as occupied for subsequent Pokemon
      for (let dx = 0; dx < tokenSize; dx++) {
        for (let dy = 0; dy < tokenSize; dy++) {
          occupiedCells.add(`${position.x + dx},${position.y + dy}`)
        }
      }

      // Create combatant entry
      const combatant = {
        id: uuidv4(),
        type: 'pokemon',
        entityId: pokemon.id,
        side,
        initiative,
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
        physicalEvasion: Math.floor(baseStats.defense / 5),
        specialEvasion: Math.floor(baseStats.specialDefense / 5),
        speedEvasion: Math.floor(baseStats.speed / 5),
        position,
        tokenSize,
        readyAction: null,
        entity: {
          id: pokemon.id,
          species: pokemon.species,
          nickname: null,
          level: pokemon.level,
          types,
          currentStats: {
            hp: maxHp,
            attack: baseStats.attack,
            defense: baseStats.defense,
            specialAttack: baseStats.specialAttack,
            specialDefense: baseStats.specialDefense,
            speed: baseStats.speed
          },
          currentHp: maxHp,
          maxHp: maxHp,
          stageModifiers: {
            attack: 0, defense: 0, specialAttack: 0,
            specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
          },
          abilities: abilities.length > 0 ? [{ name: abilities[0], effect: '' }] : [],
          moves: [],
          statusConditions: [],
          spriteUrl: null,
          shiny: false
        }
      }

      combatants.push(combatant)
      createdPokemon.push({
        pokemonId: pokemon.id,
        combatantId: combatant.id,
        species: pokemon.species,
        level: pokemon.level
      })
    }

    // Update encounter with new combatants
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { combatants: JSON.stringify(combatants) }
    })

    // Parse full encounter for response
    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
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
        backgroundImage: encounter.gridBackground
      },
      sceneNumber: 1,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return {
      success: true,
      data: {
        encounter: parsed,
        addedPokemon: createdPokemon
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to spawn wild Pokemon'
    })
  }
})
