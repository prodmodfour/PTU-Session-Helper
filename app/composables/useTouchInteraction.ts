/**
 * Shared touch interaction composable for VTT grid canvases.
 *
 * Handles single-finger pan, pinch-to-zoom, tap detection, and
 * one-finger-lift-from-pinch transition. Used by both useGridInteraction
 * (classic 2D grid) and useIsometricInteraction (isometric grid).
 */

/** Pixel threshold to distinguish a tap/click from a drag/pan gesture */
export const TOUCH_TAP_THRESHOLD = 5

interface UseTouchInteractionOptions {
  /** Container element for coordinate transforms (getBoundingClientRect) */
  containerRef: Ref<HTMLElement | null>
  /** Current zoom level */
  zoom: Ref<number>
  /** Current pan offset */
  panOffset: Ref<{ x: number; y: number }>
  /** Min zoom level */
  minZoom: number
  /** Max zoom level */
  maxZoom: number
  /** Re-render callback after pan/zoom changes */
  render: () => void
  /**
   * Called when a tap gesture is detected (touch with no significant movement).
   * Receives the screen coordinates of the tap (clientX, clientY from the touch).
   * The caller is responsible for converting to grid coordinates and handling
   * token selection, cell clicks, etc.
   */
  onTap: (screenX: number, screenY: number) => void
}

export function useTouchInteraction(options: UseTouchInteractionOptions) {
  // Touch state
  const isTouchPanning = ref(false)
  const touchStartPos = ref<{ x: number; y: number } | null>(null)
  const lastTouchPos = ref<{ x: number; y: number } | null>(null)
  const isPinching = ref(false)
  const lastPinchDistance = ref(0)
  const lastPinchCenter = ref<{ x: number; y: number } | null>(null)

  /**
   * Calculate distance between two touch points.
   */
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate center point between two touches.
   */
  const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }
  }

  /**
   * Handle touch start -- single finger starts pan, two fingers start pinch-to-zoom.
   */
  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault()

    if (event.touches.length === 1) {
      // Single finger: start potential pan or tap
      const touch = event.touches[0]
      touchStartPos.value = { x: touch.clientX, y: touch.clientY }
      lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
      isTouchPanning.value = false
      isPinching.value = false
    } else if (event.touches.length === 2) {
      // Two fingers: start pinch-to-zoom
      isTouchPanning.value = false
      isPinching.value = true
      lastPinchDistance.value = getTouchDistance(event.touches[0], event.touches[1])
      lastPinchCenter.value = getTouchCenter(event.touches[0], event.touches[1])
    }
  }

  /**
   * Handle touch move -- pan with single finger, zoom with two fingers.
   */
  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault()

    if (event.touches.length === 1 && !isPinching.value) {
      const touch = event.touches[0]

      // Check if movement exceeds tap threshold to start panning
      if (!isTouchPanning.value && touchStartPos.value) {
        const dx = Math.abs(touch.clientX - touchStartPos.value.x)
        const dy = Math.abs(touch.clientY - touchStartPos.value.y)
        if (dx > TOUCH_TAP_THRESHOLD || dy > TOUCH_TAP_THRESHOLD) {
          isTouchPanning.value = true
        }
      }

      // Apply pan delta
      if (isTouchPanning.value && lastTouchPos.value) {
        const deltaX = touch.clientX - lastTouchPos.value.x
        const deltaY = touch.clientY - lastTouchPos.value.y
        options.panOffset.value = {
          x: options.panOffset.value.x + deltaX,
          y: options.panOffset.value.y + deltaY,
        }
        options.render()
      }

      lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
    } else if (event.touches.length === 2 && isPinching.value) {
      // Pinch-to-zoom
      const newDistance = getTouchDistance(event.touches[0], event.touches[1])
      const newCenter = getTouchCenter(event.touches[0], event.touches[1])

      if (lastPinchDistance.value > 0 && lastPinchCenter.value) {
        const scale = newDistance / lastPinchDistance.value
        const newZoom = Math.max(options.minZoom, Math.min(options.maxZoom, options.zoom.value * scale))

        if (newZoom !== options.zoom.value) {
          // Zoom toward pinch center
          const container = options.containerRef.value
          if (container) {
            const rect = container.getBoundingClientRect()
            const centerX = lastPinchCenter.value.x - rect.left
            const centerY = lastPinchCenter.value.y - rect.top

            const zoomRatio = newZoom / options.zoom.value
            options.panOffset.value = {
              x: centerX - (centerX - options.panOffset.value.x) * zoomRatio,
              y: centerY - (centerY - options.panOffset.value.y) * zoomRatio,
            }
          }

          options.zoom.value = newZoom
          options.render()
        }
      }

      lastPinchDistance.value = newDistance
      lastPinchCenter.value = newCenter
    }
  }

  /**
   * Handle touch end -- detect taps (short touch without movement).
   */
  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault()

    // If pinching and one finger lifts, reset to single-finger state
    if (isPinching.value) {
      isPinching.value = false
      lastPinchDistance.value = 0
      lastPinchCenter.value = null

      if (event.touches.length === 1) {
        // One finger still down: continue as pan
        const touch = event.touches[0]
        lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
        touchStartPos.value = { x: touch.clientX, y: touch.clientY }
        isTouchPanning.value = false
      }
      return
    }

    // All fingers lifted -- check if this was a tap
    if (event.touches.length === 0 && !isTouchPanning.value && touchStartPos.value) {
      const changedTouch = event.changedTouches[0]
      if (changedTouch) {
        options.onTap(changedTouch.clientX, changedTouch.clientY)
      }
    }

    // Reset touch state
    isTouchPanning.value = false
    touchStartPos.value = null
    lastTouchPos.value = null
  }

  return {
    // State (exposed for testing or advanced use)
    isTouchPanning: readonly(isTouchPanning),
    isPinching: readonly(isPinching),
    // Methods
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
