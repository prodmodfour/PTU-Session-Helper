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

export interface CombatantInfo {
  pokemonId: string
  combatantId: string
  name: string
}

export async function createPokemon(request: APIRequestContext, data: PokemonSetup): Promise<string> {
  // Map field names to what the API expects (baseSpAtk/baseSpDef, not baseSpAttack/baseSpDefense)
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

export async function nextTurn(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/next-turn`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to advance turn: ${JSON.stringify(body)}`)
  return body.data
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

export async function applyHeal(
  request: APIRequestContext,
  encounterId: string,
  combatantId: string,
  options: { amount?: number; tempHp?: number; healInjuries?: number }
): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/heal`, {
    data: { combatantId, ...options }
  })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to apply heal: ${JSON.stringify(body)}`)
  return body
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

export async function executeMove(
  request: APIRequestContext,
  encounterId: string,
  actorId: string,
  moveId: string,
  targetIds: string[],
  damage?: number,
  targetDamages?: Record<string, number>
): Promise<any> {
  const data: any = { actorId, moveId, targetIds }
  if (damage !== undefined) data.damage = damage
  if (targetDamages !== undefined) data.targetDamages = targetDamages
  const res = await request.post(`/api/encounters/${encounterId}/move`, { data })
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to execute move: ${JSON.stringify(body)}`)
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

export async function endEncounter(request: APIRequestContext, encounterId: string): Promise<void> {
  await request.post(`/api/encounters/${encounterId}/end`)
}

export async function serveEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/serve`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to serve encounter: ${JSON.stringify(body)}`)
  return body.data
}

export async function unserveEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.post(`/api/encounters/${encounterId}/unserve`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to unserve encounter: ${JSON.stringify(body)}`)
  return body.data
}

export async function getEncounter(request: APIRequestContext, encounterId: string): Promise<any> {
  const res = await request.get(`/api/encounters/${encounterId}`)
  const body = await res.json()
  if (!body.success) throw new Error(`Failed to get encounter: ${JSON.stringify(body)}`)
  return body.data
}

export async function getServedEncounter(request: APIRequestContext): Promise<any> {
  const res = await request.get('/api/encounters/served')
  const body = await res.json()
  return body.data
}

export function findCombatantByEntityId(encounter: any, entityId: string): any {
  return encounter.combatants.find((c: any) => c.entityId === entityId)
}

export function getActiveCombatant(encounter: any): any {
  const activeId = encounter.turnOrder[encounter.currentTurnIndex]
  return encounter.combatants.find((c: any) => c.id === activeId)
}

/** Cleanup helper — silently handles errors during teardown */
export async function cleanup(
  request: APIRequestContext,
  encounterId: string | null,
  pokemonIds: string[]
): Promise<void> {
  if (encounterId) {
    try { await endEncounter(request, encounterId) } catch { /* ignore */ }
  }
  for (const id of pokemonIds) {
    try { await deletePokemon(request, id) } catch { /* ignore */ }
  }
}
