/**
 * Create a new encounter from a scene.
 * Scene Pokemon become wild enemy combatants with full DB sheets.
 * Scene characters become player combatants referencing existing DB records.
 */

import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { generateAndCreatePokemon, buildPokemonCombatant } from '~/server/services/pokemon-generator.service'

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
      const created = await generateAndCreatePokemon({
        speciesName: wild.species,
        level: wild.level,
        nickname: wild.nickname,
        origin: 'wild',
        originLabel: `Wild Pokemon - created from scene "${scene.name}"`
      })

      const tokenSize = 1
      const position = findPosition('enemies', tokenSize)
      const combatant = buildPokemonCombatant(created, 'enemies', position, tokenSize)
      combatants.push(combatant)
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
