// Scene-related types for the narrative scene system
// Moved from stores/groupViewTabs.ts to decouple type definitions from store

export type GroupViewTab = 'lobby' | 'scene' | 'encounter' | 'map'

export interface ScenePosition {
  x: number
  y: number
}

export interface ScenePokemon {
  id: string
  speciesId?: string
  species: string
  level: number
  nickname?: string | null
  position: ScenePosition
  groupId?: string | null
}

export interface SceneCharacter {
  id: string
  characterId: string
  name: string
  avatarUrl?: string | null
  position: ScenePosition
  groupId?: string | null
}

export interface SceneGroup {
  id: string
  name: string
  position: ScenePosition
  width: number
  height: number
}

export interface SceneModifier {
  name: string
  description?: string
  effect?: string
}

export interface Scene {
  id: string
  name: string
  description?: string | null
  locationName?: string | null
  locationImage?: string | null
  pokemon: ScenePokemon[]
  characters: SceneCharacter[]
  groups: SceneGroup[]
  weather?: string | null
  terrains: string[]
  modifiers: SceneModifier[]
  habitatId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
