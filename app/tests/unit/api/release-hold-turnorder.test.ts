import { describe, it, expect } from 'vitest'

/**
 * Tests for release-hold turnOrder deduplication (bug-042).
 *
 * Verifies that when a held combatant is released into the turn order,
 * the original entry is removed to prevent duplicate turns.
 *
 * The logic under test is the turnOrder splice + dedup pattern from
 * release-hold.post.ts, extracted here as a pure function for testability.
 */

// ============================================
// Extract the turnOrder manipulation logic
// ============================================

/**
 * Replicates the exact turnOrder manipulation from release-hold.post.ts:
 * 1. Remove the original entry BEFORE inserting (it's typically before currentTurnIndex)
 * 2. Adjust currentTurnIndex if the removal shifted it
 * 3. Splice combatant at the adjusted currentTurnIndex
 *
 * Returns { turnOrder, currentTurnIndex } after manipulation.
 */
function releaseHeldIntoTurnOrder(
  turnOrder: string[],
  currentTurnIndex: number,
  combatantId: string
): { turnOrder: string[]; currentTurnIndex: number } {
  const result = [...turnOrder]
  // Remove the original entry BEFORE inserting (bug-042 fix)
  const originalIndex = result.indexOf(combatantId)
  if (originalIndex !== -1) {
    result.splice(originalIndex, 1)
    if (originalIndex < currentTurnIndex) {
      currentTurnIndex--
    }
  }
  // Insert at the (possibly adjusted) current position
  result.splice(currentTurnIndex, 0, combatantId)
  return { turnOrder: result, currentTurnIndex }
}

/**
 * Simulates the BUGGY version (pre-fix) for comparison tests.
 */
function releaseHeldIntoTurnOrderBuggy(
  turnOrder: string[],
  currentTurnIndex: number,
  combatantId: string
): { turnOrder: string[] } {
  const result = [...turnOrder]
  result.splice(currentTurnIndex, 0, combatantId)
  // NO dedup — this is the bug
  return { turnOrder: result }
}

// ============================================
// Tests
// ============================================

