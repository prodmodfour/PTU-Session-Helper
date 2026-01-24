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
        hp: 5,
        attack: 5,
        defense: 5,
        specialAttack: 5,
        specialDefense: 5,
        speed: 5
      }
      let types: string[] = ['Normal']
      let abilities: string[] = []
      let learnset: Array<{ level: number; move: string }> = []
      let skills: Record<string, string> = {}
      let capabilities: string[] = []
      let movementCaps = { overland: 5, swim: 0, sky: 0, burrow: 0, levitate: 0 }

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
        learnset = JSON.parse(speciesData.learnset || '[]')
        skills = JSON.parse(speciesData.skills || '{}')
        capabilities = JSON.parse(speciesData.capabilities || '[]')
        movementCaps = {
          overland: speciesData.overland,
          swim: speciesData.swim,
          sky: speciesData.sky,
          burrow: speciesData.burrow,
          levitate: speciesData.levitate
        }
      }

      // Calculate HP based on PTU formula: Level + (HP stat × 3) + 10
      const maxHp = wild.level + (baseStats.hp * 3) + 10

      // Get moves the Pokemon would know at its level (up to 6 most recent)
      const knownMoves = learnset
        .filter(entry => entry.level <= wild.level)
        .slice(-6) // Take the 6 most recent moves by level

      // Fetch full move data for each known move
      const moveDetails: Array<{
        name: string
        type: string
        damageClass: string
        frequency: string
        ac: number | null
        damageBase: number | null
        range: string
        effect: string
      }> = []

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
          // Move not found in database, create basic entry
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

      // Pick a random ability (or first if only one)
      const selectedAbility = abilities.length > 0
        ? abilities[Math.floor(Math.random() * Math.min(2, abilities.length))] // Only pick from basic abilities
        : null

      // Randomly select gender (50/50 for simplicity, could use species ratio)
      const genders = ['Male', 'Female', 'Genderless']
      const gender = genders[Math.floor(Math.random() * 2)] // Only Male or Female for wild

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
          abilities: JSON.stringify(selectedAbility ? [{ name: selectedAbility, effect: '' }] : []),
          moves: JSON.stringify(moveDetails),
          capabilities: JSON.stringify({
            ...movementCaps,
            other: capabilities
          }),
          skills: JSON.stringify(skills),
          statusConditions: JSON.stringify([]),
          gender,
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
          gender,
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
          abilities: selectedAbility ? [{ name: selectedAbility, effect: '' }] : [],
          moves: moveDetails,
          capabilities: {
            ...movementCaps,
            other: capabilities
          },
          skills,
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
