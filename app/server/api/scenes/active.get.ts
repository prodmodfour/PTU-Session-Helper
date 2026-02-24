import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const scene = await prisma.scene.findFirst({
      where: { isActive: true }
    })

    if (!scene) {
      return {
        success: true,
        data: null
      }
    }

    const characters = JSON.parse(scene.characters) as Array<{
      id: string; characterId: string; name: string; groupId?: string | null
    }>
    const pokemon = JSON.parse(scene.pokemon) as Array<{
      id: string; species: string; nickname?: string | null; groupId?: string | null
    }>
    const groups = JSON.parse(scene.groups) as Array<{
      id: string; name: string
    }>

    // Enrich characters with isPlayerCharacter from DB
    const characterIds = characters.map(c => c.characterId)
    const dbCharacters = characterIds.length > 0
      ? await prisma.humanCharacter.findMany({
          where: { id: { in: characterIds } },
          select: { id: true, isPlayerCharacter: true }
        })
      : []
    const pcSet = new Set(dbCharacters.filter(c => c.isPlayerCharacter).map(c => c.id))

    // Enrich pokemon with ownerId from DB
    const pokemonIds = pokemon.map(p => p.id)
    const dbPokemon = pokemonIds.length > 0
      ? await prisma.pokemon.findMany({
          where: { id: { in: pokemonIds } },
          select: { id: true, ownerId: true }
        })
      : []
    const ownerMap = new Map(dbPokemon.map(p => [p.id, p.ownerId]))

    return {
      success: true,
      data: {
        id: scene.id,
        name: scene.name,
        description: scene.description,
        locationName: scene.locationName,
        locationImage: scene.locationImage,
        characters: characters.map(c => ({
          ...c,
          isPlayerCharacter: pcSet.has(c.characterId)
        })),
        pokemon: pokemon.map(p => ({
          ...p,
          ownerId: ownerMap.get(p.id) ?? null
        })),
        groups,
        weather: scene.weather,
        terrains: JSON.parse(scene.terrains),
        modifiers: JSON.parse(scene.modifiers),
        habitatId: scene.habitatId,
        isActive: scene.isActive,
        createdAt: scene.createdAt,
        updatedAt: scene.updatedAt
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch active scene'
    console.error('Error fetching active scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
