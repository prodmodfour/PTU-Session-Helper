import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Marilena (Ilaria) and Iris...')

  // Create Marilena (Trainer)
  const marilena = await prisma.humanCharacter.create({
    data: {
      name: 'Marilena',
      characterType: 'player',
      playedBy: 'Ilaria',
      age: 20,
      gender: 'Female',
      height: 165,
      weight: 60,
      level: 1,
      // Stats from sheet: HP 13, ATK 5, DEF 8, SATK 5, SDEF 9, SPD 7
      hp: 13,
      attack: 5,
      defense: 8,
      specialAttack: 5,
      specialDefense: 9,
      speed: 7,
      currentHp: 51, // Current HP
      maxHp: 51, // Max HP from sheet (derived from HP stat)
      // Trainer Classes
      trainerClasses: JSON.stringify(['Hobbyist', 'Channeler', 'Sage', 'Researcher', 'Witch Hunter']),
      // Skills
      skills: JSON.stringify({
        'Acrobatics': 'Untrained',
        'Athletics': 'Novice',
        'Charm': 'Untrained',
        'Combat': 'Pathetic',
        'Command': 'Untrained',
        'General Ed': 'Novice',
        'Medicine Ed': 'Untrained',
        'Occult Ed': 'Adept',
        'Pokémon Ed': 'Novice',
        'Technology Ed': 'Untrained',
        'Focus': 'Untrained',
        'Guile': 'Pathetic',
        'Intimidate': 'Pathetic',
        'Intuition': 'Novice',
        'Perception': 'Novice',
        'Stealth': 'Untrained',
        'Survival': 'Untrained'
      }),
      // Features
      features: JSON.stringify([
        'Hobbyist',
        'Channeler',
        'Sage',
        'Researcher [Occultism & Paleontology]',
        'Witch Hunter',
        'Psionic Sight',
        'Agility Training'
      ]),
      // Edges
      edges: JSON.stringify([
        'Basic Skills [Athletics]',
        'Basic Skills [General Ed]',
        'Tag Scribe',
        'Basic Skills [Intuition]',
        'Mystic Senses',
        'Basic Skills [Pokemon Ed]',
        'Paleontologist'
      ]),
      isInLibrary: true,
      notes: 'Pokemon Ranger campaign character - Occult researcher'
    }
  })

  console.log(`Created Marilena with ID: ${marilena.id}`)

  // Create Iris (Misdreavus)
  const iris = await prisma.pokemon.create({
    data: {
      species: 'Misdreavus',
      nickname: 'Iris',
      level: 10,
      experience: 90,
      // Nature: Modest (+SATK, -ATK)
      nature: JSON.stringify({
        name: 'Modest',
        raisedStat: 'specialAttack',
        loweredStat: 'attack'
      }),
      type1: 'Ghost',
      type2: null,
      // Base stats (Species column from sheet)
      baseHp: 6,
      baseAttack: 4,
      baseDefense: 6,
      baseSpAtk: 11,
      baseSpDef: 9,
      baseSpeed: 9,
      // Current stats (Total column from sheet)
      currentHp: 44,
      maxHp: 44,
      currentAttack: 4,
      currentDefense: 10,
      currentSpAtk: 16,
      currentSpDef: 13,
      currentSpeed: 14,
      // Abilities
      abilities: JSON.stringify([
        {
          name: 'Levitate',
          effect: 'The Pokémon is immune to the damage and effects of Ground Type Moves, and gains a Levitate Speed of 4, or has existing Levitate Speeds increased by +2. Defensive.',
          trigger: 'Static'
        }
      ]),
      // Moves
      moves: JSON.stringify([
        {
          name: 'Growl',
          type: 'Normal',
          damageClass: 'Status',
          frequency: 'At-Will',
          ac: 2,
          damageBase: null,
          range: 'Burst 1, Friendly, Sonic, Social',
          effect: 'Lower the Attack of all legal targets by -1 CS.',
          contestType: 'Cute',
          contestEffect: 'Excitement'
        },
        {
          name: 'Psywave',
          type: 'Psychic',
          damageClass: 'Special',
          frequency: 'Scene',
          ac: 5,
          damageBase: null,
          range: '6, 1 Target',
          effect: 'Roll 1d4; on 1 the target loses HP equal to half the user\'s Level; on 2 the target loses HP equal to the user\'s Level; on 3 the target loses HP equal to 1.5x the user\'s level; on 4 the target loses HP equal to the user\'s Level doubled. Do not apply weakness or resistance, and do not apply Stats. Do apply Immunity.',
          contestType: 'Smart',
          contestEffect: 'Steady Performance'
        },
        {
          name: 'Spite',
          type: 'Ghost',
          damageClass: 'Status',
          frequency: 'Scene',
          ac: null,
          damageBase: null,
          range: '1 Target, Trigger',
          effect: 'Spite may be used as a Free Action that does not take up a Command whenever the user is hit by a Move. That Move becomes Disabled for the attacker.',
          contestType: 'Tough',
          contestEffect: 'Excitement'
        },
        {
          name: 'Astonish',
          type: 'Ghost',
          damageClass: 'Physical',
          frequency: 'At-Will',
          ac: 2,
          damageBase: 5,
          range: 'Melee, 1 Target',
          effect: 'Astonish Flinches the target on 15+. Once per Scene, if the target is unaware of the user\'s presence, Astonish automatically Flinches.',
          contestType: 'Smart',
          contestEffect: 'Steady Performance'
        }
      ]),
      // Capabilities
      capabilities: JSON.stringify({
        overland: 1,
        swim: 2,
        sky: 0,
        burrow: 0,
        levitate: 5,
        jump: { high: 1, long: 1 },
        power: 2,
        weightClass: 1,
        size: 'Small',
        naturewalk: [],
        otherCapabilities: ['Dead Silent', 'Darkvision', 'Invisibility', 'Phasing', 'Underdog']
      }),
      // Skills
      skills: JSON.stringify({
        'Acrobatics': '1d6+2',
        'Athletics': '1d6+2',
        'Charm': '2d6+0',
        'Combat': '2d6+0',
        'Command': '2d6+0',
        'General Ed': '1d6+0',
        'Medicine Ed': '1d6+0',
        'Occult Ed': '1d6+0',
        'Pokémon Ed': '1d6+0',
        'Technology Ed': '1d6+0',
        'Focus': '2d6+0',
        'Guile': '2d6+0',
        'Intimidate': '2d6+0',
        'Intuition': '2d6+0',
        'Perception': '2d6+0',
        'Stealth': '3d6+0',
        'Survival': '2d6+0'
      }),
      // Training
      tutorPoints: 3,
      trainingExp: 5,
      // Egg groups
      eggGroups: JSON.stringify(['Indeterminate']),
      // Display
      shiny: false,
      gender: 'Female',
      // Link to Marilena
      ownerId: marilena.id,
      isInLibrary: true,
      notes: 'Marilena\'s Pokemon - Ghost type specialist'
    }
  })

  console.log(`Created Iris with ID: ${iris.id}`)
  console.log(`Linked Iris to Marilena (ownerId: ${marilena.id})`)

  // Verify the link
  const marilenaWithPokemon = await prisma.humanCharacter.findUnique({
    where: { id: marilena.id },
    include: { pokemon: true }
  })

  console.log('\nVerification:')
  console.log(`Marilena has ${marilenaWithPokemon?.pokemon.length} Pokemon:`)
  marilenaWithPokemon?.pokemon.forEach(p => {
    console.log(`  - ${p.nickname || p.species} (${p.species}) Lv.${p.level}`)
  })

  console.log('\nSeeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
