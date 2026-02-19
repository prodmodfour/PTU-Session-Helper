// API and WebSocket types

import type { GridPosition } from './spatial';
import type { StatusCondition } from './combat';
import type { Pokemon, HumanCharacter } from './character';
import type { Encounter, Combatant, MoveLogEntry, MovementPreview } from './encounter';
import type { Scene, ScenePosition, SceneCharacter, ScenePokemon, SceneGroup } from './scene';
import type { ServedMap } from '~/stores/groupView';

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Websocket events
export type WebSocketEvent =
  // Connection & identity
  | { type: 'connected'; data: { peerId: string } }
  | { type: 'identify'; data: { role: 'gm' | 'group' | 'player'; encounterId?: string } }
  | { type: 'join_encounter'; data: { encounterId: string } }
  | { type: 'leave_encounter'; data: null }
  | { type: 'sync_request'; data: null }
  | { type: 'tab_sync_request'; data: null }
  // Encounter events
  | { type: 'encounter_update'; data: Encounter }
  | { type: 'serve_encounter'; data: { encounterId: string; encounter?: Encounter } }
  | { type: 'encounter_served'; data: { encounterId: string; encounter: Encounter } }
  | { type: 'encounter_unserved'; data: { encounterId?: string } }
  // Combat events
  | { type: 'turn_change'; data: { combatantId: string; round: number } }
  | { type: 'move_executed'; data: MoveLogEntry }
  | { type: 'damage_applied'; data: { combatantId: string; damage: number; newHp: number; injuries: number } }
  | { type: 'heal_applied'; data: { combatantId: string; amount: number; newHp: number } }
  | { type: 'status_change'; data: { combatantId: string; added?: StatusCondition[]; removed?: StatusCondition[] } }
  | { type: 'combatant_added'; data: Combatant }
  | { type: 'combatant_removed'; data: { combatantId: string } }
  // Entity events
  | { type: 'character_update'; data: Pokemon | HumanCharacter }
  | { type: 'player_action'; data: { playerId: string; action: string; targetId?: string; moveId?: string } }
  // Tab events
  | { type: 'tab_change'; data: { tab: string; sceneId?: string | null } }
  | { type: 'tab_state'; data: { tab: string; sceneId?: string | null } }
  // Scene events
  | { type: 'scene_activated'; data: { scene: Scene } }
  | { type: 'scene_deactivated'; data: { sceneId: string } }
  | { type: 'scene_update'; data: { sceneId: string; scene: Scene } }
  | { type: 'scene_positions_updated'; data: { positions: { pokemon?: Array<{ id: string; position: ScenePosition }>; characters?: Array<{ id: string; position: ScenePosition }>; groups?: Array<{ id: string; position: ScenePosition }> } } }
  | { type: 'scene_character_added'; data: { sceneId: string; character: SceneCharacter } }
  | { type: 'scene_character_removed'; data: { sceneId: string; characterId: string } }
  | { type: 'scene_pokemon_added'; data: { sceneId: string; pokemon: ScenePokemon } }
  | { type: 'scene_pokemon_removed'; data: { sceneId: string; pokemonId: string } }
  | { type: 'scene_group_created'; data: { sceneId: string; group: SceneGroup } }
  | { type: 'scene_group_updated'; data: { sceneId: string; group: SceneGroup } }
  | { type: 'scene_group_deleted'; data: { sceneId: string; groupId: string } }
  // VTT events
  | { type: 'movement_preview'; data: MovementPreview | null }
  // Map & spawn events
  | { type: 'serve_map'; data: ServedMap }
  | { type: 'clear_map'; data: null }
  | { type: 'clear_wild_spawn'; data: null };
