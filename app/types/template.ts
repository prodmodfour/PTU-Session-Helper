// Encounter template types

import type { GridPosition, GridConfig } from './spatial';
import type { CombatSide, BattleType } from './combat';

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
