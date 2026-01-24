import { clearWildSpawnPreview } from '~/server/utils/wildSpawnState'

export default defineEventHandler(() => {
  clearWildSpawnPreview()
  return { success: true }
})
