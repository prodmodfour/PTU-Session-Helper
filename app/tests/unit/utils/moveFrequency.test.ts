import { describe, it, expect } from 'vitest'
import {
  getSceneLimit,
  getDailyLimit,
  isEotFrequency,
  isSceneFrequency,
  isDailyFrequency,
  checkMoveFrequency,
  incrementMoveUsage,
  resetSceneUsage
} from '~/utils/moveFrequency'
import type { Move } from '~/types/character'
import type { MoveFrequency } from '~/types/combat'

function makeMove(overrides: Partial<Move> = {}): Move {
  return {
    id: 'move-1',
    name: 'Test Move',
    type: 'Normal',
    damageClass: 'Physical',
    frequency: 'At-Will',
    ac: 2,
    damageBase: 5,
    range: 'Melee',
    effect: 'Test effect',
    ...overrides
  }
}

// ============================================
// FREQUENCY PARSING
// ============================================

describe('getSceneLimit', () => {
  it('returns 1 for Scene', () => {
    expect(getSceneLimit('Scene')).toBe(1)
  })

  it('returns 2 for Scene x2', () => {
    expect(getSceneLimit('Scene x2')).toBe(2)
  })

  it('returns 3 for Scene x3', () => {
    expect(getSceneLimit('Scene x3')).toBe(3)
  })

  it('returns null for non-scene frequencies', () => {
    expect(getSceneLimit('At-Will')).toBeNull()
    expect(getSceneLimit('EOT')).toBeNull()
    expect(getSceneLimit('Daily')).toBeNull()
    expect(getSceneLimit('Static')).toBeNull()
  })
})

describe('getDailyLimit', () => {
  it('returns 1 for Daily', () => {
    expect(getDailyLimit('Daily')).toBe(1)
  })

  it('returns 2 for Daily x2', () => {
    expect(getDailyLimit('Daily x2')).toBe(2)
  })

  it('returns 3 for Daily x3', () => {
    expect(getDailyLimit('Daily x3')).toBe(3)
  })

  it('returns null for non-daily frequencies', () => {
    expect(getDailyLimit('At-Will')).toBeNull()
    expect(getDailyLimit('Scene')).toBeNull()
    expect(getDailyLimit('EOT')).toBeNull()
  })
})

describe('frequency type checkers', () => {
  it('isEotFrequency identifies EOT', () => {
    expect(isEotFrequency('EOT')).toBe(true)
    expect(isEotFrequency('At-Will')).toBe(false)
    expect(isEotFrequency('Scene')).toBe(false)
  })

  it('isSceneFrequency identifies scene frequencies', () => {
    expect(isSceneFrequency('Scene')).toBe(true)
    expect(isSceneFrequency('Scene x2')).toBe(true)
    expect(isSceneFrequency('Scene x3')).toBe(true)
    expect(isSceneFrequency('At-Will')).toBe(false)
    expect(isSceneFrequency('Daily')).toBe(false)
  })

  it('isDailyFrequency identifies daily frequencies', () => {
    expect(isDailyFrequency('Daily')).toBe(true)
    expect(isDailyFrequency('Daily x2')).toBe(true)
    expect(isDailyFrequency('Daily x3')).toBe(true)
    expect(isDailyFrequency('At-Will')).toBe(false)
    expect(isDailyFrequency('Scene')).toBe(false)
  })
})

// ============================================
// FREQUENCY VALIDATION
// ============================================

