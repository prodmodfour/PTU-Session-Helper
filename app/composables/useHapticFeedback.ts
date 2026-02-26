/**
 * Composable for haptic feedback via the Vibration API.
 * Provides predefined vibration patterns for common player events.
 * Safely no-ops on browsers/devices without vibration support.
 */
export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  /**
   * Fire a raw vibration pattern. No-ops if unsupported.
   * @param pattern - Duration (ms) or alternating vibrate/pause array
   */
  const vibrate = (pattern: number | number[]): void => {
    if (!isSupported) return
    try {
      navigator.vibrate(pattern)
    } catch {
      // Silently ignore — some browsers throw on certain patterns
    }
  }

  /** Double-pulse when it becomes the player's turn. */
  const vibrateOnTurnStart = (): void => {
    vibrate([200, 100, 200])
  }

  /** Short single pulse when a move is executed. */
  const vibrateOnMoveExecute = (): void => {
    vibrate(100)
  }

  /** Triple short pulse when the player's combatant takes damage. */
  const vibrateOnDamageTaken = (): void => {
    vibrate([80, 60, 80, 60, 80])
  }

  /** Light tap for general UI confirmation (button press, selection). */
  const vibrateOnTap = (): void => {
    vibrate(30)
  }

  return {
    isSupported,
    vibrate,
    vibrateOnTurnStart,
    vibrateOnMoveExecute,
    vibrateOnDamageTaken,
    vibrateOnTap
  }
}
