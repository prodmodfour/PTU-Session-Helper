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
        tokenSize: 1,
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
