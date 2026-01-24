import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Weight mapping for rarity
const WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  veryRare: 5
}

// All species we need for these tables
const SPECIES_DATA: Array<{
  name: string
  type1: string
  type2?: string
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  abilities: string[]
  eggGroups: string[]
  overland?: number
  swim?: number
  sky?: number
}> = [
  // Forest Pokemon
  { name: 'Nickit', type1: 'Dark', baseHp: 40, baseAttack: 28, baseDefense: 32, baseSpAtk: 47, baseSpDef: 52, baseSpeed: 50, abilities: ['Run Away', 'Unburden', 'Stakeout'], eggGroups: ['Field'], overland: 6 },
  { name: 'Smoliv', type1: 'Grass', type2: 'Normal', baseHp: 41, baseAttack: 35, baseDefense: 45, baseSpAtk: 58, baseSpDef: 51, baseSpeed: 30, abilities: ['Early Bird', 'Harvest'], eggGroups: ['Grass'], overland: 4 },
  { name: 'Cutiefly', type1: 'Bug', type2: 'Fairy', baseHp: 40, baseAttack: 45, baseDefense: 40, baseSpAtk: 55, baseSpDef: 40, baseSpeed: 84, abilities: ['Honey Gather', 'Shield Dust', 'Sweet Veil'], eggGroups: ['Bug', 'Fairy'], overland: 3, sky: 6 },
  { name: 'Skorupi', type1: 'Poison', type2: 'Bug', baseHp: 40, baseAttack: 50, baseDefense: 90, baseSpAtk: 30, baseSpDef: 55, baseSpeed: 65, abilities: ['Battle Armor', 'Sniper', 'Keen Eye'], eggGroups: ['Bug', 'Water 3'], overland: 5 },
  { name: 'Hoothoot', type1: 'Normal', type2: 'Flying', baseHp: 60, baseAttack: 30, baseDefense: 30, baseSpAtk: 36, baseSpDef: 56, baseSpeed: 50, abilities: ['Insomnia', 'Keen Eye', 'Tinted Lens'], eggGroups: ['Flying'], overland: 2, sky: 4 },
  { name: 'Shroomish', type1: 'Grass', baseHp: 60, baseAttack: 40, baseDefense: 60, baseSpAtk: 40, baseSpDef: 60, baseSpeed: 35, abilities: ['Effect Spore', 'Poison Heal', 'Quick Feet'], eggGroups: ['Fairy', 'Grass'], overland: 4 },
  { name: 'Sewaddle', type1: 'Bug', type2: 'Grass', baseHp: 45, baseAttack: 53, baseDefense: 70, baseSpAtk: 40, baseSpDef: 60, baseSpeed: 42, abilities: ['Swarm', 'Chlorophyll', 'Overcoat'], eggGroups: ['Bug'], overland: 4 },
  { name: 'Seedot', type1: 'Grass', baseHp: 40, baseAttack: 40, baseDefense: 50, baseSpAtk: 30, baseSpDef: 30, baseSpeed: 30, abilities: ['Chlorophyll', 'Early Bird', 'Pickpocket'], eggGroups: ['Field', 'Grass'], overland: 4 },
  { name: 'Phantump', type1: 'Ghost', type2: 'Grass', baseHp: 43, baseAttack: 70, baseDefense: 48, baseSpAtk: 50, baseSpDef: 60, baseSpeed: 38, abilities: ['Natural Cure', 'Frisk', 'Harvest'], eggGroups: ['Grass', 'Amorphous'], overland: 4 },
  { name: 'Vulpix', type1: 'Fire', baseHp: 38, baseAttack: 41, baseDefense: 40, baseSpAtk: 50, baseSpDef: 65, baseSpeed: 65, abilities: ['Flash Fire', 'Drought'], eggGroups: ['Field'], overland: 6 },
  { name: 'Heracross', type1: 'Bug', type2: 'Fighting', baseHp: 80, baseAttack: 125, baseDefense: 75, baseSpAtk: 40, baseSpDef: 95, baseSpeed: 85, abilities: ['Swarm', 'Guts', 'Moxie'], eggGroups: ['Bug'], overland: 5, sky: 4 },
  { name: 'Vespiquen', type1: 'Bug', type2: 'Flying', baseHp: 70, baseAttack: 80, baseDefense: 102, baseSpAtk: 80, baseSpDef: 102, baseSpeed: 40, abilities: ['Pressure', 'Unnerve'], eggGroups: ['Bug'], overland: 4, sky: 6 },

  // Forest Edge Pokemon
  { name: 'Lillipup', type1: 'Normal', baseHp: 45, baseAttack: 60, baseDefense: 45, baseSpAtk: 25, baseSpDef: 45, baseSpeed: 55, abilities: ['Vital Spirit', 'Pickup', 'Run Away'], eggGroups: ['Field'], overland: 5 },
  { name: 'Buneary', type1: 'Normal', baseHp: 55, baseAttack: 66, baseDefense: 44, baseSpAtk: 44, baseSpDef: 56, baseSpeed: 85, abilities: ['Run Away', 'Klutz', 'Limber'], eggGroups: ['Field', 'Human-Like'], overland: 6 },
  { name: 'Eevee', type1: 'Normal', baseHp: 55, baseAttack: 55, baseDefense: 50, baseSpAtk: 45, baseSpDef: 65, baseSpeed: 55, abilities: ['Run Away', 'Adaptability', 'Anticipation'], eggGroups: ['Field'], overland: 6 },
  { name: 'Zorua', type1: 'Dark', baseHp: 40, baseAttack: 65, baseDefense: 40, baseSpAtk: 80, baseSpDef: 40, baseSpeed: 65, abilities: ['Illusion'], eggGroups: ['Field'], overland: 6 },

  // River Pokemon
  { name: 'Magikarp', type1: 'Water', baseHp: 20, baseAttack: 10, baseDefense: 55, baseSpAtk: 15, baseSpDef: 20, baseSpeed: 80, abilities: ['Swift Swim', 'Rattled'], eggGroups: ['Water 2', 'Dragon'], swim: 6 },
  { name: 'Goldeen', type1: 'Water', baseHp: 45, baseAttack: 67, baseDefense: 60, baseSpAtk: 35, baseSpDef: 50, baseSpeed: 63, abilities: ['Swift Swim', 'Water Veil', 'Lightning Rod'], eggGroups: ['Water 2'], swim: 6 },
  { name: 'Tympole', type1: 'Water', baseHp: 50, baseAttack: 50, baseDefense: 40, baseSpAtk: 50, baseSpDef: 40, baseSpeed: 64, abilities: ['Swift Swim', 'Hydration', 'Water Absorb'], eggGroups: ['Water 1'], overland: 3, swim: 5 },
  { name: 'Barboach', type1: 'Water', type2: 'Ground', baseHp: 50, baseAttack: 48, baseDefense: 43, baseSpAtk: 46, baseSpDef: 41, baseSpeed: 60, abilities: ['Oblivious', 'Anticipation', 'Hydration'], eggGroups: ['Water 2'], swim: 6 },
  { name: 'Corphish', type1: 'Water', baseHp: 43, baseAttack: 80, baseDefense: 65, baseSpAtk: 50, baseSpDef: 35, baseSpeed: 35, abilities: ['Hyper Cutter', 'Shell Armor', 'Adaptability'], eggGroups: ['Water 1', 'Water 3'], overland: 4, swim: 5 },

  // Castle Pokemon
  { name: 'Yamask', type1: 'Ghost', baseHp: 38, baseAttack: 30, baseDefense: 85, baseSpAtk: 55, baseSpDef: 65, baseSpeed: 30, abilities: ['Mummy'], eggGroups: ['Mineral', 'Amorphous'], overland: 3 },
  { name: 'Honedge', type1: 'Steel', type2: 'Ghost', baseHp: 45, baseAttack: 80, baseDefense: 100, baseSpAtk: 35, baseSpDef: 37, baseSpeed: 28, abilities: ['No Guard'], eggGroups: ['Mineral'], overland: 4 },
  { name: 'Houndour', type1: 'Dark', type2: 'Fire', baseHp: 45, baseAttack: 60, baseDefense: 30, baseSpAtk: 80, baseSpDef: 50, baseSpeed: 65, abilities: ['Early Bird', 'Flash Fire', 'Unnerve'], eggGroups: ['Field'], overland: 6 },
  { name: 'Murkrow', type1: 'Dark', type2: 'Flying', baseHp: 60, baseAttack: 85, baseDefense: 42, baseSpAtk: 85, baseSpDef: 42, baseSpeed: 91, abilities: ['Insomnia', 'Super Luck', 'Prankster'], eggGroups: ['Flying'], overland: 3, sky: 7 },

  // Aqueduct Pokemon
  { name: 'Bidoof', type1: 'Normal', baseHp: 59, baseAttack: 45, baseDefense: 40, baseSpAtk: 35, baseSpDef: 40, baseSpeed: 31, abilities: ['Simple', 'Unaware', 'Moody'], eggGroups: ['Water 1', 'Field'], overland: 4, swim: 4 },
  { name: 'Bibarel', type1: 'Normal', type2: 'Water', baseHp: 79, baseAttack: 85, baseDefense: 60, baseSpAtk: 55, baseSpDef: 60, baseSpeed: 71, abilities: ['Simple', 'Unaware', 'Moody'], eggGroups: ['Water 1', 'Field'], overland: 5, swim: 6 },
  { name: 'Alolan Grimer', type1: 'Poison', type2: 'Dark', baseHp: 80, baseAttack: 80, baseDefense: 50, baseSpAtk: 40, baseSpDef: 50, baseSpeed: 25, abilities: ['Poison Touch', 'Gluttony', 'Power of Alchemy'], eggGroups: ['Amorphous'], overland: 4 },
  { name: 'Stunfisk', type1: 'Ground', type2: 'Electric', baseHp: 109, baseAttack: 66, baseDefense: 84, baseSpAtk: 81, baseSpDef: 99, baseSpeed: 32, abilities: ['Static', 'Limber', 'Sand Veil'], eggGroups: ['Water 1', 'Amorphous'], overland: 3, swim: 4 },
  { name: 'Wooper', type1: 'Water', type2: 'Ground', baseHp: 55, baseAttack: 45, baseDefense: 45, baseSpAtk: 25, baseSpDef: 25, baseSpeed: 15, abilities: ['Damp', 'Water Absorb', 'Unaware'], eggGroups: ['Water 1', 'Field'], overland: 3, swim: 4 },
  { name: 'Dwebble', type1: 'Bug', type2: 'Rock', baseHp: 50, baseAttack: 65, baseDefense: 85, baseSpAtk: 35, baseSpDef: 35, baseSpeed: 55, abilities: ['Sturdy', 'Shell Armor', 'Weak Armor'], eggGroups: ['Bug', 'Mineral'], overland: 4 },
  { name: 'Rattata', type1: 'Normal', baseHp: 30, baseAttack: 56, baseDefense: 35, baseSpAtk: 25, baseSpDef: 35, baseSpeed: 72, abilities: ['Run Away', 'Guts', 'Hustle'], eggGroups: ['Field'], overland: 5 },
  { name: 'Croagunk', type1: 'Poison', type2: 'Fighting', baseHp: 48, baseAttack: 61, baseDefense: 40, baseSpAtk: 61, baseSpDef: 40, baseSpeed: 50, abilities: ['Anticipation', 'Dry Skin', 'Poison Touch'], eggGroups: ['Human-Like'], overland: 5 },
  { name: 'Clauncher', type1: 'Water', baseHp: 50, baseAttack: 53, baseDefense: 62, baseSpAtk: 58, baseSpDef: 63, baseSpeed: 44, abilities: ['Mega Launcher'], eggGroups: ['Water 1', 'Water 3'], swim: 5 },
  { name: 'Sableye', type1: 'Dark', type2: 'Ghost', baseHp: 50, baseAttack: 75, baseDefense: 75, baseSpAtk: 65, baseSpDef: 65, baseSpeed: 50, abilities: ['Keen Eye', 'Stall', 'Prankster'], eggGroups: ['Human-Like'], overland: 4 },

  // Town Pokemon
  { name: 'Combee', type1: 'Bug', type2: 'Flying', baseHp: 30, baseAttack: 30, baseDefense: 42, baseSpAtk: 30, baseSpDef: 42, baseSpeed: 70, abilities: ['Honey Gather', 'Hustle'], eggGroups: ['Bug'], overland: 2, sky: 5 },

  // Road Pokemon
  { name: 'Poochyena', type1: 'Dark', baseHp: 35, baseAttack: 55, baseDefense: 35, baseSpAtk: 30, baseSpDef: 30, baseSpeed: 35, abilities: ['Run Away', 'Quick Feet', 'Rattled'], eggGroups: ['Field'], overland: 5 },
  { name: 'Zigzagoon', type1: 'Normal', baseHp: 38, baseAttack: 30, baseDefense: 41, baseSpAtk: 30, baseSpDef: 41, baseSpeed: 60, abilities: ['Pickup', 'Gluttony', 'Quick Feet'], eggGroups: ['Field'], overland: 5 },
  { name: 'Rookidee', type1: 'Flying', baseHp: 38, baseAttack: 47, baseDefense: 35, baseSpAtk: 33, baseSpDef: 35, baseSpeed: 57, abilities: ['Keen Eye', 'Unnerve', 'Big Pecks'], eggGroups: ['Flying'], overland: 3, sky: 5 },
]

