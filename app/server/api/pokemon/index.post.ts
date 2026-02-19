import { prisma } from '~/server/utils/prisma'
import { serializePokemon } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const types = body.types || [body.type1 || 'Normal']
    const baseStats = body.baseStats || {}

    // Calculate current stats (simplified)
    const level = body.level || 1
    const baseHp = baseStats.hp || body.baseHp || 50
    // PTU HP formula: Level + (HP Base × 3) + 10
    const maxHp = body.maxHp || (level + (baseHp * 3) + 10)

    const pokemon = await prisma.pokemon.create({
      data: {
        species: body.species,
        nickname: await resolveNickname(body.species, body.nickname),
        level: level,
        experience: body.experience || 0,
        nature: JSON.stringify(body.nature || { name: 'Hardy', raisedStat: null, loweredStat: null }),
        type1: types[0],
        type2: types[1] || null,
        // Base stats
        baseHp: baseHp,
        baseAttack: baseStats.attack || body.baseAttack || 50,
        baseDefense: baseStats.defense || body.baseDefense || 50,
        baseSpAtk: baseStats.specialAttack || body.baseSpAtk || 50,
        baseSpDef: baseStats.specialDefense || body.baseSpDef || 50,
        baseSpeed: baseStats.speed || body.baseSpeed || 50,
        // Current stats
        currentHp: body.currentHp || maxHp,
        maxHp: maxHp,
        currentAttack: body.currentStats?.attack || baseStats.attack || body.baseAttack || 50,
        currentDefense: body.currentStats?.defense || baseStats.defense || body.baseDefense || 50,
        currentSpAtk: body.currentStats?.specialAttack || baseStats.specialAttack || body.baseSpAtk || 50,
        currentSpDef: body.currentStats?.specialDefense || baseStats.specialDefense || body.baseSpDef || 50,
        currentSpeed: body.currentStats?.speed || baseStats.speed || body.baseSpeed || 50,
        // Stage modifiers
        stageModifiers: JSON.stringify(body.stageModifiers || {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }),
        // Combat
        abilities: JSON.stringify(body.abilities || []),
        moves: JSON.stringify(body.moves || []),
        heldItem: body.heldItem,
        // Capabilities (movement, size, etc.)
        capabilities: JSON.stringify(body.capabilities || {}),
        // Skills
        skills: JSON.stringify(body.skills || {}),
        // Status
        statusConditions: JSON.stringify(body.statusConditions || []),
        // Training
        tutorPoints: body.tutorPoints || 0,
        trainingExp: body.trainingExp || 0,
        eggGroups: JSON.stringify(body.eggGroups || []),
        // Display
        ownerId: body.ownerId,
        spriteUrl: body.spriteUrl,
        shiny: body.shiny || false,
        gender: body.gender || 'Genderless',
        // Library & categorization
        isInLibrary: body.isInLibrary !== false,
        origin: body.origin || 'manual',
        location: body.location || null,
        notes: body.notes
      }
    })

    return { success: true, data: serializePokemon(pokemon) }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create pokemon'
    })
  }
})
