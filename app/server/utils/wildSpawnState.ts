// In-memory storage for wild spawn preview
// This is transient state that doesn't need database persistence

export interface WildSpawnPreview {
  id: string
  pokemon: Array<{
    speciesId: string
    speciesName: string
    level: number
  }>
  tableName: string
  timestamp: number
}

// Server-side singleton for wild spawn state
let wildSpawnPreview: WildSpawnPreview | null = null

export function getWildSpawnPreview(): WildSpawnPreview | null {
  return wildSpawnPreview
}

export function setWildSpawnPreview(preview: WildSpawnPreview): void {
  wildSpawnPreview = preview
}

export function clearWildSpawnPreview(): void {
  wildSpawnPreview = null
}