interface TableDefinition {
  name: string
  description: string
  levelMin: number
  levelMax: number
  entries: Array<{ species: string; weight: number; levelMin?: number; levelMax?: number }>
  modifications?: Array<{
    name: string
    description: string
    levelMin?: number
    levelMax?: number
    entries: Array<{ species: string; weight?: number; remove?: boolean; levelMin?: number; levelMax?: number }>
  }>
}

const ENCOUNTER_TABLES: TableDefinition[] = [
  // ==========================================
  // THICKERBY FOREST
  // ==========================================
  {
    name: 'Thickerby Forest - General',
    description: 'A dim, berry-thick woodland with lots of undergrowth and insects.',
    levelMin: 5,
    levelMax: 15,
    entries: [
      // Common
      { species: 'Nickit', weight: WEIGHTS.common },
      { species: 'Smoliv', weight: WEIGHTS.common },
      { species: 'Cutiefly', weight: WEIGHTS.common },
      { species: 'Skorupi', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Hoothoot', weight: WEIGHTS.uncommon },
      { species: 'Shroomish', weight: WEIGHTS.uncommon },
      { species: 'Sewaddle', weight: WEIGHTS.uncommon },
      { species: 'Seedot', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Phantump', weight: WEIGHTS.rare },
      { species: 'Vulpix', weight: WEIGHTS.rare },
      { species: 'Heracross', weight: WEIGHTS.rare },
      { species: 'Vespiquen', weight: WEIGHTS.veryRare }, // Single encounter / guardian vibe
    ],
    modifications: [
      {
        name: 'Night',
        description: 'Nocturnal encounters in the forest',
        entries: [
          { species: 'Hoothoot', weight: WEIGHTS.common }, // Boost at night
        ]
      }
    ]
  },
  {
    name: 'Thickerby Forest - Forest Edge',
    description: 'Near the road, scattered hedges and scrubby trees.',
    levelMin: 3,
    levelMax: 10,
    entries: [
      // Common
      { species: 'Nickit', weight: WEIGHTS.common },
      { species: 'Smoliv', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Lillipup', weight: WEIGHTS.uncommon },
      { species: 'Buneary', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Eevee', weight: WEIGHTS.veryRare },
      { species: 'Zorua', weight: WEIGHTS.veryRare },
    ],
    modifications: [
      {
        name: 'Day',
        description: 'Daytime encounters at the forest edge',
        entries: [
          { species: 'Eevee', weight: WEIGHTS.rare }, // More likely during day
          { species: 'Zorua', remove: true }, // Remove at day
        ]
      },
      {
        name: 'Dusk/Night',
        description: 'Evening and nighttime encounters',
        entries: [
          { species: 'Zorua', weight: WEIGHTS.rare }, // More likely at dusk/night
          { species: 'Eevee', remove: true }, // Remove at night
        ]
      }
    ]
  },
  {
    name: 'Thickerby Forest - River',
    description: 'Fishing, surfing, and riverbank encounters.',
    levelMin: 5,
    levelMax: 15,
    entries: [
      // Common
      { species: 'Magikarp', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Goldeen', weight: WEIGHTS.uncommon },
      { species: 'Tympole', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Barboach', weight: WEIGHTS.rare },
      { species: 'Corphish', weight: WEIGHTS.rare },
    ]
  },

  // ==========================================
  // PHASMOSA'S CASTLE
  // ==========================================
  {
    name: "Phasmosa's Castle - General",
    description: 'A haunted keep: old metal, old stone, old memories. Courtyards and halls.',
    levelMin: 10,
    levelMax: 20,
    entries: [
      // Common
      { species: 'Yamask', weight: WEIGHTS.common },
      { species: 'Honedge', weight: WEIGHTS.common },
    ]
  },
  {
    name: "Phasmosa's Castle - Grounds",
    description: 'The overgrown outer ring of the castle.',
    levelMin: 8,
    levelMax: 18,
    entries: [
      // Common
      { species: 'Yamask', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Houndour', weight: WEIGHTS.uncommon },
      { species: 'Skorupi', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Murkrow', weight: WEIGHTS.rare },
    ]
  },

  // ==========================================
  // GREYWATER AQUEDUCT
  // ==========================================
  {
    name: 'Greywater Aqueduct',
    description: 'Old stone channels carrying river water uphill to the castle cisterns and moat. Damp, echoing, and perfect for smell/track themed encounters.',
    levelMin: 8,
    levelMax: 18,
    entries: [
      // Common
      { species: 'Bidoof', weight: WEIGHTS.common },
      { species: 'Bibarel', weight: WEIGHTS.common },
      { species: 'Alolan Grimer', weight: WEIGHTS.common },
      { species: 'Stunfisk', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Wooper', weight: WEIGHTS.uncommon },
      { species: 'Barboach', weight: WEIGHTS.uncommon },
      { species: 'Dwebble', weight: WEIGHTS.uncommon },
      { species: 'Rattata', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Croagunk', weight: WEIGHTS.rare },
      { species: 'Clauncher', weight: WEIGHTS.rare },
      { species: 'Sableye', weight: WEIGHTS.rare },
    ],
    modifications: [
      {
        name: 'Maintenance Tunnels',
        description: 'The darker maintenance tunnels beneath the aqueduct',
        entries: [
          { species: 'Sableye', weight: WEIGHTS.uncommon }, // More common in tunnels
        ]
      }
    ]
  },

  // ==========================================
  // BRAMBLEWICK (Town 1)
  // ==========================================
  {
    name: 'Bramblewick - General',
    description: 'A small timber-and-thatch village at the forest\'s edge. Known for berry preserves and honey. Lanes, gardens, and berry stalls.',
    levelMin: 3,
    levelMax: 10,
    entries: [
      // Common
      { species: 'Smoliv', weight: WEIGHTS.common },
      { species: 'Cutiefly', weight: WEIGHTS.common },
      { species: 'Lillipup', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Buneary', weight: WEIGHTS.uncommon },
      { species: 'Shroomish', weight: WEIGHTS.uncommon },
      { species: 'Hoothoot', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Vulpix', weight: WEIGHTS.rare },
      { species: 'Vespiquen', weight: WEIGHTS.veryRare }, // Single encounter, apiary guardian
    ],
    modifications: [
      {
        name: 'Night',
        description: 'Nighttime in the village',
        entries: [
          { species: 'Hoothoot', weight: WEIGHTS.common }, // Boost at night
        ]
      }
    ]
  },
  {
    name: 'Bramblewick - Backyards & Apiaries',
    description: 'Behind homes, near the bee hives and woodpiles.',
    levelMin: 3,
    levelMax: 10,
    entries: [
      // Common
      { species: 'Cutiefly', weight: WEIGHTS.common },
      { species: 'Sewaddle', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Combee', weight: WEIGHTS.uncommon },
      { species: 'Skorupi', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Heracross', weight: WEIGHTS.rare },
    ]
  },

  // ==========================================
  // RIVERMERE (Town 2)
  // ==========================================
  {
    name: 'Rivermere - General',
    description: 'A stony riverside town with an old bridge and waterwheels. Streets, bridge approaches, and market.',
    levelMin: 5,
    levelMax: 12,
    entries: [
      // Common
      { species: 'Nickit', weight: WEIGHTS.common },
      { species: 'Tympole', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Rattata', weight: WEIGHTS.uncommon },
      { species: 'Hoothoot', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Murkrow', weight: WEIGHTS.rare },
      { species: 'Eevee', weight: WEIGHTS.veryRare },
    ],
    modifications: [
      {
        name: 'Day',
        description: 'Daytime in town, near quiet courtyards',
        entries: [
          { species: 'Eevee', weight: WEIGHTS.rare },
          { species: 'Murkrow', remove: true },
        ]
      },
      {
        name: 'Night',
        description: 'Nighttime encounters',
        entries: [
          { species: 'Hoothoot', weight: WEIGHTS.common },
          { species: 'Murkrow', weight: WEIGHTS.uncommon },
          { species: 'Eevee', remove: true },
        ]
      }
    ]
  },
  {
    name: 'Rivermere - Docks & Waterwheels',
    description: 'The riverfront, docks, and water wheel areas.',
    levelMin: 5,
    levelMax: 15,
    entries: [
      // Common
      { species: 'Magikarp', weight: WEIGHTS.common },
      { species: 'Tympole', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Goldeen', weight: WEIGHTS.uncommon },
      { species: 'Corphish', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Barboach', weight: WEIGHTS.rare },
      { species: 'Clauncher', weight: WEIGHTS.veryRare }, // Only where wheel-runoff churns
    ]
  },

  // ==========================================
  // ROADS
  // ==========================================
  {
    name: 'Bramblewick Road',
    description: 'The road from Bramblewick to the forest. Hedgerows and verge trees.',
    levelMin: 3,
    levelMax: 10,
    entries: [
      // Common
      { species: 'Nickit', weight: WEIGHTS.common },
      { species: 'Lillipup', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Buneary', weight: WEIGHTS.uncommon },
      { species: 'Poochyena', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Zigzagoon', weight: WEIGHTS.rare },
      { species: 'Rookidee', weight: WEIGHTS.rare },
    ]
  },
  {
    name: 'Rivermere Causeway',
    description: 'The road from Rivermere toward the river and castle approach. Puddles and drainage ditches.',
    levelMin: 5,
    levelMax: 12,
    entries: [
      // Common
      { species: 'Nickit', weight: WEIGHTS.common },
      { species: 'Tympole', weight: WEIGHTS.common },
      // Uncommon
      { species: 'Stunfisk', weight: WEIGHTS.uncommon },
      { species: 'Hoothoot', weight: WEIGHTS.uncommon },
      // Rare
      { species: 'Corphish', weight: WEIGHTS.rare },
      { species: 'Murkrow', weight: WEIGHTS.rare },
    ],
    modifications: [
      {
        name: 'Castle Shadow',
        description: 'Where the castle\'s shadow lingers longest',
        entries: [
          { species: 'Murkrow', weight: WEIGHTS.uncommon },
        ]
      },
      {
        name: 'Night',
        description: 'Nighttime on the causeway',
        entries: [
          { species: 'Hoothoot', weight: WEIGHTS.common },
          { species: 'Murkrow', weight: WEIGHTS.uncommon },
        ]
      }
    ]
  },
]

async function main() {
  console.log('Seeding encounter tables...')

  // First, ensure all species exist
  console.log('Creating/updating species data...')
  for (const species of SPECIES_DATA) {
    await prisma.speciesData.upsert({
      where: { name: species.name },
      update: {},
      create: {
        name: species.name,
        type1: species.type1,
        type2: species.type2 || null,
        baseHp: species.baseHp,
        baseAttack: species.baseAttack,
        baseDefense: species.baseDefense,
        baseSpAtk: species.baseSpAtk,
        baseSpDef: species.baseSpDef,
        baseSpeed: species.baseSpeed,
        abilities: JSON.stringify(species.abilities),
        eggGroups: JSON.stringify(species.eggGroups),
        overland: species.overland || 5,
        swim: species.swim || 0,
        sky: species.sky || 0,
      }
    })
  }
  console.log(`Created/updated ${SPECIES_DATA.length} species`)

  // Get all species IDs for lookup
  const allSpecies = await prisma.speciesData.findMany()
  const speciesMap = new Map(allSpecies.map(s => [s.name, s.id]))

  // Create encounter tables
  console.log('Creating encounter tables...')
  for (const tableDef of ENCOUNTER_TABLES) {
    // Check if table already exists
    const existing = await prisma.encounterTable.findFirst({
      where: { name: tableDef.name }
    })

    if (existing) {
      console.log(`  Skipping "${tableDef.name}" (already exists)`)
      continue
    }

    // Create the table
    const table = await prisma.encounterTable.create({
      data: {
        name: tableDef.name,
        description: tableDef.description,
        levelMin: tableDef.levelMin,
        levelMax: tableDef.levelMax,
      }
    })

    // Add entries
    for (const entry of tableDef.entries) {
      const speciesId = speciesMap.get(entry.species)
      if (!speciesId) {
        console.warn(`    Warning: Species "${entry.species}" not found, skipping`)
        continue
      }

      await prisma.encounterTableEntry.create({
        data: {
          tableId: table.id,
          speciesId: speciesId,
          weight: entry.weight,
          levelMin: entry.levelMin || null,
          levelMax: entry.levelMax || null,
        }
      })
    }

    // Add modifications if any
    if (tableDef.modifications) {
      for (const modDef of tableDef.modifications) {
        const modification = await prisma.tableModification.create({
          data: {
            parentTableId: table.id,
            name: modDef.name,
            description: modDef.description,
            levelMin: modDef.levelMin || null,
            levelMax: modDef.levelMax || null,
          }
        })

        // Add modification entries
        for (const entry of modDef.entries) {
          await prisma.modificationEntry.create({
            data: {
              modificationId: modification.id,
              speciesName: entry.species,
              weight: entry.weight || null,
              remove: entry.remove || false,
              levelMin: entry.levelMin || null,
              levelMax: entry.levelMax || null,
            }
          })
        }
      }
    }

    console.log(`  Created "${tableDef.name}" with ${tableDef.entries.length} entries`)
  }

  console.log('Encounter tables seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
