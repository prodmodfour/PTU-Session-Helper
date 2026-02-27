import { describe, it, expect } from 'vitest'
import { refreshDailyMoves } from '~/server/services/rest-healing.service'
import type { Move } from '~/types/character'

/**
 * Helper to create a minimal Move object for testing.
 * Only sets fields relevant to daily move refresh.
 */
function makeMove(overrides: Partial<Move> & { name: string; frequency: string }): Move {
  return {
    id: overrides.name.toLowerCase().replace(/\s/g, '-'),
    type: 'Normal',
    damageClass: 'Physical',
    ac: 2,
    damageBase: 5,
    range: 'Melee',
    effect: '',
    ...overrides
  } as Move
}

/** ISO string for yesterday. */
function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString()
}

/** ISO string for today. */
function today(): string {
  return new Date().toISOString()
}

describe('refreshDailyMoves', () => {
  it('refreshes a Daily move that was used yesterday', () => {
    const moves = [
      makeMove({
        name: 'Hyper Beam',
        frequency: 'Daily',
        usedToday: 1,
        lastUsedAt: yesterday()
      })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual(['Hyper Beam'])
    expect(result.skippedMoves).toEqual([])
    expect(result.updatedMoves[0].usedToday).toBe(0)
    expect(result.updatedMoves[0].lastUsedAt).toBeUndefined()
    expect(result.updatedMoves[0].usedThisScene).toBe(0)
  })

  it('does NOT refresh a Daily move that was used today (rolling window)', () => {
    const moves = [
      makeMove({
        name: 'Giga Impact',
        frequency: 'Daily',
        usedToday: 1,
        lastUsedAt: today()
      })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual([])
    expect(result.skippedMoves).toEqual(['Giga Impact'])
    // Move should be unchanged
    expect(result.updatedMoves[0].usedToday).toBe(1)
    expect(result.updatedMoves[0].lastUsedAt).toBeDefined()
  })

  it('refreshes Daily x2 and Daily x3 moves with the rolling window', () => {
    const moves = [
      makeMove({
        name: 'Outrage',
        frequency: 'Daily x2',
        usedToday: 2,
        lastUsedAt: yesterday()
      }),
      makeMove({
        name: 'Draco Meteor',
        frequency: 'Daily x3',
        usedToday: 1,
        lastUsedAt: today()
      })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual(['Outrage'])
    expect(result.skippedMoves).toEqual(['Draco Meteor'])
    expect(result.updatedMoves[0].usedToday).toBe(0)
    expect(result.updatedMoves[1].usedToday).toBe(1)
  })

  it('does not touch At-Will, EOT, or Scene moves', () => {
    const moves = [
      makeMove({ name: 'Tackle', frequency: 'At-Will', usedToday: 0 }),
      makeMove({ name: 'Flamethrower', frequency: 'EOT', usedToday: 0 }),
      makeMove({ name: 'Ice Beam', frequency: 'Scene', usedThisScene: 1, usedToday: 0 })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual([])
    expect(result.skippedMoves).toEqual([])
    // All moves should be returned unchanged
    expect(result.updatedMoves).toEqual(moves)
  })

  it('handles a Daily move with no usage (usedToday 0)', () => {
    const moves = [
      makeMove({ name: 'Explosion', frequency: 'Daily', usedToday: 0 })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual([])
    expect(result.skippedMoves).toEqual([])
    // Move is already fresh, no change
    expect(result.updatedMoves[0].usedToday).toBe(0)
  })

  it('handles empty moves array', () => {
    const result = refreshDailyMoves([])

    expect(result.restoredMoves).toEqual([])
    expect(result.skippedMoves).toEqual([])
    expect(result.updatedMoves).toEqual([])
  })

  it('handles a Daily move with no lastUsedAt (eligible by default)', () => {
    const moves = [
      makeMove({
        name: 'V-Create',
        frequency: 'Daily',
        usedToday: 1
        // lastUsedAt omitted → isDailyMoveRefreshable returns true
      })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual(['V-Create'])
    expect(result.skippedMoves).toEqual([])
    expect(result.updatedMoves[0].usedToday).toBe(0)
  })

  it('does not mutate the input array', () => {
    const original = makeMove({
      name: 'Blast Burn',
      frequency: 'Daily',
      usedToday: 1,
      lastUsedAt: yesterday()
    })
    const moves = [original]

    refreshDailyMoves(moves)

    // Original object should be untouched
    expect(original.usedToday).toBe(1)
    expect(original.lastUsedAt).toBeDefined()
  })

  it('handles mixed set: some refreshable, some not, some non-daily', () => {
    const moves = [
      makeMove({ name: 'Tackle', frequency: 'At-Will' }),
      makeMove({
        name: 'Hyper Beam',
        frequency: 'Daily',
        usedToday: 1,
        lastUsedAt: yesterday()
      }),
      makeMove({
        name: 'Giga Impact',
        frequency: 'Daily',
        usedToday: 1,
        lastUsedAt: today()
      }),
      makeMove({ name: 'Ice Beam', frequency: 'Scene', usedThisScene: 1 })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.restoredMoves).toEqual(['Hyper Beam'])
    expect(result.skippedMoves).toEqual(['Giga Impact'])
    // Verify specific moves
    expect(result.updatedMoves[0]).toEqual(moves[0]) // Tackle unchanged
    expect(result.updatedMoves[1].usedToday).toBe(0) // Hyper Beam refreshed
    expect(result.updatedMoves[2].usedToday).toBe(1) // Giga Impact skipped
    expect(result.updatedMoves[3]).toEqual(moves[3]) // Ice Beam unchanged
  })

  it('resets usedThisScene to 0 for refreshed daily moves', () => {
    const moves = [
      makeMove({
        name: 'Hyper Beam',
        frequency: 'Daily',
        usedToday: 1,
        usedThisScene: 1,
        lastUsedAt: yesterday()
      })
    ]

    const result = refreshDailyMoves(moves)

    expect(result.updatedMoves[0].usedThisScene).toBe(0)
  })
})
