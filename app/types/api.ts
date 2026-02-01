// API and WebSocket types

import type { GridPosition } from './spatial';
import type { StatusCondition } from './combat';
import type { Pokemon, HumanCharacter } from './character';
import type { Encounter, Combatant, MoveLogEntry, MovementPreview } from './encounter';

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Websocket events
export type WebSocketEvent =
  | { type: 'connected'; data: { peerId: string } }
  | { type: 'identify'; data: { role: 'gm' | 'group' | 'player'; encounterId?: string } }
  | { type: 'join_encounter'; data: { encounterId: string } }
  | { type: 'leave_encounter'; data: null }
  | { type: 'encounter_update'; data: Encounter }
  | { type: 'character_update'; data: Pokemon | HumanCharacter }
  | { type: 'turn_change'; data: { combatantId: string; round: number } }
  | { type: 'move_executed'; data: MoveLogEntry }
  | { type: 'damage_applied'; data: { combatantId: string; damage: number; newHp: number; injuries: number } }
  | { type: 'heal_applied'; data: { combatantId: string; amount: number; newHp: number } }
  | { type: 'status_change'; data: { combatantId: string; added?: StatusCondition[]; removed?: StatusCondition[] } }
  | { type: 'combatant_added'; data: Combatant }
  | { type: 'combatant_removed'; data: { combatantId: string } }
  | { type: 'player_action'; data: { playerId: string; action: string; targetId?: string; moveId?: string } }
  | { type: 'sync_request'; data: null }
  | { type: 'serve_encounter'; data: { encounterId: string; encounter?: Encounter } }
  | { type: 'encounter_served'; data: { encounterId: string; encounter: Encounter } }
  | { type: 'encounter_unserved'; data: { encounterId?: string } }
  | { type: 'movement_preview'; data: MovementPreview | null }
  | { type: 'serve_map'; data: { id: string; name: string; locations: unknown[]; connections: unknown[]; timestamp: number } }
  | { type: 'clear_map'; data: null }
  | { type: 'clear_wild_spawn'; data: null };
