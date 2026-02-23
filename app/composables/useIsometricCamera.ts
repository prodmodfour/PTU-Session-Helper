import type { CameraAngle } from '~/types'
import { useIsometricCameraStore } from '~/stores/isometricCamera'

/**
 * Camera composable for the isometric grid.
 * Manages camera angle rotation, zoom, and pan.
 * Wraps the Pinia store and adds local pan state.
 *
 * P0 uses instant rotation snapping. Smooth animated rotation
 * (eased interpolation between angles) is deferred to P1/P2.
 */
export function useIsometricCamera() {
  const store = useIsometricCameraStore()

  // Local pan offset (not synced via WebSocket — each view pans independently)
  const panOffset = ref({ x: 0, y: 0 })

  /**
   * Current camera angle (reactive, from store).
   */
  const cameraAngle = computed<CameraAngle>(() => store.angle)

  /**
   * Current zoom level (reactive, from store).
   */
  const zoom = computed(() => store.zoom)

  /**
   * Whether a rotation is in progress (always false in P0 instant-snap mode).
   */
  const isRotating = computed(() => store.isRotating)

  /**
   * Rotate camera 90 degrees clockwise (instant snap).
   */
  const rotateClockwise = () => {
    if (store.isRotating) return
    store.rotateClockwise()
    store.completeRotation()
  }

  /**
   * Rotate camera 90 degrees counter-clockwise (instant snap).
   */
  const rotateCounterClockwise = () => {
    if (store.isRotating) return
    store.rotateCounterClockwise()
    store.completeRotation()
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

  return {
    cameraAngle,
    zoom,
    isRotating,
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
