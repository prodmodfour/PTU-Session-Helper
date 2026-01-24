import { prisma } from '~/server/utils/prisma'

// Fetch all player characters with their full Pokemon team data
export default defineEventHandler(async () => {
  try {
    const players = await prisma.humanCharacter.findMany({
      where: {
        isInLibrary: true,
        characterType: 'player'
      },
      orderBy: { name: 'asc' },
      include: { pokemon: true }
    })

    // Parse and format the data
    const parsed = players.map(char => {
      // Parse linked Pokemon with full details
      const parsedPokemon = char.pokemon.map(p => ({
        id: p.id,
        species: p.species,
        nickname: p.nickname,
        level: p.level,
        types: p.type2 ? [p.type1, p.type2] : [p.type1],
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        shiny: p.shiny,
        spriteUrl: p.spriteUrl
      }))

      return {
        id: char.id,
        name: char.name,
        playedBy: char.playedBy,
        level: char.level,
        currentHp: char.currentHp,
        maxHp: char.hp, // Use hp stat as max HP (PTU convention)
        avatarUrl: char.avatarUrl,
        trainerClasses: JSON.parse(char.trainerClasses),
        pokemon: parsedPokemon
      }
    })

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch players'
    })
  }
})
