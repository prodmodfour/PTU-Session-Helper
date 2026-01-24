export interface MapLocation {
  id: string
  name: string
  type: 'town' | 'forest' | 'castle' | 'path' | 'river' | 'landmark'
  description?: string
  x: number
  y: number
  highlighted?: boolean
}

export interface MapConnection {
  from: string
  to: string
  label?: string
  type: 'road' | 'path' | 'river' | 'aqueduct'
}

export interface ServedMap {
  id: string
  name: string
  locations: MapLocation[]
  connections: MapConnection[]
  timestamp: number
}

// Global state for served map
let servedMap: ServedMap | null = null

export function getServedMap(): ServedMap | null {
  return servedMap
}

export function setServedMap(map: ServedMap | null): void {
  servedMap = map
}

export function clearServedMap(): void {
  servedMap = null
}
