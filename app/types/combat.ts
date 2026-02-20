// Combat-related types for PTU 1.05

// Status conditions (PTU 1.05)
export type StatusCondition =
  | 'Burned' | 'Frozen' | 'Paralyzed' | 'Poisoned' | 'Badly Poisoned'
  | 'Asleep' | 'Bad Sleep' | 'Confused' | 'Flinched' | 'Infatuated' | 'Cursed'
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
// trainer_declaration: trainers declare actions, lowest speed first
// trainer_resolution: trainers resolve actions, highest speed first
// pokemon: pokemon act, highest speed first
export type TurnPhase = 'trainer_declaration' | 'trainer_resolution' | 'pokemon';

// Stage modifiers (-6 to +6). Three distinct PTU mechanics sharing the same range:
// - Combat Stages (atk/def/spA/spD/spe): apply multiplier table to stats (+20%/-10% per stage)
// - Accuracy: additive modifier applied directly to accuracy rolls (PTU p.234)
// - Evasion: additive bonus from moves/effects, stacks on top of stat-derived evasion (PTU p.234)
export interface StageModifiers {
  /** Combat Stage — multiplier applied to Attack stat */
  attack: number;
  /** Combat Stage — multiplier applied to Defense stat (also affects Physical Evasion) */
  defense: number;
  /** Combat Stage — multiplier applied to Special Attack stat */
  specialAttack: number;
  /** Combat Stage — multiplier applied to Special Defense stat (also affects Special Evasion) */
  specialDefense: number;
  /** Combat Stage — multiplier applied to Speed stat (also affects Speed Evasion + movement) */
  speed: number;
  /** Additive modifier applied directly to accuracy rolls (NOT a multiplier) */
  accuracy: number;
  /** Additive evasion bonus from moves/effects — stacks on top of stat-derived evasion (NOT a multiplier) */
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
