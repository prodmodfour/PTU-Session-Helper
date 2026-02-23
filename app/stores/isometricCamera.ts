import { defineStore } from 'pinia'
import type { CameraAngle } from '~/types'

/**
 * Shared camera state for the isometric grid.
 * Used to synchronize camera angle between GM and Group views via WebSocket.
 */
export const useIsometricCameraStore = defineStore('isometricCamera', {
  state: () => ({
    /** Current camera angle (0-3, cardinal rotations) */
    angle: 0 as CameraAngle,
    /** Zoom level (1.0 = 100%) */
    zoom: 1,
    /** Whether a rotation animation is in progress */
    isRotating: false,
    /** The target angle during rotation animation */
    targetAngle: 0 as CameraAngle
  }),

  actions: {
    /**
     * Set camera angle directly (used when loading from server or WebSocket sync).
     */
    setAngle(angle: CameraAngle) {
      this.angle = angle
      this.targetAngle = angle
    },

    /**
     * Rotate camera 90 degrees clockwise.
     * Sets target angle for animation; the composable handles the transition.
     */
    rotateClockwise() {
      if (this.isRotating) return
      this.targetAngle = ((this.angle + 1) % 4) as CameraAngle
      this.isRotating = true
    },

    /**
     * Rotate camera 90 degrees counter-clockwise.
     */
    rotateCounterClockwise() {
      if (this.isRotating) return
      this.targetAngle = ((this.angle + 3) % 4) as CameraAngle
      this.isRotating = true
    },

    /**
     * Called when the rotation animation completes.
     * Snaps to the target angle.
     */
    completeRotation() {
      this.angle = this.targetAngle
      this.isRotating = false
    },

    /**
     * Set zoom level (clamped to reasonable range).
     */
    setZoom(level: number) {
      this.zoom = Math.max(0.25, Math.min(3, level))
    }
  }
})
