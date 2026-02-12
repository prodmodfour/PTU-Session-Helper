// Character types (Pokemon and Human)

import type { StatusCondition, StageModifiers, ActionType, MoveFrequency } from './combat';

// Pokemon Types
export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

// Character type
export type CharacterType = 'player' | 'npc' | 'trainer';

// Pokemon origin - how the Pokemon was created
export type PokemonOrigin = 'manual' | 'wild' | 'template' | 'import' | 'captured';

// Skill rank (PTU)
export type SkillRank = 'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master';

// Base stats structure
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

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

// Inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  effect?: string;
}

// Pokemon data
export interface Pokemon {
  id: string;
  species: string;
  nickname: string | null;
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

  // Library & categorization
  isInLibrary: boolean;
  origin: PokemonOrigin;
  notes?: string;
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
