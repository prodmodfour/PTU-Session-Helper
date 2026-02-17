import type { APIRequestContext } from '@playwright/test'

export interface PokemonSetup {
  species: string
  level: number
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAttack: number
  baseSpDefense: number
  baseSpeed: number
  types: string[]
}

export async function createPokemon(request: APIRequestContext, data: PokemonSetup): Promise<string> {
  // Map field names: API requires baseSpAtk/baseSpDef (not baseSpAttack/baseSpDefense)
  const apiData: Record<string, any> = {
    species: data.species,
    level: data.level,
    baseHp: data.baseHp,
    baseAttack: data.baseAttack,
    baseDefense: data.baseDefense,
    baseSpAtk: data.baseSpAttack,
    baseSpDef: data.baseSpDefense,
    baseSpeed: data.baseSpeed,
    types: data.types,
  }
  const res = await request.post('/api/pokemon', { data: apiData })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to create pokemon: ${JSON.stringify(body)}`)
  return body.data.id
}

export async function getPokemon(request: APIRequestContext, pokemonId: string): Promise<any> {
  const res = await request.get(`/api/pokemon/${pokemonId}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get pokemon: ${JSON.stringify(body)}`)
  return body.data
}

export async function deletePokemon(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/pokemon/${id}`)
}

export async function updatePokemon(request: APIRequestContext, id: string, data: Record<string, any>): Promise<any> {
  const res = await request.put(`/api/pokemon/${id}`, { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to update pokemon: ${JSON.stringify(body)}`)
  return body.data
}

export async function createTrainer(request: APIRequestContext, name: string, level: number): Promise<string> {
  const res = await request.post('/api/characters', {
    data: { name, characterType: 'player', level }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to create trainer: ${JSON.stringify(body)}`)
  return body.data.id
}

export async function deleteTrainer(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/characters/${id}`)
}

export async function getCaptureRate(request: APIRequestContext, data: Record<string, any>): Promise<any> {
  const res = await request.post('/api/capture/rate', { data })
  const body = await res.json()
  return body
}

export async function attemptCapture(request: APIRequestContext, data: Record<string, any>): Promise<any> {
  const res = await request.post('/api/capture/attempt', { data })
  const body = await res.json()
  return body
}

// Encounter helpers (subset needed for workflow scenarios)

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

export async function startEncounter(request: APIRequestContext, encounterId: string): Promise<void> {
  const res = await request.post(`/api/encounters/${encounterId}/start`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to start encounter: ${JSON.stringify(body)}`)
}

export async function endEncounter(request: APIRequestContext, encounterId: string): Promise<void> {
  await request.post(`/api/encounters/${encounterId}/end`)
}

export async function applyDamage(
  request: APIRequestContext,
  encounterId: string,
  combatantId: string,
  damage: number
): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/damage`, {
    data: { combatantId, damage }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to apply damage: ${JSON.stringify(body)}`)
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

export async function getEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.get(`/api/encounters/${encounterId}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get encounter: ${JSON.stringify(body)}`)
  return body.data
}

export function findCombatantByEntityId(encounter: any, entityId: string): any {
  return encounter.combatants.find((c: any) => c.entityId === entityId)
}

/** Cleanup helper — silently ignores errors during teardown */
export async function cleanup(
  request: APIRequestContext,
  options: {
    encounterId?: string | null
    pokemonIds?: string[]
    trainerIds?: string[]
  }
): Promise<void> {
  if (options.encounterId) {
    try { await endEncounter(request, options.encounterId) } catch { /* ignore */ }
  }
  for (const id of options.pokemonIds || []) {
    try { await deletePokemon(request, id) } catch { /* ignore */ }
  }
  for (const id of options.trainerIds || []) {
    try { await deleteTrainer(request, id) } catch { /* ignore */ }
  }
}
