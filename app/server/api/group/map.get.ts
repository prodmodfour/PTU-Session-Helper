import { getServedMap } from '~/server/utils/servedMap'

export default defineEventHandler(async () => {
  const map = getServedMap()
  return {
    success: true,
    data: map ? { ...map } : null
  }
})
