import type { CameraAngle } from '~/types'
import { useIsometricCameraStore } from '~/stores/isometricCamera'

const ROTATION_DURATION_MS = 300

/**
 * Camera composable for the isometric grid.
 * Manages camera angle rotation with smooth animation, zoom, and pan.
 * Wraps the Pinia store and adds local animation/pan state.
 */
export function useIsometricCamera() {
  const store = useIsometricCameraStore()

  // Local pan offset (not synced via WebSocket — each view pans independently)
  const panOffset = ref({ x: 0, y: 0 })

  // Animation interpolation value (0 to 1 during rotation)
  const rotationProgress = ref(0)
  let animationFrameId: number | null = null

  /**
   * Current camera angle (reactive, from store).
   */
  const cameraAngle = computed<CameraAngle>(() => store.angle)

  /**
   * Current zoom level (reactive, from store).
   */
  const zoom = computed(() => store.zoom)

  /**
   * Whether a rotation animation is in progress.
   */
  const isRotating = computed(() => store.isRotating)

  /**
   * Rotate camera 90 degrees clockwise with animation.
   */
  const rotateClockwise = () => {
    if (store.isRotating) return
    store.rotateClockwise()
    animateRotation()
  }

  /**
   * Rotate camera 90 degrees counter-clockwise with animation.
   */
  const rotateCounterClockwise = () => {
    if (store.isRotating) return
    store.rotateCounterClockwise()
    animateRotation()
  }

  /**
   * Run the rotation animation over ROTATION_DURATION_MS.
   * On completion, snaps to the target angle.
   */
  const animateRotation = () => {
    rotationProgress.value = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / ROTATION_DURATION_MS, 1)
      rotationProgress.value = easeInOutCubic(progress)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick)
      } else {
        rotationProgress.value = 0
        store.completeRotation()
        animationFrameId = null
      }
    }

    animationFrameId = requestAnimationFrame(tick)
  }

  /**
   * Cubic ease-in-out for smooth rotation.
   */
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Set zoom level.
   */
  const setZoom = (level: number) => {
    store.setZoom(level)
  }

  /**
   * Zoom in by 10%.
   */
  const zoomIn = () => {
    store.setZoom(store.zoom * 1.1)
  }

  /**
   * Zoom out by 10%.
   */
  const zoomOut = () => {
    store.setZoom(store.zoom / 1.1)
  }

  /**
   * Reset view to default zoom and center pan.
   */
  const resetView = () => {
    store.setZoom(1)
    panOffset.value = { x: 0, y: 0 }
  }

  /**
   * Set camera angle directly (e.g., from server config load).
   */
  const setAngle = (angle: CameraAngle) => {
    store.setAngle(angle)
  }

  /**
   * Cleanup animation frame on unmount.
   */
  onUnmounted(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  })

  return {
    cameraAngle,
    zoom,
    isRotating,
    rotationProgress,
    panOffset,
    rotateClockwise,
    rotateCounterClockwise,
    setAngle,
    setZoom,
    zoomIn,
    zoomOut,
    resetView
  }
}