describe('checkMoveFrequency', () => {
  describe('At-Will moves', () => {
    it('always allows At-Will moves', () => {
      const move = makeMove({ frequency: 'At-Will' })
      expect(checkMoveFrequency(move, 1)).toEqual({ canUse: true })
    })
  })

  describe('Static moves', () => {
    it('never allows Static moves', () => {
      const move = makeMove({ frequency: 'Static' })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('Static')
    })
  })

  describe('EOT moves', () => {
    it('allows EOT move when never used', () => {
      const move = makeMove({ frequency: 'EOT' })
      expect(checkMoveFrequency(move, 1).canUse).toBe(true)
    })

    it('blocks EOT move on consecutive turn', () => {
      const move = makeMove({ frequency: 'EOT', lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 4)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('round 3')
    })

    it('allows EOT move after skipping a turn', () => {
      const move = makeMove({ frequency: 'EOT', lastTurnUsed: 3 })
      expect(checkMoveFrequency(move, 5).canUse).toBe(true)
    })

    it('blocks EOT move on same turn', () => {
      const move = makeMove({ frequency: 'EOT', lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 3)
      expect(result.canUse).toBe(false)
    })
  })

  describe('Scene-frequency moves', () => {
    it('allows Scene move with 0 uses', () => {
      const move = makeMove({ frequency: 'Scene', usedThisScene: 0 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(1)
    })

    it('blocks Scene move after 1 use', () => {
      const move = makeMove({ frequency: 'Scene', usedThisScene: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
      expect(result.remainingSceneUses).toBe(0)
    })

    it('allows Scene x2 move with 1 use', () => {
      const move = makeMove({ frequency: 'Scene x2', usedThisScene: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(1)
    })

    it('blocks Scene x2 move after 2 uses', () => {
      const move = makeMove({ frequency: 'Scene x2', usedThisScene: 2 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
    })

    it('allows Scene x3 move with 2 uses', () => {
      const move = makeMove({ frequency: 'Scene x3', usedThisScene: 2 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(1)
    })

    it('handles undefined usedThisScene as 0', () => {
      const move = makeMove({ frequency: 'Scene' })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(1)
    })

    // PTU p.337: Scene x2/x3 enforce EOT between uses
    it('blocks Scene x2 move on consecutive turn (EOT restriction)', () => {
      const move = makeMove({ frequency: 'Scene x2', usedThisScene: 1, lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 4)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('EOT restriction')
      expect(result.reason).toContain('round 3')
      expect(result.remainingSceneUses).toBe(1)
    })

    it('allows Scene x2 move after skipping a turn', () => {
      const move = makeMove({ frequency: 'Scene x2', usedThisScene: 1, lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 5)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(1)
    })

    it('blocks Scene x3 move on same turn it was used', () => {
      const move = makeMove({ frequency: 'Scene x3', usedThisScene: 1, lastTurnUsed: 5 })
      const result = checkMoveFrequency(move, 5)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('EOT restriction')
    })

    it('allows Scene x3 move two rounds after last use', () => {
      const move = makeMove({ frequency: 'Scene x3', usedThisScene: 1, lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 5)
      expect(result.canUse).toBe(true)
      expect(result.remainingSceneUses).toBe(2)
    })

    it('does not apply EOT restriction to Scene x1 (only 1 use, implicitly safe)', () => {
      // Scene x1 can only be used once, so EOT doesn't matter — no consecutive usage possible
      const move = makeMove({ frequency: 'Scene', usedThisScene: 0, lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 4)
      expect(result.canUse).toBe(true)
    })

    it('prioritizes exhaustion over EOT for Scene x2', () => {
      // All uses spent AND on consecutive turn — exhaustion reason should take priority
      const move = makeMove({ frequency: 'Scene x2', usedThisScene: 2, lastTurnUsed: 3 })
      const result = checkMoveFrequency(move, 4)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('2/2 times this scene')
    })
  })

  describe('Daily-frequency moves', () => {
    it('allows Daily move with 0 uses', () => {
      const move = makeMove({ frequency: 'Daily', usedToday: 0 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingDailyUses).toBe(1)
    })

    it('blocks Daily move after 1 use', () => {
      const move = makeMove({ frequency: 'Daily', usedToday: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
    })

    it('allows Daily x2 move with 1 use', () => {
      const move = makeMove({ frequency: 'Daily x2', usedToday: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingDailyUses).toBe(1)
    })

    it('blocks Daily x3 move after 3 uses', () => {
      const move = makeMove({ frequency: 'Daily x3', usedToday: 3 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
    })

    // PTU p.337: Daily x2/x3 can only be used once per scene
    it('blocks Daily x2 move already used this scene', () => {
      const move = makeMove({ frequency: 'Daily x2', usedToday: 1, usedThisScene: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('1 use per scene limit')
      expect(result.remainingDailyUses).toBe(1)
    })

    it('allows Daily x2 move in a new scene after previous scene usage', () => {
      // usedToday: 1 (from previous scene), usedThisScene: 0 (reset by next-scene)
      const move = makeMove({ frequency: 'Daily x2', usedToday: 1, usedThisScene: 0 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingDailyUses).toBe(1)
    })

    it('blocks Daily x3 move already used this scene', () => {
      const move = makeMove({ frequency: 'Daily x3', usedToday: 1, usedThisScene: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('1 use per scene limit')
    })

    it('allows Daily x3 with 2 daily uses but 0 scene uses (new scene)', () => {
      const move = makeMove({ frequency: 'Daily x3', usedToday: 2, usedThisScene: 0 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
      expect(result.remainingDailyUses).toBe(1)
    })

    it('does not apply per-scene cap to Daily x1 (only 1 daily use, implicitly safe)', () => {
      // Daily x1 is capped at 1 total use per day — per-scene restriction is redundant
      const move = makeMove({ frequency: 'Daily', usedToday: 0, usedThisScene: 0 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(true)
    })

    it('prioritizes daily exhaustion over per-scene cap for Daily x2', () => {
      // Both daily uses spent AND used this scene — daily exhaustion should take priority
      const move = makeMove({ frequency: 'Daily x2', usedToday: 2, usedThisScene: 1 })
      const result = checkMoveFrequency(move, 1)
      expect(result.canUse).toBe(false)
      expect(result.reason).toContain('2/2 times today')
    })
  })
})

// ============================================
// USAGE TRACKING
// ============================================

describe('incrementMoveUsage', () => {
  it('does not modify At-Will moves', () => {
    const move = makeMove({ frequency: 'At-Will' })
    const result = incrementMoveUsage(move, 3)
    expect(result).toBe(move) // Same reference — no change needed
  })

  it('sets lastTurnUsed for EOT moves', () => {
    const move = makeMove({ frequency: 'EOT' })
    const result = incrementMoveUsage(move, 5)
    expect(result.lastTurnUsed).toBe(5)
    expect(result).not.toBe(move) // New object
  })

  it('increments usedThisScene for Scene moves', () => {
    const move = makeMove({ frequency: 'Scene', usedThisScene: 0 })
    const result = incrementMoveUsage(move, 1)
    expect(result.usedThisScene).toBe(1)
  })

  it('increments usedThisScene for Scene x2 from 1 to 2', () => {
    const move = makeMove({ frequency: 'Scene x2', usedThisScene: 1 })
    const result = incrementMoveUsage(move, 1)
    expect(result.usedThisScene).toBe(2)
  })

  it('sets lastTurnUsed for Scene x2 moves (EOT tracking)', () => {
    const move = makeMove({ frequency: 'Scene x2', usedThisScene: 0 })
    const result = incrementMoveUsage(move, 4)
    expect(result.lastTurnUsed).toBe(4)
    expect(result.usedThisScene).toBe(1)
  })

  it('sets lastTurnUsed for Scene x3 moves (EOT tracking)', () => {
    const move = makeMove({ frequency: 'Scene x3', usedThisScene: 1 })
    const result = incrementMoveUsage(move, 7)
    expect(result.lastTurnUsed).toBe(7)
    expect(result.usedThisScene).toBe(2)
  })

  it('does not set lastTurnUsed for Scene x1 moves', () => {
    const move = makeMove({ frequency: 'Scene', usedThisScene: 0 })
    const result = incrementMoveUsage(move, 3)
    expect(result.lastTurnUsed).toBeUndefined()
    expect(result.usedThisScene).toBe(1)
  })

  it('handles undefined usedThisScene as 0', () => {
    const move = makeMove({ frequency: 'Scene x3' })
    const result = incrementMoveUsage(move, 1)
    expect(result.usedThisScene).toBe(1)
  })

  it('increments usedToday and usedThisScene for Daily moves', () => {
    const move = makeMove({ frequency: 'Daily x2', usedToday: 0, usedThisScene: 0 })
    const result = incrementMoveUsage(move, 1)
    expect(result.usedToday).toBe(1)
    expect(result.usedThisScene).toBe(1)
    expect(result.lastUsedAt).toBeDefined()
  })

  it('does not mutate original move', () => {
    const move = makeMove({ frequency: 'Scene', usedThisScene: 0 })
    const result = incrementMoveUsage(move, 1)
    expect(move.usedThisScene).toBe(0) // Original unchanged
    expect(result.usedThisScene).toBe(1)
  })
})

describe('resetSceneUsage', () => {
  it('resets usedThisScene to 0 for all moves', () => {
    const moves = [
      makeMove({ frequency: 'Scene', usedThisScene: 1 }),
      makeMove({ frequency: 'Scene x2', usedThisScene: 2 }),
      makeMove({ frequency: 'At-Will', usedThisScene: 0 })
    ]
    const result = resetSceneUsage(moves)
    expect(result[0].usedThisScene).toBe(0)
    expect(result[1].usedThisScene).toBe(0)
    expect(result[2].usedThisScene).toBe(0)
  })

  it('resets lastTurnUsed to 0', () => {
    const moves = [
      makeMove({ frequency: 'EOT', lastTurnUsed: 5 })
    ]
    const result = resetSceneUsage(moves)
    expect(result[0].lastTurnUsed).toBe(0)
  })

  it('does not mutate original array', () => {
    const original = makeMove({ frequency: 'Scene', usedThisScene: 2 })
    const moves = [original]
    const result = resetSceneUsage(moves)
    expect(original.usedThisScene).toBe(2) // Original unchanged
    expect(result[0].usedThisScene).toBe(0)
  })

  it('returns same reference for moves that need no reset', () => {
    const move = makeMove({ frequency: 'At-Will' })
    const result = resetSceneUsage([move])
    expect(result[0]).toBe(move) // Same reference — no change needed
  })

  it('returns new array reference', () => {
    const moves = [makeMove()]
    const result = resetSceneUsage(moves)
    expect(result).not.toBe(moves)
  })
})
