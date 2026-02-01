// Encounter table (habitat) system types

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

// Resolved table entry (after applying modifications)
export interface ResolvedTableEntry {
  speciesName: string;
  speciesId?: string;
  weight: number;
  levelRange: LevelRange;
  source: 'parent' | 'modification' | 'added';
}

// Generated Pokemon (preview before adding to encounter)
export interface GeneratedPokemon {
  speciesName: string;
  level: number;
  weight: number;          // Weight that led to selection (for display)
  source: 'parent' | 'modification' | 'added';
  rerolled: boolean;       // Whether user rerolled this slot
}
