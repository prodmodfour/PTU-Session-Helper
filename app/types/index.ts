// Pokemon Types
export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

// Status conditions (PTU 1.05)
export type StatusCondition =
  | 'Burned' | 'Frozen' | 'Paralyzed' | 'Poisoned' | 'Badly Poisoned'
  | 'Asleep' | 'Confused' | 'Flinched' | 'Infatuated' | 'Cursed'
  | 'Disabled' | 'Encored' | 'Taunted' | 'Tormented'
  | 'Stuck' | 'Slowed' | 'Trapped' | 'Enraged' | 'Suppressed' | 'Fainted';

// PTU Action Types
export type ActionType = 'standard' | 'shift' | 'swift' | 'free' | 'extended' | 'full' | 'priority' | 'interrupt';

// PTU Move Frequency
export type MoveFrequency =
  | 'At-Will' | 'EOT' | 'Scene' | 'Scene x2' | 'Scene x3'
  | 'Daily' | 'Daily x2' | 'Daily x3' | 'Static';

// Combat side
export type CombatSide = 'players' | 'allies' | 'enemies';

// Battle type
export type BattleType = 'trainer' | 'full_contact';

// Character type
export type CharacterType = 'player' | 'npc';

// Base stats structure
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// Combat stats (derived from base + modifiers)
export interface CombatStats extends Stats {
  evasion: number;
  accuracy: number;
}

// Stage modifiers (-6 to +6)
export interface StageModifiers {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

// Move data (PTU 1.05)
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  damageClass: 'Physical' | 'Special' | 'Status';
  frequency: MoveFrequency;
  ac: number | null; // Accuracy Check target (null for auto-hit)
  damageBase: number | null; // DB 1-28 (null for non-damaging moves)
  range: string; // e.g., "Melee", "6", "Burst 2", "Cone 2", etc.
  effect: string;

  // PTU-specific properties
  keywords?: string[]; // e.g., "Five Strike", "Double Strike", "Push", "Powder"
  actionType?: ActionType; // Default is 'standard' for most moves
  critRange?: number; // Default is 20 (nat 20 only)

  // Usage tracking (for frequency limits)
  usedThisScene?: number;
  usedToday?: number;

  // Contest info
  contestType?: string;
  contestEffect?: string;
}

// Ability data
export interface Ability {
  id: string;
  name: string;
  effect: string;
  trigger?: string;
}

// Nature data
export interface Nature {
  name: string;
  raisedStat: keyof Stats | null;
  loweredStat: keyof Stats | null;
}

// Pokemon data
export interface Pokemon {
  id: string;
  species: string;
  nickname?: string;
  level: number;
  experience: number;
  nature: Nature;
  types: [PokemonType] | [PokemonType, PokemonType];

  // Stats
  baseStats: Stats;
  currentStats: Stats;
  currentHp: number;
  maxHp: number;
  stageModifiers: StageModifiers;

  // Combat
  abilities: Ability[];
  moves: Move[];
  heldItem?: string;

  // Status
  statusConditions: StatusCondition[];
  injuries: number;
  temporaryHp: number;

  // Ownership
  ownerId?: string;

  // Display
  spriteUrl?: string;
  shiny: boolean;
  gender: 'Male' | 'Female' | 'Genderless';

  // Library
  isInLibrary: boolean;
  notes?: string;
}

// Trainer class (simplified)
export interface TrainerClass {
  name: string;
  skills: string[];
  features: string[];
}

// Human character (trainer/NPC)
export interface HumanCharacter {
  id: string;
  name: string;
  characterType: CharacterType;

  // Stats
  level: number;
  stats: Stats;
  currentHp: number;
  maxHp: number;

  // Classes & Skills
  trainerClasses: TrainerClass[];
  skills: Record<string, number>;

  // Pokemon team
  pokemonIds: string[];
  activePokemonId?: string;

  // Combat
  statusConditions: StatusCondition[];
  stageModifiers: StageModifiers;
  injuries: number;
  temporaryHp: number;

  // Inventory
  inventory: InventoryItem[];
  money: number;

  // Display
  avatarUrl?: string;

  // Library
  isInLibrary: boolean;
  notes?: string;
}

// Inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  effect?: string;
}

