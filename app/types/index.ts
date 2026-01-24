// Import spatial types for use in this file
import type { GridPosition, GridConfig } from './spatial';

// Re-export spatial types
export * from './spatial';

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
export type CharacterType = 'player' | 'npc' | 'trainer';

// Skill rank (PTU)
export type SkillRank = 'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master';

// PTU Skill names
export type SkillName =
  | 'Acrobatics' | 'Athletics' | 'Charm' | 'Combat' | 'Command'
  | 'General Ed' | 'Medicine Ed' | 'Occult Ed' | 'Pokémon Ed' | 'Technology Ed'
  | 'Focus' | 'Guile' | 'Intimidate' | 'Intuition' | 'Perception'
  | 'Stealth' | 'Survival';

// Pokemon capabilities (PTU)
export interface PokemonCapabilities {
  overland: number;
  swim: number;
  sky: number;
  burrow: number;
  levitate: number;
  teleport?: number;
  jump: { high: number; long: number };
  power: number;
  weightClass: number;
  size: 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gigantic';
  naturewalk?: string[];
  otherCapabilities?: string[];
}

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

  // Capabilities (movement, size, etc.)
  capabilities: PokemonCapabilities;

  // Skills (Pokemon can have skills)
  skills: Record<string, string>; // { skillName: diceFormula like "2d6+2" }

  // Status
  statusConditions: StatusCondition[];
  injuries: number;
  temporaryHp: number;

  // Training
  tutorPoints: number;
  trainingExp: number;
  eggGroups: string[];

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

  // Player info (for player characters)
  playedBy?: string;  // Player's real name
  age?: number;
  gender?: string;    // 'Male', 'Female', 'Other'
  height?: number;    // in cm
  weight?: number;    // in kg

  // Stats
  level: number;
  stats: Stats;
  currentHp: number;
  maxHp: number;

  // Classes, Skills, Features, Edges
  trainerClasses: string[];  // Class names
  skills: Record<string, SkillRank>;  // { skillName: rank }
  features: string[];  // Feature names
  edges: string[];     // Edge names

  // Pokemon team
  pokemonIds: string[];
  pokemon?: Pokemon[];  // Linked Pokemon (when fetched with relation)
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

  // Background info
  background?: string;
  personality?: string;
  goals?: string;

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

  // VTT Position (grid coordinates)
  position?: GridPosition;
  tokenSize: number; // 1 = 1x1, 2 = 2x2 (for large Pokemon)

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

  // VTT Grid configuration
  gridConfig: GridConfig;

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
  | { type: 'encounter_unserved'; data: { encounterId: string } }
  | { type: 'movement_preview'; data: MovementPreview | null };

// Movement preview for broadcasting to group view
export interface MovementPreview {
  combatantId: string;
  fromPosition: GridPosition;
  toPosition: GridPosition;
  distance: number;
  isValid: boolean;
}

// Encounter history snapshot for undo/redo
export interface EncounterSnapshot {
  id: string;
  timestamp: Date;
  actionName: string;
  state: Encounter;
}

// ============================================
// SPECIES DATA (From Database)
// ============================================

export interface SpeciesData {
  id: string;
  name: string;
  type1: string;
  type2?: string | null;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpAtk: number;
  baseSpDef: number;
  baseSpeed: number;
  abilities: string; // JSON array of ability names
  eggGroups: string; // JSON array
  evolutionStage: number;
  // Movement capabilities (for VTT)
  overland: number;
  swim: number;
  sky: number;
  burrow: number;
  levitate: number;
  teleport: number;
}

// ============================================
// ENCOUNTER TABLE SYSTEM (Habitats)
// ============================================

// Rarity presets with standard weights
export type RarityPreset = 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary';

export const RARITY_WEIGHTS: Record<RarityPreset, number> = {
  'common': 10,
  'uncommon': 5,
  'rare': 3,
  'very-rare': 1,
  'legendary': 0.1,
};

// Population density tiers for encounter tables
export type DensityTier = 'sparse' | 'moderate' | 'dense' | 'abundant';

export const DENSITY_RANGES: Record<DensityTier, { min: number; max: number }> = {
  sparse: { min: 2, max: 4 },
  moderate: { min: 4, max: 8 },
  dense: { min: 8, max: 12 },
  abundant: { min: 12, max: 16 },
};

// Level range for encounter generation
export interface LevelRange {
  min: number;
  max: number;
}

// Entry in an encounter table (Pokemon + weight)
export interface EncounterTableEntry {
  id: string;
  speciesId: string;
  speciesName: string;  // Denormalized for display
  weight: number;
  levelRange?: LevelRange; // Override table default if set
}

// Encounter Table (a.k.a. Habitat)
export interface EncounterTable {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  levelRange: LevelRange;
  density: DensityTier;
  entries: EncounterTableEntry[];
  modifications: TableModification[];
  createdAt: Date;
  updatedAt: Date;
}

// Modification entry (override, add, or remove from parent)
export interface ModificationEntry {
  id: string;
  speciesName: string;
  weight?: number;      // If set, overrides parent weight (or adds new)
  remove: boolean;      // If true, exclude from table
  levelRange?: LevelRange;
}

// Table Modification (a.k.a. Sub-habitat)
export interface TableModification {
  id: string;
  name: string;
  description?: string;
  parentTableId: string;
  levelRange?: LevelRange; // Override parent if set
  densityMultiplier: number; // Scales parent density (0.5 = half, 2.0 = double)
  entries: ModificationEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// Resolved table entry (after applying modifications)
export interface ResolvedTableEntry {
  speciesName: string;
  speciesId?: string;
  weight: number;
  levelRange: LevelRange;
  source: 'parent' | 'modification' | 'added';
}

// ============================================
// ENCOUNTER TEMPLATE LIBRARY
// ============================================

// Combatant configuration for template (simplified, no runtime state)
export interface TemplateCombatant {
  type: 'pokemon' | 'human';
  entityId?: string;     // Reference to existing entity (optional)
  speciesOrName: string; // Species name (Pokemon) or character name (Human)
  level: number;
  side: CombatSide;
  position?: GridPosition;
}

// Saved encounter template
export interface EncounterTemplate {
  id: string;
  name: string;
  description?: string;
  battleType: BattleType;
  combatants: TemplateCombatant[];
  gridConfig?: Partial<GridConfig>;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// APP SETTINGS
// ============================================

// Damage calculation mode
export type DamageMode = 'set' | 'rolled';

// App-wide settings
export interface AppSettings {
  damageMode: DamageMode;
  defaultGridWidth: number;
  defaultGridHeight: number;
  defaultCellSize: number;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  damageMode: 'rolled',
  defaultGridWidth: 20,
  defaultGridHeight: 15,
  defaultCellSize: 40,
};

// ============================================
// WILD ENCOUNTER GENERATION
// ============================================

// Options for generating a wild encounter
export interface WildEncounterOptions {
  tableId: string;
  modificationId?: string;  // Optional sub-habitat
  count?: number;           // Optional override - if not set, uses density-based calculation
  levelRange?: LevelRange;  // Override table default
  allowDuplicates: boolean;
}

// Generated Pokemon (preview before adding to encounter)
export interface GeneratedPokemon {
  speciesName: string;
  level: number;
  weight: number;          // Weight that led to selection (for display)
  source: 'parent' | 'modification' | 'added';
  rerolled: boolean;       // Whether user rerolled this slot
}

// Result of wild encounter generation
export interface WildEncounterResult {
  pokemon: GeneratedPokemon[];
  tableUsed: string;
  modificationUsed?: string;
  levelRange: LevelRange;
}
