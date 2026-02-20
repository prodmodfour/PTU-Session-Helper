import { prisma } from '~/server/utils/prisma'
import { broadcastToGroup } from '~/server/utils/websocket'
import { calculateSceneEndAp } from '~/utils/restHealing'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID is required'
      })
    }

    // Restore AP for characters in any currently active scenes before deactivating
    // Per PTU Core (p221): AP is completely regained at scene end (minus drained AP)
    const activeScenes = await prisma.scene.findMany({
      where: { isActive: true }
    })

    for (const activeScene of activeScenes) {
      const characters: Array<{ characterId?: string; id?: string }> = JSON.parse(activeScene.characters || '[]')
      const characterIds = characters
        .map(c => c.characterId || c.id)
        .filter((cid): cid is string => !!cid)

      if (characterIds.length > 0) {
        const dbCharacters = await prisma.humanCharacter.findMany({
          where: { id: { in: characterIds } },
          select: { id: true, level: true, drainedAp: true }
        })

        // Group by (level, drainedAp) so each group gets the same restoredAp
        // This reduces N individual updates to G updateMany calls (G <= N)
        const groupKey = (level: number, drainedAp: number) => `${level}:${drainedAp}`
        const groups = new Map<string, { ids: string[]; restoredAp: number }>()

        for (const char of dbCharacters) {
          const key = groupKey(char.level, char.drainedAp)
          const existing = groups.get(key)
          if (existing) {
            groups.set(key, { ...existing, ids: [...existing.ids, char.id] })
          } else {
            const restoredAp = calculateSceneEndAp(char.level, char.drainedAp)
            groups.set(key, { ids: [char.id], restoredAp })
          }
        }

        // Scene end: unbind all bound AP and restore to max minus drained
        await prisma.$transaction(
          [...groups.values()].map(({ ids, restoredAp }) =>
            prisma.humanCharacter.updateMany({
              where: { id: { in: ids } },
              data: {
                boundAp: 0,
                currentAp: restoredAp
              }
            })
          )
        )
      }
    }

    // Deactivate all other scenes
    await prisma.scene.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Activate this scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: true }
    })

    // Update GroupViewState to point to this scene
    await prisma.groupViewState.upsert({
      where: { id: 'singleton' },
      update: { activeSceneId: scene.id },
      create: { id: 'singleton', activeSceneId: scene.id }
    })

    const parsed = {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      locationName: scene.locationName,
      locationImage: scene.locationImage,
      pokemon: JSON.parse(scene.pokemon),
      characters: JSON.parse(scene.characters),
      groups: JSON.parse(scene.groups),
      weather: scene.weather,
      terrains: JSON.parse(scene.terrains),
      modifiers: JSON.parse(scene.modifiers),
      habitatId: scene.habitatId,
      isActive: scene.isActive,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt
    }

    // Broadcast scene activation to group clients
    broadcastToGroup('scene_activated', { scene: parsed })

    return {
      success: true,
      data: parsed
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to activate scene'
    console.error('Error activating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