// PTU Turn State (tracks actions available)
export interface TurnState {
  hasActed: boolean;
  standardActionUsed: boolean;
  shiftActionUsed: boolean;
  swiftActionUsed: boolean;

  // For League battles: can't command newly switched Pokemon
  canBeCommanded: boolean;

  // Held/Delayed action
  isHolding: boolean;
  heldUntilInitiative?: number;
}

// PTU Injury tracking
export interface InjuryState {
  count: number;
  sources: string[]; // Description of what caused each injury
}

// Combatant in encounter (wrapper for Pokemon or Human)
export interface Combatant {
  id: string;
  type: 'pokemon' | 'human';
  entityId: string;
  side: CombatSide;

  // Initiative
  initiative: number;
  initiativeBonus: number;
  initiativeRollOff?: number; // For breaking ties

  // Turn state (PTU action system)
  turnState: TurnState;

  // Legacy support
  hasActed: boolean;
  actionsRemaining: number;
  shiftActionsRemaining: number;

  // Ready/Held action
  readyAction?: string;

  // PTU-specific tracking
  injuries: InjuryState;

  // Evasion values (derived from stats)
  physicalEvasion: number;
  specialEvasion: number;
  speedEvasion: number;

  // Reference to actual data
  entity: Pokemon | HumanCharacter;
}

// Move log entry (PTU combat)
export interface MoveLogEntry {
  id: string;
  timestamp: Date;
  round: number;

  // Actor
  actorId: string;
  actorName: string;

  // Action
  moveName: string;
  moveType?: PokemonType;
  damageClass?: 'Physical' | 'Special' | 'Status';
  actionType?: ActionType;

  // Accuracy roll info
  accuracyRoll?: number; // d20 result
  accuracyTarget?: number; // What was needed to hit

  // Targets
  targets: {
    id: string;
    name: string;
    hit: boolean;
    damage?: number;
    effectiveness?: number; // 0, 0.25, 0.5, 1, 1.5, 2
    effectivenessText?: string;
    criticalHit?: boolean;
    effect?: string;
    injury?: boolean;
  }[];

  // Result
  notes?: string;
}

// PTU Turn Phase (for League battles)
export type TurnPhase = 'trainer' | 'pokemon';

// Encounter state (PTU 1.05)
export interface Encounter {
  id: string;
  name: string;
  battleType: BattleType;

  // Combatants
  combatants: Combatant[];

  // Turn tracking
  currentRound: number;
  currentTurnIndex: number;
  turnOrder: string[]; // Combatant IDs in initiative order

  // PTU League Battle phase tracking
  // In League battles: trainers declare/act first, then Pokemon
  currentPhase: TurnPhase;
  trainerTurnOrder: string[]; // Trainer combatant IDs (low to high speed for declaration)
  pokemonTurnOrder: string[]; // Pokemon combatant IDs (high to low speed)

  // State
  isActive: boolean;
  isPaused: boolean;
  isServed: boolean;

  // Scene tracking (for Scene-frequency moves)
  sceneNumber: number;

  // History
  moveLog: MoveLogEntry[];

  // XP tracking
  defeatedEnemies: { species: string; level: number }[];
}

// Library filters
export interface LibraryFilters {
  search: string;
  type: 'all' | 'human' | 'pokemon';
  characterType: 'all' | 'player' | 'npc';
  pokemonType: PokemonType | 'all';
  sortBy: 'name' | 'level' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
}

// App state
export interface AppState {
  // Current view
  viewMode: 'gm' | 'player';

  // Active encounter
  activeEncounter?: Encounter;

  // Library
  library: {
    humans: HumanCharacter[];
    pokemon: Pokemon[];
  };

  // Quick access
  recentCharacters: string[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Websocket events
export type WebSocketEvent =
  | { type: 'connected'; data: { peerId: string } }
  | { type: 'identify'; data: { role: 'gm' | 'group'; encounterId?: string } }
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
  | { type: 'serve_encounter'; data: { encounterId: string } }
  | { type: 'encounter_served'; data: { encounterId: string; encounter: Encounter } }
  | { type: 'encounter_unserved'; data: { encounterId: string } };

// Encounter history snapshot for undo/redo
export interface EncounterSnapshot {
  id: string;
  timestamp: Date;
  actionName: string;
  state: Encounter;
}
