import { describe, it, expect } from 'vitest'
import type { Combatant, Pokemon, PokemonCapabilities, TerrainType } from '~/types'
import {
  getCombatantNaturewalks,
  naturewalkBypassesTerrain,
} from '~/utils/combatantCapabilities'

/**
 * Build a minimal Pokemon combatant stub for testing Naturewalk functions.
 */
function makePokemonCombatant(capabilities?: Partial<PokemonCapabilities>): Combatant {
  const defaultCaps: PokemonCapabilities = {
    overland: 5,
    swim: 0,
    sky: 0,
    burrow: 0,
    levitate: 0,
    jump: { high: 1, long: 1 },
    power: 1,
    weightClass: 1,
    size: 'Small',
    ...capabilities,
  }

  return {
    id: 'pkmn-1',
    type: 'pokemon',
    entityId: 'entity-1',
    side: 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: 1,
    entity: {
      id: 'entity-1',
      types: ['Grass'],
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0,
      },
      capabilities: defaultCaps,
    } as unknown as Pokemon,
  }
}

function makeHumanCombatant(): Combatant {
  return {
    id: 'human-1',
    type: 'human',
    entityId: 'entity-2',
    side: 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: 1,
    entity: {
      id: 'entity-2',
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0,
      },
    } as Combatant['entity'],
  }
}

describe('getCombatantNaturewalks', () => {
  it('should return empty array for human combatant', () => {
    const human = makeHumanCombatant()
    expect(getCombatantNaturewalks(human)).toEqual([])
  })

  it('should return empty array for Pokemon without capabilities', () => {
    const pokemon = makePokemonCombatant()
    // Remove capabilities entirely
    ;(pokemon.entity as any).capabilities = undefined
    expect(getCombatantNaturewalks(pokemon)).toEqual([])
  })

  it('should return empty array for Pokemon without naturewalk or otherCapabilities', () => {
    const pokemon = makePokemonCombatant()
    expect(getCombatantNaturewalks(pokemon)).toEqual([])
  })

  it('should return terrain names from capabilities.naturewalk field', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Grassland'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse Naturewalk from otherCapabilities string with comma separator', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest, Grassland)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse Naturewalk from otherCapabilities string with "and" separator', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest and Grassland)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse single terrain from otherCapabilities', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Ocean)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toEqual(['Ocean'])
  })

  it('should ignore non-Naturewalk entries in otherCapabilities', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Glow', 'Naturewalk (Cave)', 'Firestarter'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toEqual(['Cave'])
  })

  it('should deduplicate when same terrain appears in both sources', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Grassland'],
      otherCapabilities: ['Naturewalk (Forest, Mountain)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    // Forest appears in both, should be deduplicated
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toContain('Mountain')
    expect(result).toHaveLength(3)
  })

  it('should return direct field when otherCapabilities is empty', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Tundra'],
      otherCapabilities: [],
    })
    expect(getCombatantNaturewalks(pokemon)).toEqual(['Tundra'])
  })

  it('should return parsed field when naturewalk is empty', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: [],
      otherCapabilities: ['Naturewalk (Desert)'],
    })
    expect(getCombatantNaturewalks(pokemon)).toEqual(['Desert'])
  })
})

describe('naturewalkBypassesTerrain', () => {
  it('should return false for human combatant', () => {
    const human = makeHumanCombatant()
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(false)
  })

  it('should return false for Pokemon without Naturewalk', () => {
    const pokemon = makePokemonCombatant()
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
  })

  it('should return true when Naturewalk (Forest) matches normal base type', () => {
    // Forest maps to ['normal'] in NATUREWALK_TERRAIN_MAP
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return false when Naturewalk (Ocean) does not match normal base type', () => {
    // Ocean maps to ['water'] — does not include 'normal'
    const pokemon = makePokemonCombatant({
      naturewalk: ['Ocean'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
  })

  it('should return true when Naturewalk (Ocean) matches water base type', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Ocean'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return true when Naturewalk (Wetlands) matches water base type', () => {
    // Wetlands maps to ['water', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Wetlands'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return true when Naturewalk (Wetlands) matches normal base type', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Wetlands'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return true when Naturewalk (Mountain) matches elevated base type', () => {
    // Mountain maps to ['elevated', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Mountain'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'elevated')).toBe(true)
  })

  it('should return true when Naturewalk (Cave) matches earth base type', () => {
    // Cave maps to ['earth', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Cave'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'earth')).toBe(true)
  })

  it('should handle multiple Naturewalk terrains — any match returns true', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Ocean'],
    })
    // Forest maps to ['normal'], Ocean maps to ['water']
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return false for blocking terrain even with Naturewalk', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Mountain', 'Cave', 'Ocean'],
    })
    // Blocking terrain is never bypassed — no Naturewalk maps to 'blocking'
    expect(naturewalkBypassesTerrain(pokemon, 'blocking')).toBe(false)
  })

  it('should handle Naturewalk from otherCapabilities parsed source', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest, Grassland)'],
    })
    // Both Forest and Grassland map to ['normal']
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return false for unrecognized Naturewalk terrain name', () => {
    // An invalid terrain name that is not in NATUREWALK_TERRAIN_MAP
    const pokemon = makePokemonCombatant({
      naturewalk: ['Swamp'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(false)
  })
})
