import { clearServedMap } from '~/server/utils/servedMap'

export default defineEventHandler(async () => {
  clearServedMap()

  return {
    success: true,
    message: 'Map cleared from group view'
  }
})
