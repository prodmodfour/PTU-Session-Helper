// Type guards for discriminating between entity types

import type { Pokemon, HumanCharacter } from './character';

/**
 * Type guard to check if an entity is a Pokemon
 * Pokemon have a 'species' property that HumanCharacter doesn't have
 */
export function isPokemon(entity: Pokemon | HumanCharacter): entity is Pokemon {
  return 'species' in entity;
}

/**
 * Type guard to check if an entity is a HumanCharacter
 * HumanCharacter has 'characterType' property that Pokemon doesn't have
 */
export function isHumanCharacter(entity: Pokemon | HumanCharacter): entity is HumanCharacter {
  return 'characterType' in entity;
}

/**
 * Get display name for any entity
 */
export function getEntityDisplayName(entity: Pokemon | HumanCharacter): string {
  if (isPokemon(entity)) {
    return entity.nickname || entity.species;
  }
  return entity.name;
}

/**
 * Get entity type string
 */
export function getEntityType(entity: Pokemon | HumanCharacter): 'pokemon' | 'human' {
  return isPokemon(entity) ? 'pokemon' : 'human';
}
