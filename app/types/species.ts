// Species data types (from database)

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
