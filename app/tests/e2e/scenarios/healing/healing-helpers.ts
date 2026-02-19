import type { APIRequestContext } from '@playwright/test'

export interface PokemonSetup {
  species: string
  level: number
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  types: string[]
  moves?: MoveSetup[]
}

export interface MoveSetup {
  name: string
  type: string
  frequency: string
  db: number
  ac: number
  damageClass: string
  usedToday?: number
  usedThisScene?: number
}

export interface CharacterSetup {
  name: string
  level: number
  hp: number
  characterType: 'player' | 'npc'
  maxHp: number
  currentHp: number
}

// ── Pokemon CRUD ──

export async function createPokemon(request: APIRequestContext, data: PokemonSetup): Promise<string> {
  const res = await request.post('/api/pokemon', { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to create pokemon: ${JSON.stringify(body)}`)
  return body.data.id
}

export async function updatePokemon(request: APIRequestContext, id: string, data: Record<string, unknown>): Promise<any> {
  const res = await request.put(`/api/pokemon/${id}`, { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to update pokemon: ${JSON.stringify(body)}`)
  return body.data
}

export async function getPokemon(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.get(`/api/pokemon/${id}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get pokemon: ${JSON.stringify(body)}`)
  return body.data
}

export async function deletePokemon(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/pokemon/${id}`)
}

// ── Character CRUD ──

export async function createCharacter(request: APIRequestContext, data: CharacterSetup): Promise<string> {
  const res = await request.post('/api/characters', { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to create character: ${JSON.stringify(body)}`)
  return body.data.id
}

export async function updateCharacter(request: APIRequestContext, id: string, data: Record<string, unknown>): Promise<any> {
  const res = await request.put(`/api/characters/${id}`, { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to update character: ${JSON.stringify(body)}`)
  return body.data
}

export async function getCharacter(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.get(`/api/characters/${id}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get character: ${JSON.stringify(body)}`)
  return body.data
}

export async function deleteCharacter(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/characters/${id}`)
}

// ── Healing Actions ──

export async function restPokemon(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/pokemon/${id}/rest`)
  return await res.json()
}

export async function extendedRestPokemon(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/pokemon/${id}/extended-rest`)
  return await res.json()
}

export async function extendedRestCharacter(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/characters/${id}/extended-rest`)
  return await res.json()
}

export async function pokemonCenterPokemon(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/pokemon/${id}/pokemon-center`)
  return await res.json()
}

export async function pokemonCenterCharacter(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/characters/${id}/pokemon-center`)
  return await res.json()
}

export async function healInjuryPokemon(request: APIRequestContext, id: string): Promise<any> {
  const res = await request.post(`/api/pokemon/${id}/heal-injury`)
  return await res.json()
}

export async function healInjuryCharacter(request: APIRequestContext, id: string, method: 'natural' | 'drain_ap' = 'natural'): Promise<any> {
  const res = await request.post(`/api/characters/${id}/heal-injury`, { data: { method } })
  return await res.json()
}

export async function triggerNewDay(request: APIRequestContext): Promise<any> {
  const res = await request.post('/api/game/new-day')
  return await res.json()
}

// ── Encounter Helpers (for breather scenarios) ──

export async function createEncounter(request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post('/api/encounters', { data: { name } })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to create encounter: ${JSON.stringify(body)}`)
  return body.data.id
}

export async function addCombatant(
  request: APIRequestContext,
  encounterId: string,
  pokemonId: string,
  side: 'players' | 'allies' | 'enemies'
): Promise<string> {
  const res = await request.post(`/api/encounters/${encounterId}/combatants`, {
    data: { entityType: 'pokemon', entityId: pokemonId, side }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to add combatant: ${JSON.stringify(body)}`)
  const combatant = body.data.combatants.find((c: any) => c.entityId === pokemonId)
  return combatant?.id ?? ''
}

export async function startEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/start`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to start encounter: ${JSON.stringify(body)}`)
  return body.data
}

export async function applyStages(
  request: APIRequestContext,
  encounterId: string,
  combatantId: string,
  changes: Record<string, number>
): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/stages`, {
    data: { combatantId, changes }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to apply stages: ${JSON.stringify(body)}`)
  return body
}

export async function applyStatus(
  request: APIRequestContext,
  encounterId: string,
  combatantId: string,
  options: { add?: string[]; remove?: string[] }
): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/status`, {
    data: { combatantId, ...options }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to apply status: ${JSON.stringify(body)}`)
  return body
}

export async function takeBreather(
  request: APIRequestContext,
  encounterId: string,
  combatantId: string
): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/breather`, {
    data: { combatantId }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to take breather: ${JSON.stringify(body)}`)
  return body
}

export async function getEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.get(`/api/encounters/${encounterId}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get encounter: ${JSON.stringify(body)}`)
  return body.data
}

export async function endEncounter(request: APIRequestContext, encounterId: string): Promise<void> {
  await request.post(`/api/encounters/${encounterId}/end`)
}

export function findCombatantByEntityId(encounter: any, entityId: string): any {
  return encounter.combatants.find((c: any) => c.entityId === entityId)
}

// ── Cleanup ──

export async function cleanupHealing(
  request: APIRequestContext,
  pokemonIds: string[],
  characterIds: string[],
  encounterIds: string[] = []
): Promise<void> {
  for (const id of encounterIds) {
    try { await endEncounter(request, id) } catch { /* ignore */ }
  }
  for (const id of pokemonIds) {
    try { await deletePokemon(request, id) } catch { /* ignore */ }
  }
  for (const id of characterIds) {
    try { await deleteCharacter(request, id) } catch { /* ignore */ }
  }
}
