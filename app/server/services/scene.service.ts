import { prisma } from '~/server/utils/prisma'
import { calculateSceneEndAp } from '~/utils/restHealing'

/**
 * Restore AP for all characters in a scene at scene end.
 *
 * Per PTU Core (p221):
 * - Action Points are completely regained at the end of each Scene.
 * - Drained AP remains unavailable until Extended Rest.
 * - Bound AP is released at scene end (Stratagems auto-unbind).
 *
 * Groups characters by (level, drainedAp) to batch identical updates
 * into fewer updateMany calls within a single transaction.
 *
 * @param charactersJson - The raw JSON string from scene.characters
 * @returns The number of characters whose AP was restored
 */
export async function restoreSceneAp(charactersJson: string): Promise<number> {
  const characters: Array<{ characterId?: string; id?: string }> = JSON.parse(charactersJson || '[]')
  const characterIds = characters
    .map(c => c.characterId || c.id)
    .filter((cid): cid is string => !!cid)

  if (characterIds.length === 0) {
    return 0
  }

  const dbCharacters = await prisma.humanCharacter.findMany({
    where: { id: { in: characterIds } },
    select: { id: true, level: true, drainedAp: true }
  })

  if (dbCharacters.length === 0) {
    return 0
  }

  // Group by (level, drainedAp) so each group gets the same restoredAp value.
  // This reduces N individual updates to G updateMany calls (G <= N).
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

  return dbCharacters.length
}
