import { prisma } from '~/server/utils/prisma'

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
      capabilities: JSON.parse(pokemon.capabilities),
      skills: JSON.parse(pokemon.skills),
      statusConditions: JSON.parse(pokemon.statusConditions),
      tutorPoints: pokemon.tutorPoints,
      trainingExp: pokemon.trainingExp,
      eggGroups: JSON.parse(pokemon.eggGroups),
      ownerId: pokemon.ownerId,
      spriteUrl: pokemon.spriteUrl,
      shiny: pokemon.shiny,
      gender: pokemon.gender,
      isInLibrary: pokemon.isInLibrary,
      origin: pokemon.origin,
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
