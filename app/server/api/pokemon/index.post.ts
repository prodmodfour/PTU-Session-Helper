import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const types = body.types || [body.type1 || 'Normal']
    const baseStats = body.baseStats || {}

    // Calculate current stats (simplified)
    const level = body.level || 1
    const baseHp = baseStats.hp || body.baseHp || 50
    const maxHp = baseHp + level * 2

    const pokemon = await prisma.pokemon.create({
      data: {
        species: body.species,
        nickname: body.nickname,
        level: level,
        experience: body.experience || 0,
        nature: JSON.stringify(body.nature || { name: 'Hardy', raisedStat: null, loweredStat: null }),
        type1: types[0],
        type2: types[1] || null,
        baseHp: baseHp,
        baseAttack: baseStats.attack || body.baseAttack || 50,
        baseDefense: baseStats.defense || body.baseDefense || 50,
        baseSpAtk: baseStats.specialAttack || body.baseSpAtk || 50,
        baseSpDef: baseStats.specialDefense || body.baseSpDef || 50,
        baseSpeed: baseStats.speed || body.baseSpeed || 50,
        currentHp: body.currentHp || maxHp,
        maxHp: maxHp,
        currentAttack: baseStats.attack || body.baseAttack || 50,
        currentDefense: baseStats.defense || body.baseDefense || 50,
        currentSpAtk: baseStats.specialAttack || body.baseSpAtk || 50,
        currentSpDef: baseStats.specialDefense || body.baseSpDef || 50,
        currentSpeed: baseStats.speed || body.baseSpeed || 50,
        stageModifiers: JSON.stringify(body.stageModifiers || {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }),
        abilities: JSON.stringify(body.abilities || []),
        moves: JSON.stringify(body.moves || []),
        heldItem: body.heldItem,
        statusConditions: JSON.stringify(body.statusConditions || []),
        ownerId: body.ownerId,
        spriteUrl: body.spriteUrl,
        shiny: body.shiny || false,
        gender: body.gender || 'Genderless',
        isInLibrary: body.isInLibrary !== false,
        notes: body.notes
      }
    })

    const parsed = {
      id: pokemon.id,
      species: pokemon.species,
      nickname: pokemon.nickname,
      level: pokemon.level,
      experience: pokemon.experience,
      nature: JSON.parse(pokemon.nature),
      types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1],
      baseStats: {
        hp: pokemon.baseHp,
        attack: pokemon.baseAttack,
        defense: pokemon.baseDefense,
        specialAttack: pokemon.baseSpAtk,
        specialDefense: pokemon.baseSpDef,
        speed: pokemon.baseSpeed
      },
      currentStats: {
        hp: pokemon.currentHp,
        attack: pokemon.currentAttack,
        defense: pokemon.currentDefense,
        specialAttack: pokemon.currentSpAtk,
        specialDefense: pokemon.currentSpDef,
        speed: pokemon.currentSpeed
      },
      currentHp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      stageModifiers: JSON.parse(pokemon.stageModifiers),
      abilities: JSON.parse(pokemon.abilities),
      moves: JSON.parse(pokemon.moves),
      heldItem: pokemon.heldItem,
      statusConditions: JSON.parse(pokemon.statusConditions),
      ownerId: pokemon.ownerId,
      spriteUrl: pokemon.spriteUrl,
      shiny: pokemon.shiny,
      gender: pokemon.gender,
      isInLibrary: pokemon.isInLibrary,
      notes: pokemon.notes
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create pokemon'
    })
  }
})
