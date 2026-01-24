import { getWildSpawnPreview } from '~/server/utils/wildSpawnState'

export default defineEventHandler(() => {
  const preview = getWildSpawnPreview()
  return { success: true, data: preview ? { ...preview } : null }
})
