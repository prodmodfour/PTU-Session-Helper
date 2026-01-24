import { prisma } from '~/server/utils/prisma'
import type { DensityTier } from '~/types'
import { DENSITY_RANGES } from '~/types'

interface GeneratedPokemon {
  speciesId: string
  speciesName: string
  level: number
  weight: number
  source: 'parent' | 'modification'
}

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  const modificationId = body.modificationId as string | undefined
  const levelOverride = body.levelRange as { min: number; max: number } | undefined
  const countOverride = body.count as number | undefined // Optional manual override

  try {
    // Fetch table with entries and species data
    const table = await prisma.encounterTable.findUnique({
      where: { id: tableId },
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: {
          include: {
            entries: true
          }
        }
      }
    })

    if (!table) {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }

    // Build resolved entry pool
    const entryPool: Map<string, { speciesId: string; speciesName: string; weight: number; levelMin: number | null; levelMax: number | null; source: 'parent' | 'modification' }> = new Map()

    // Add parent entries
    for (const entry of table.entries) {
      entryPool.set(entry.species.name, {
        speciesId: entry.speciesId,
        speciesName: entry.species.name,
        weight: entry.weight,
        levelMin: entry.levelMin,
        levelMax: entry.levelMax,
        source: 'parent'
      })
    }

    // Apply modification if specified
    let densityMultiplier = 1.0
    if (modificationId) {
      const modification = table.modifications.find(m => m.id === modificationId)
      if (!modification) {
        throw createError({
          statusCode: 404,
          message: 'Modification not found'
        })
      }

      // Get density multiplier from modification
      densityMultiplier = modification.densityMultiplier

      for (const modEntry of modification.entries) {
        if (modEntry.remove) {
          // Remove from pool
          entryPool.delete(modEntry.speciesName)
        } else if (modEntry.weight !== null) {
          // Add or override
          const existing = entryPool.get(modEntry.speciesName)
          entryPool.set(modEntry.speciesName, {
            speciesId: existing?.speciesId ?? '',
            speciesName: modEntry.speciesName,
            weight: modEntry.weight,
            levelMin: modEntry.levelMin ?? existing?.levelMin ?? null,
            levelMax: modEntry.levelMax ?? existing?.levelMax ?? null,
            source: 'modification'
          })
        }
      }
    }

    // Calculate spawn count from density
    let count: number
    if (countOverride !== undefined) {
      // Manual override provided
      count = Math.min(Math.max(countOverride, 1), 10)
    } else {
      // Use density-based calculation
      const baseDensity = (table.density as DensityTier) || 'moderate'
      const densityRange = DENSITY_RANGES[baseDensity] || DENSITY_RANGES.moderate

      // Apply modification multiplier
      const scaledMin = Math.max(1, Math.round(densityRange.min * densityMultiplier))
      const scaledMax = Math.min(10, Math.round(densityRange.max * densityMultiplier))

      // Random count within scaled range
      count = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin
    }

    // Convert to array and calculate total weight
    const entries = Array.from(entryPool.values())
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)

    if (entries.length === 0 || totalWeight === 0) {
      throw createError({
        statusCode: 400,
        message: 'No entries in encounter pool'
      })
    }

    // Determine level range
    const levelMin = levelOverride?.min ?? table.levelMin
    const levelMax = levelOverride?.max ?? table.levelMax

    // Generate Pokemon using weighted random selection
    const generated: GeneratedPokemon[] = []

    for (let i = 0; i < count; i++) {
      // Weighted random selection
      let random = Math.random() * totalWeight
      let selected = entries[0]

      for (const entry of entries) {
        random -= entry.weight
        if (random <= 0) {
          selected = entry
          break
        }
      }

      // Calculate level within range (entry-specific or table default)
      const entryLevelMin = selected.levelMin ?? levelMin
      const entryLevelMax = selected.levelMax ?? levelMax
      const level = Math.floor(Math.random() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin

      generated.push({
        speciesId: selected.speciesId,
        speciesName: selected.speciesName,
        level,
        weight: selected.weight,
        source: selected.source
      })
    }

    return {
      success: true,
      data: {
        generated,
        meta: {
          tableId: table.id,
          tableName: table.name,
          modificationId: modificationId ?? null,
          levelRange: { min: levelMin, max: levelMax },
          density: table.density as DensityTier,
          densityMultiplier,
          spawnCount: count,
          totalPoolSize: entries.length,
          totalWeight
        }
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate encounter'
    })
  }
})