describe('release-hold turnOrder deduplication (bug-042)', () => {
  describe('Full Contact battles — turnOrder persists across rounds', () => {
    it('should not create duplicate entries when releasing a held combatant', () => {
      // Setup: 4 combatants, combatant B held their turn
      // Turn order after hold: [A, B, C, D] with currentTurnIndex at 2 (C's turn)
      // B is still in the turn order (hold-action.post.ts does NOT remove them)
      const turnOrder = ['A', 'B', 'C', 'D']
      const currentTurnIndex = 2 // C is the current combatant

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'B')

      // B should appear exactly once
      const bCount = result.turnOrder.filter(id => id === 'B').length
      expect(bCount).toBe(1)

      // B should be at the returned current turn index position
      // Original B at index 1 removed, currentTurnIndex adjusted from 2 to 1
      expect(result.currentTurnIndex).toBe(1)
      expect(result.turnOrder[result.currentTurnIndex]).toBe('B')

      // Total length should be unchanged (one removed, one inserted)
      expect(result.turnOrder).toHaveLength(4)
    })

    it('should demonstrate the bug: pre-fix creates duplicate entries', () => {
      const turnOrder = ['A', 'B', 'C', 'D']
      const currentTurnIndex = 2

      const buggyResult = releaseHeldIntoTurnOrderBuggy(turnOrder, currentTurnIndex, 'B')

      // Bug: B appears twice
      const bCount = buggyResult.turnOrder.filter(id => id === 'B').length
      expect(bCount).toBe(2)

      // Bug: turn order is now 5 entries instead of 4
      expect(buggyResult.turnOrder).toHaveLength(5)
    })

    it('should place the released combatant at the adjusted current turn index', () => {
      const turnOrder = ['A', 'B', 'C', 'D']
      const currentTurnIndex = 3 // D is the current combatant

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'B')

      // B was at index 1 (before currentTurnIndex=3), so index adjusts to 2
      expect(result.currentTurnIndex).toBe(2)
      expect(result.turnOrder[result.currentTurnIndex]).toBe('B')
      expect(result.turnOrder).toHaveLength(4)
      expect(result.turnOrder).toEqual(['A', 'C', 'B', 'D'])
    })

    it('should handle release when held combatant is last in turn order', () => {
      const turnOrder = ['A', 'B', 'C', 'D']
      // D held, currentTurnIndex is now at 0 (wrapped to A's turn in next round)
      // But D's original entry is at index 3
      const currentTurnIndex = 0

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'D')

      const dCount = result.turnOrder.filter(id => id === 'D').length
      expect(dCount).toBe(1)
      expect(result.turnOrder[0]).toBe('D')
      expect(result.turnOrder).toHaveLength(4)
    })

    it('should handle release when held combatant is first in turn order', () => {
      const turnOrder = ['A', 'B', 'C', 'D']
      // A held at the start, currentTurnIndex moved to 1 (B's turn)
      const currentTurnIndex = 1

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'A')

      const aCount = result.turnOrder.filter(id => id === 'A').length
      expect(aCount).toBe(1)
      // A was at index 0 (before currentTurnIndex=1), so index adjusts to 0
      expect(result.currentTurnIndex).toBe(0)
      expect(result.turnOrder[result.currentTurnIndex]).toBe('A')
      expect(result.turnOrder).toHaveLength(4)
    })

    it('should preserve order of other combatants', () => {
      const turnOrder = ['A', 'B', 'C', 'D', 'E']
      const currentTurnIndex = 3 // D's turn, B held earlier

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'B')

      // Remove B at index 1: [A, C, D, E], currentTurnIndex adjusts 3->2
      // Insert B at 2: [A, C, B, D, E]
      expect(result.turnOrder).toEqual(['A', 'C', 'B', 'D', 'E'])
      expect(result.currentTurnIndex).toBe(2)
    })

    it('should work correctly when only 2 combatants exist', () => {
      const turnOrder = ['A', 'B']
      const currentTurnIndex = 1 // B's turn, A held

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'A')

      const aCount = result.turnOrder.filter(id => id === 'A').length
      expect(aCount).toBe(1)
      expect(result.turnOrder).toHaveLength(2)
      // A was at index 0 (before currentTurnIndex=1), so index adjusts to 0
      expect(result.currentTurnIndex).toBe(0)
      expect(result.turnOrder[result.currentTurnIndex]).toBe('A')
    })

    it('should not affect turn order when combatant was not in order (defensive)', () => {
      // Edge case: combatant not already in turn order (shouldn't happen, but be safe)
      const turnOrder = ['A', 'C', 'D']
      const currentTurnIndex = 1

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'B')

      // B is inserted but has no original to remove
      expect(result.turnOrder).toHaveLength(4)
      expect(result.turnOrder[1]).toBe('B')
      // No crash, no duplicate
      const bCount = result.turnOrder.filter(id => id === 'B').length
      expect(bCount).toBe(1)
    })

    it('should maintain no duplicates after multiple hold-release cycles', () => {
      // Round 1: B holds, C acts, B releases during D's turn
      let turnOrder = ['A', 'B', 'C', 'D']
      let result = releaseHeldIntoTurnOrder(turnOrder, 3, 'B')
      expect(result.turnOrder.filter(id => id === 'B').length).toBe(1)

      // Round 2: A holds, B acts, A releases during C's turn
      // (simulating a new round where turnOrder carried over)
      turnOrder = result.turnOrder // ['A', 'C', 'B', 'D'] from previous
      result = releaseHeldIntoTurnOrder(turnOrder, 1, 'A')
      expect(result.turnOrder.filter(id => id === 'A').length).toBe(1)
      expect(result.turnOrder).toHaveLength(4)
    })
  })

  describe('League Battle mode — turnOrder rebuilt at phase transitions', () => {
    it('should still deduplicate even in League mode (defensive)', () => {
      // League Battles rebuild turnOrder at phase transitions, so duplicates
      // would be cleaned up anyway. But the fix should still work correctly
      // in case release-hold is called mid-phase.
      const turnOrder = ['trainer-A', 'trainer-B', 'trainer-C']
      const currentTurnIndex = 2

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'trainer-A')

      const aCount = result.turnOrder.filter(id => id === 'trainer-A').length
      expect(aCount).toBe(1)
      expect(result.turnOrder).toHaveLength(3)
    })
  })

  describe('edge cases', () => {
    it('should handle currentTurnIndex at 0 with combatant at end', () => {
      const turnOrder = ['X', 'Y', 'Z']
      const currentTurnIndex = 0

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'Z')

      expect(result.turnOrder[0]).toBe('Z')
      expect(result.turnOrder.filter(id => id === 'Z').length).toBe(1)
      expect(result.turnOrder).toHaveLength(3)
    })

    it('should handle single-combatant turn order', () => {
      // Unusual but possible — only one combatant left
      const turnOrder = ['A']
      const currentTurnIndex = 0

      const result = releaseHeldIntoTurnOrder(turnOrder, currentTurnIndex, 'A')

      expect(result.turnOrder).toEqual(['A'])
      expect(result.turnOrder).toHaveLength(1)
    })
  })
})
