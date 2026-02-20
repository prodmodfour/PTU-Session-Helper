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

    // Read scene before deactivating to get character list
    const sceneData = await prisma.scene.findUnique({ where: { id } })
    if (!sceneData) {
      throw createError({
        statusCode: 404,
        message: 'Scene not found'
      })
    }

    // Deactivate the scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: false }
    })

    // Restore AP for all characters in the scene (PTU Core p221:
    // "Action Points are completely regained at the end of each Scene.
    //  Drained AP remains unavailable until Extended Rest.
    //  Bound AP is released at scene end (Stratagems auto-unbind).")
    const characters: Array<{ characterId?: string; id?: string }> = JSON.parse(sceneData.characters || '[]')
    const characterIds = characters
      .map(c => c.characterId || c.id)
      .filter((id): id is string => !!id)

    let apRestoredCount = 0
    if (characterIds.length > 0) {
      const dbCharacters = await prisma.humanCharacter.findMany({
        where: { id: { in: characterIds } },
        select: { id: true, level: true, drainedAp: true }
      })

      for (const char of dbCharacters) {
        // Scene end: unbind all bound AP and restore to max minus drained
        const restoredAp = calculateSceneEndAp(char.level, char.drainedAp)
        await prisma.humanCharacter.update({
          where: { id: char.id },
          data: {
            boundAp: 0, // All binding effects end at scene close
            currentAp: restoredAp
          }
        })
        apRestoredCount++
      }
    }

    // Clear GroupViewState if it was pointing to this scene
    await prisma.groupViewState.updateMany({
      where: { activeSceneId: id },
      data: { activeSceneId: null }
    })

    // Broadcast scene deactivation to group clients
    broadcastToGroup('scene_deactivated', { sceneId: scene.id })

    return {
      success: true,
      message: `Scene deactivated successfully. AP restored for ${apRestoredCount} character(s).`
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to deactivate scene'
    console.error('Error deactivating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
