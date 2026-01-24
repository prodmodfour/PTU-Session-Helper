import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Hassan and Chompy...')

  // Create Hassan (Trainer)
  const hassan = await prisma.humanCharacter.create({
    data: {
      name: 'Hassan',
      characterType: 'player',
      playedBy: 'Igbunu',
      age: 20,
      gender: 'Male',
      height: 174,
      weight: 85,
      level: 1,
      // Stats from sheet: HP 11, ATK 5, DEF 7, SATK 5, SDEF 7, SPD 11
      hp: 11,
      attack: 5,
      defense: 7,
      specialAttack: 5,
      specialDefense: 7,
      speed: 11,
      currentHp: 45, // Current HP
      maxHp: 45, // Max HP from sheet (derived from HP stat)
      // Trainer Classes
      trainerClasses: JSON.stringify(['Ace Trainer', 'Elite Trainer']),
      // Skills (from sheet - Pathetic=1, Untrained=2, Novice=3, Adept=4)
      skills: JSON.stringify({
        'Acrobatics': 'Untrained',
        'Athletics': 'Untrained',
        'Charm': 'Untrained',
        'Combat': 'Untrained',
        'Command': 'Novice',
        'General Ed': 'Untrained',
        'Medicine Ed': 'Untrained',
        'Occult Ed': 'Pathetic',
        'Pokémon Ed': 'Untrained',
        'Technology Ed': 'Pathetic',
        'Focus': 'Untrained',
        'Guile': 'Untrained',
        'Intimidate': 'Pathetic',
        'Intuition': 'Adept',
        'Perception': 'Novice',
        'Stealth': 'Untrained',
        'Survival': 'Novice'
      }),
      // Features
      features: JSON.stringify([
        'Let Me Help You With That',
        'Capture Specialist',
        'Agility Training',
        'Inspired Training'
      ]),
      // Edges
      edges: JSON.stringify([
        'Instinctive Aptitude',
        'Traveler',
        'Basic Skills [Command]',
        'Basic Skills [Perception]'
      ]),
      isInLibrary: true,
      notes: 'Pokemon Ranger campaign character'
    }
  })

  console.log(`Created Hassan with ID: ${hassan.id}`)

  // Create Chomps (Gible)
  const chomps = await prisma.pokemon.create({
    data: {
      species: 'Gible',
      nickname: 'Chomps',
      level: 10,
      experience: 90,
      // Nature: Jolly (+SPD, -SATK)
      nature: JSON.stringify({
        name: 'Jolly',
        raisedStat: 'speed',
        loweredStat: 'specialAttack'
      }),
      type1: 'Dragon',
      type2: 'Ground',
      // Base stats (Total column from sheet)
      baseHp: 9,
      baseAttack: 15,
      baseDefense: 8,
      baseSpAtk: 2,
      baseSpDef: 6,
      baseSpeed: 11,
      // Current stats (same as base for now)
      currentHp: 47,
      maxHp: 47,
      currentAttack: 15,
      currentDefense: 8,
      currentSpAtk: 2,
      currentSpDef: 6,
      currentSpeed: 11,
      // Abilities
      abilities: JSON.stringify([
        {
          name: 'Sand Veil',
          effect: 'The user gains +1 Evasion. This is increased to +2 Evasion while in a Sandstorm or sandy terrain. While in a Sandstorm, the user and adjacent allies do not lose Hit Points due to the Sandstorm.',
          trigger: 'Static'
        }
      ]),
      // Moves
      moves: JSON.stringify([
        {
          name: 'Tackle',
          type: 'Normal',
          damageClass: 'Physical',
          frequency: 'At-Will',
          ac: 2,
          damageBase: 5,
          range: 'Melee, 1 Target, Dash, Push',
          effect: 'The target is Pushed 2 Meters.',
          contestType: 'Tough',
          contestEffect: 'Steady Performance'
        },
        {
          name: 'Sand Attack',
          type: 'Ground',
          damageClass: 'Status',
          frequency: 'EOT',
          ac: 2,
          damageBase: null,
          range: '2, 1 Target',
          effect: 'The target is Blinded until the end of their next turn.',
          contestType: 'Cute',
          contestEffect: 'Excitement'
        },
        {
          name: 'Dragon Rage',
          type: 'Dragon',
          damageClass: 'Special',
          frequency: 'At-Will',
          ac: 2,
          damageBase: null,
          range: '4, 1 Target',
          effect: 'Dragon Rage causes the target to lose 15 HP. Dragon Rage is Special and interacts with other moves and effects as such.',
          contestType: 'Cool',
          contestEffect: 'Steady Performance'
        }
      ]),
      // Capabilities
      capabilities: JSON.stringify({
        overland: 4,
        swim: 2,
        sky: 0,
        burrow: 4,
        levitate: 0,
        jump: { high: 1, long: 1 },
        power: 3,
        weightClass: 2,
        size: 'Small',
        naturewalk: ['Desert'],
        otherCapabilities: ['Underdog']
      }),
      // Skills (from sheet)
      skills: JSON.stringify({
        'Acrobatics': '2d6+0',
        'Athletics': '2d6+2',
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
        'Perception': '2d6+1',
        'Stealth': '3d6+1',
        'Survival': '2d6+0'
      }),
      // Training
      tutorPoints: 3,
      trainingExp: 10,
      // Egg groups
      eggGroups: JSON.stringify(['Monster', 'Dragon']),
      // Display
      shiny: false,
      gender: 'Male', // Not specified in sheet, defaulting
      // Link to Hassan
      ownerId: hassan.id,
      isInLibrary: true,
      notes: 'Hassan\'s starter Pokemon'
    }
  })

  console.log(`Created Chomps with ID: ${chomps.id}`)
  console.log(`Linked Chomps to Hassan (ownerId: ${hassan.id})`)

  // Verify the link
  const hassanWithPokemon = await prisma.humanCharacter.findUnique({
    where: { id: hassan.id },
    include: { pokemon: true }
  })

  console.log('\nVerification:')
  console.log(`Hassan has ${hassanWithPokemon?.pokemon.length} Pokemon:`)
  hassanWithPokemon?.pokemon.forEach(p => {
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
