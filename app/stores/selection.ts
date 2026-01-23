import { defineStore } from 'pinia'
import type { GridPosition } from '~/types'

export interface SelectionState {
  selectedIds: Set<string>
  isMarqueeActive: boolean
  marqueeStart: GridPosition | null
  marqueeEnd: GridPosition | null
}

export const useSelectionStore = defineStore('selection', {
  state: (): SelectionState => ({
    selectedIds: new Set(),
    isMarqueeActive: false,
    marqueeStart: null,
    marqueeEnd: null,
  }),

  getters: {
    selectedCount: (state) => state.selectedIds.size,
    hasSelection: (state) => state.selectedIds.size > 0,
    isSelected: (state) => (id: string) => state.selectedIds.has(id),
    selectedArray: (state) => Array.from(state.selectedIds),
    marqueeRect: (state) => {
      if (!state.marqueeStart || !state.marqueeEnd) return null

      const minX = Math.min(state.marqueeStart.x, state.marqueeEnd.x)
      const minY = Math.min(state.marqueeStart.y, state.marqueeEnd.y)
      const maxX = Math.max(state.marqueeStart.x, state.marqueeEnd.x)
      const maxY = Math.max(state.marqueeStart.y, state.marqueeEnd.y)

      return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      }
    },
  },

  actions: {
    select(id: string) {
      this.selectedIds = new Set([id])
    },

    addToSelection(id: string) {
      const newSet = new Set(this.selectedIds)
      newSet.add(id)
      this.selectedIds = newSet
    },

    removeFromSelection(id: string) {
      const newSet = new Set(this.selectedIds)
      newSet.delete(id)
      this.selectedIds = newSet
    },

    toggleSelection(id: string) {
      if (this.selectedIds.has(id)) {
        this.removeFromSelection(id)
      } else {
        this.addToSelection(id)
      }
    },

    selectMultiple(ids: string[]) {
      this.selectedIds = new Set(ids)
    },

    addMultipleToSelection(ids: string[]) {
      const newSet = new Set(this.selectedIds)
      ids.forEach(id => newSet.add(id))
      this.selectedIds = newSet
    },

    clearSelection() {
      this.selectedIds = new Set()
    },

    // Marquee selection
    startMarquee(position: GridPosition) {
      this.isMarqueeActive = true
      this.marqueeStart = { ...position }
      this.marqueeEnd = { ...position }
    },

    updateMarquee(position: GridPosition) {
      if (this.isMarqueeActive) {
        this.marqueeEnd = { ...position }
      }
    },

    endMarquee() {
      this.isMarqueeActive = false
      this.marqueeStart = null
      this.marqueeEnd = null
    },

    // Select tokens within a rectangle (grid coordinates)
    selectInRect(
      rect: { x: number; y: number; width: number; height: number },
      tokenPositions: Array<{ id: string; position: GridPosition; size: number }>,
      additive: boolean = false
    ) {
      const selectedInRect: string[] = []

      tokenPositions.forEach(token => {
        // Check if token overlaps with selection rect
        const tokenRight = token.position.x + token.size - 1
        const tokenBottom = token.position.y + token.size - 1
        const rectRight = rect.x + rect.width - 1
        const rectBottom = rect.y + rect.height - 1

        const overlaps =
          token.position.x <= rectRight &&
          tokenRight >= rect.x &&
          token.position.y <= rectBottom &&
          tokenBottom >= rect.y

        if (overlaps) {
          selectedInRect.push(token.id)
        }
      })

      if (additive) {
        this.addMultipleToSelection(selectedInRect)
      } else {
        this.selectMultiple(selectedInRect)
      }
    },
  },
})
