// Combat-related types for PTU 1.05

// Status conditions (PTU 1.05)
export type StatusCondition =
  | 'Burned' | 'Frozen' | 'Paralyzed' | 'Poisoned' | 'Badly Poisoned'
  | 'Asleep' | 'Confused' | 'Flinched' | 'Infatuated' | 'Cursed'
  | 'Disabled' | 'Enraged' | 'Suppressed'
  | 'Stuck' | 'Slowed' | 'Trapped' | 'Fainted'
  | 'Tripped' | 'Vulnerable';

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

// PTU Turn Phase (for League battles)
export type TurnPhase = 'trainer' | 'pokemon';

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
