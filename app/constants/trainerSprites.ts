/**
 * Trainer sprite catalog for character avatars.
 *
 * Sprites are sourced from Pokemon Showdown CDN:
 * https://play.pokemonshowdown.com/sprites/trainers/{key}.png
 *
 * The catalog contains ~180 curated sprites organized into 9 categories
 * relevant to PTU campaigns. Each key maps directly to the Showdown
 * filename without the .png extension.
 */

export interface TrainerSprite {
  key: string      // Showdown filename without .png (e.g., 'acetrainer')
  label: string    // Human-readable label (e.g., 'Ace Trainer')
  category: string // Category key (e.g., 'generic-male')
}

export interface TrainerSpriteCategory {
  key: string
  label: string
}

export const TRAINER_SPRITE_CATEGORIES: TrainerSpriteCategory[] = [
  { key: 'protagonists', label: 'Protagonists' },
  { key: 'gym-leaders', label: 'Gym Leaders' },
  { key: 'elite-champions', label: 'Elite Four & Champions' },
  { key: 'villains', label: 'Villains & Admins' },
  { key: 'grunts', label: 'Team Grunts' },
  { key: 'generic-male', label: 'Generic Male' },
  { key: 'generic-female', label: 'Generic Female' },
  { key: 'specialists', label: 'Specialists' },
  { key: 'other', label: 'Other' },
]

export const TRAINER_SPRITE_CATALOG: TrainerSprite[] = [
  // ========================================
  // Protagonists
  // ========================================
  { key: 'red', label: 'Red', category: 'protagonists' },
  { key: 'leaf', label: 'Leaf', category: 'protagonists' },
  { key: 'ethan', label: 'Ethan', category: 'protagonists' },
  { key: 'lyra', label: 'Lyra', category: 'protagonists' },
  { key: 'brendan', label: 'Brendan', category: 'protagonists' },
  { key: 'may', label: 'May', category: 'protagonists' },
  { key: 'lucas', label: 'Lucas', category: 'protagonists' },
  { key: 'dawn', label: 'Dawn', category: 'protagonists' },
  { key: 'hilbert', label: 'Hilbert', category: 'protagonists' },
  { key: 'hilda', label: 'Hilda', category: 'protagonists' },
  { key: 'nate', label: 'Nate', category: 'protagonists' },
  { key: 'rosa', label: 'Rosa', category: 'protagonists' },
  { key: 'calem', label: 'Calem', category: 'protagonists' },
  { key: 'serena', label: 'Serena', category: 'protagonists' },
  { key: 'elio', label: 'Elio', category: 'protagonists' },
  { key: 'selene', label: 'Selene', category: 'protagonists' },
  { key: 'chase', label: 'Chase', category: 'protagonists' },
  { key: 'elaine', label: 'Elaine', category: 'protagonists' },
  { key: 'victor', label: 'Victor', category: 'protagonists' },
  { key: 'gloria', label: 'Gloria', category: 'protagonists' },
  { key: 'rei', label: 'Rei', category: 'protagonists' },
  { key: 'akari', label: 'Akari', category: 'protagonists' },
  { key: 'florian', label: 'Florian', category: 'protagonists' },
  { key: 'juliana', label: 'Juliana', category: 'protagonists' },

  // ========================================
  // Gym Leaders
  // ========================================
  { key: 'brock', label: 'Brock', category: 'gym-leaders' },
  { key: 'misty', label: 'Misty', category: 'gym-leaders' },
  { key: 'surge', label: 'Lt. Surge', category: 'gym-leaders' },
  { key: 'erika', label: 'Erika', category: 'gym-leaders' },
  { key: 'koga', label: 'Koga', category: 'gym-leaders' },
  { key: 'sabrina', label: 'Sabrina', category: 'gym-leaders' },
  { key: 'blaine', label: 'Blaine', category: 'gym-leaders' },
  { key: 'giovanni', label: 'Giovanni', category: 'gym-leaders' },
  { key: 'falkner', label: 'Falkner', category: 'gym-leaders' },
  { key: 'bugsy', label: 'Bugsy', category: 'gym-leaders' },
  { key: 'whitney', label: 'Whitney', category: 'gym-leaders' },
  { key: 'morty', label: 'Morty', category: 'gym-leaders' },
  { key: 'chuck', label: 'Chuck', category: 'gym-leaders' },
  { key: 'jasmine', label: 'Jasmine', category: 'gym-leaders' },
  { key: 'pryce', label: 'Pryce', category: 'gym-leaders' },
  { key: 'clair', label: 'Clair', category: 'gym-leaders' },
  { key: 'roxanne', label: 'Roxanne', category: 'gym-leaders' },
  { key: 'brawly', label: 'Brawly', category: 'gym-leaders' },
  { key: 'wattson', label: 'Wattson', category: 'gym-leaders' },
  { key: 'flannery', label: 'Flannery', category: 'gym-leaders' },
  { key: 'norman', label: 'Norman', category: 'gym-leaders' },
  { key: 'winona', label: 'Winona', category: 'gym-leaders' },
  { key: 'liza', label: 'Liza', category: 'gym-leaders' },
  { key: 'tate', label: 'Tate', category: 'gym-leaders' },
  { key: 'juan', label: 'Juan', category: 'gym-leaders' },
  { key: 'roark', label: 'Roark', category: 'gym-leaders' },
  { key: 'gardenia', label: 'Gardenia', category: 'gym-leaders' },
  { key: 'maylene', label: 'Maylene', category: 'gym-leaders' },
  { key: 'crasherwake', label: 'Crasher Wake', category: 'gym-leaders' },
  { key: 'fantina', label: 'Fantina', category: 'gym-leaders' },
  { key: 'byron', label: 'Byron', category: 'gym-leaders' },
  { key: 'candice', label: 'Candice', category: 'gym-leaders' },
  { key: 'volkner', label: 'Volkner', category: 'gym-leaders' },
  { key: 'cilan', label: 'Cilan', category: 'gym-leaders' },
  { key: 'chili', label: 'Chili', category: 'gym-leaders' },
  { key: 'cress', label: 'Cress', category: 'gym-leaders' },
  { key: 'lenora', label: 'Lenora', category: 'gym-leaders' },
  { key: 'burgh', label: 'Burgh', category: 'gym-leaders' },
  { key: 'elesa', label: 'Elesa', category: 'gym-leaders' },
  { key: 'clay', label: 'Clay', category: 'gym-leaders' },
  { key: 'skyla', label: 'Skyla', category: 'gym-leaders' },
  { key: 'brycen', label: 'Brycen', category: 'gym-leaders' },
  { key: 'drayden', label: 'Drayden', category: 'gym-leaders' },
  { key: 'roxie', label: 'Roxie', category: 'gym-leaders' },
  { key: 'marlon', label: 'Marlon', category: 'gym-leaders' },
  { key: 'clemont', label: 'Clemont', category: 'gym-leaders' },
  { key: 'korrina', label: 'Korrina', category: 'gym-leaders' },
  { key: 'ramos', label: 'Ramos', category: 'gym-leaders' },
  { key: 'valerie', label: 'Valerie', category: 'gym-leaders' },
  { key: 'olympia', label: 'Olympia', category: 'gym-leaders' },
  { key: 'wulfric', label: 'Wulfric', category: 'gym-leaders' },

  // ========================================
  // Elite Four & Champions
  // ========================================
  { key: 'lorelei', label: 'Lorelei', category: 'elite-champions' },
  { key: 'bruno', label: 'Bruno', category: 'elite-champions' },
  { key: 'agatha', label: 'Agatha', category: 'elite-champions' },
  { key: 'lance', label: 'Lance', category: 'elite-champions' },
  { key: 'blue', label: 'Blue', category: 'elite-champions' },
  { key: 'will', label: 'Will', category: 'elite-champions' },
  { key: 'karen', label: 'Karen', category: 'elite-champions' },
  { key: 'sidney', label: 'Sidney', category: 'elite-champions' },
  { key: 'phoebe', label: 'Phoebe', category: 'elite-champions' },
  { key: 'glacia', label: 'Glacia', category: 'elite-champions' },
  { key: 'drake', label: 'Drake', category: 'elite-champions' },
  { key: 'steven', label: 'Steven', category: 'elite-champions' },
  { key: 'wallace', label: 'Wallace', category: 'elite-champions' },
  { key: 'aaron', label: 'Aaron', category: 'elite-champions' },
  { key: 'bertha', label: 'Bertha', category: 'elite-champions' },
  { key: 'flint', label: 'Flint', category: 'elite-champions' },
  { key: 'lucian', label: 'Lucian', category: 'elite-champions' },
  { key: 'cynthia', label: 'Cynthia', category: 'elite-champions' },
  { key: 'shauntal', label: 'Shauntal', category: 'elite-champions' },
  { key: 'marshal', label: 'Marshal', category: 'elite-champions' },
  { key: 'grimsley', label: 'Grimsley', category: 'elite-champions' },
  { key: 'caitlin', label: 'Caitlin', category: 'elite-champions' },
  { key: 'alder', label: 'Alder', category: 'elite-champions' },
  { key: 'iris', label: 'Iris', category: 'elite-champions' },
  { key: 'diantha', label: 'Diantha', category: 'elite-champions' },
  { key: 'leon', label: 'Leon', category: 'elite-champions' },

  // ========================================
  // Villains & Admins
  // ========================================
  { key: 'archer', label: 'Archer', category: 'villains' },
  { key: 'ariana', label: 'Ariana', category: 'villains' },
  { key: 'proton', label: 'Proton', category: 'villains' },
  { key: 'petrel', label: 'Petrel', category: 'villains' },
  { key: 'archie', label: 'Archie', category: 'villains' },
  { key: 'maxie', label: 'Maxie', category: 'villains' },
  { key: 'courtney', label: 'Courtney', category: 'villains' },
  { key: 'tabitha', label: 'Tabitha', category: 'villains' },
  { key: 'matt', label: 'Matt', category: 'villains' },
  { key: 'cyrus', label: 'Cyrus', category: 'villains' },
  { key: 'mars', label: 'Mars', category: 'villains' },
  { key: 'jupiter', label: 'Jupiter', category: 'villains' },
  { key: 'saturn', label: 'Saturn', category: 'villains' },
  { key: 'charon', label: 'Charon', category: 'villains' },
  { key: 'n', label: 'N', category: 'villains' },
  { key: 'ghetsis', label: 'Ghetsis', category: 'villains' },
  { key: 'colress', label: 'Colress', category: 'villains' },
  { key: 'zinzolin', label: 'Zinzolin', category: 'villains' },
  { key: 'lysandre', label: 'Lysandre', category: 'villains' },
  { key: 'guzma', label: 'Guzma', category: 'villains' },
  { key: 'plumeria', label: 'Plumeria', category: 'villains' },
  { key: 'lusamine', label: 'Lusamine', category: 'villains' },
  { key: 'faba', label: 'Faba', category: 'villains' },

  // ========================================
  // Team Grunts
  // ========================================
  { key: 'rocketgrunt', label: 'Rocket Grunt (M)', category: 'grunts' },
  { key: 'rocketgruntf', label: 'Rocket Grunt (F)', category: 'grunts' },
  { key: 'aquagrunt', label: 'Aqua Grunt (M)', category: 'grunts' },
  { key: 'aquagruntf', label: 'Aqua Grunt (F)', category: 'grunts' },
  { key: 'magmagrunt', label: 'Magma Grunt (M)', category: 'grunts' },
  { key: 'magmagruntf', label: 'Magma Grunt (F)', category: 'grunts' },
  { key: 'galacticgrunt', label: 'Galactic Grunt (M)', category: 'grunts' },
  { key: 'galacticgruntf', label: 'Galactic Grunt (F)', category: 'grunts' },
  { key: 'plasmagrunt', label: 'Plasma Grunt (M)', category: 'grunts' },
  { key: 'plasmagruntf', label: 'Plasma Grunt (F)', category: 'grunts' },
  { key: 'flaregrunt', label: 'Flare Grunt (M)', category: 'grunts' },
  { key: 'flaregruntf', label: 'Flare Grunt (F)', category: 'grunts' },
  { key: 'skullgrunt', label: 'Skull Grunt (M)', category: 'grunts' },
  { key: 'skullgruntf', label: 'Skull Grunt (F)', category: 'grunts' },

  // ========================================
  // Generic Male
  // ========================================
  { key: 'acetrainer', label: 'Ace Trainer', category: 'generic-male' },
  { key: 'backpacker', label: 'Backpacker', category: 'generic-male' },
  { key: 'biker', label: 'Biker', category: 'generic-male' },
  { key: 'blackbelt', label: 'Black Belt', category: 'generic-male' },
  { key: 'camper', label: 'Camper', category: 'generic-male' },
  { key: 'cyclist', label: 'Cyclist', category: 'generic-male' },
  { key: 'fisherman', label: 'Fisherman', category: 'generic-male' },
  { key: 'gentleman', label: 'Gentleman', category: 'generic-male' },
  { key: 'hiker', label: 'Hiker', category: 'generic-male' },
  { key: 'hooligans', label: 'Hooligans', category: 'generic-male' },
  { key: 'janitor', label: 'Janitor', category: 'generic-male' },
  { key: 'pilot', label: 'Pilot', category: 'generic-male' },
  { key: 'pokefan', label: 'Pokefan (M)', category: 'generic-male' },
  { key: 'pokekid', label: 'Poke Kid', category: 'generic-male' },
  { key: 'preschooler', label: 'Preschooler (M)', category: 'generic-male' },
  { key: 'psychic', label: 'Psychic (M)', category: 'generic-male' },
  { key: 'richboy', label: 'Rich Boy', category: 'generic-male' },
  { key: 'roughneck', label: 'Roughneck', category: 'generic-male' },
  { key: 'sailor', label: 'Sailor', category: 'generic-male' },
  { key: 'scientist', label: 'Scientist (M)', category: 'generic-male' },
  { key: 'schoolboy', label: 'School Kid (M)', category: 'generic-male' },
  { key: 'swimmer', label: 'Swimmer (M)', category: 'generic-male' },
  { key: 'veteran', label: 'Veteran (M)', category: 'generic-male' },
  { key: 'waiter', label: 'Waiter', category: 'generic-male' },
  { key: 'worker', label: 'Worker', category: 'generic-male' },
  { key: 'youngster', label: 'Youngster', category: 'generic-male' },

  // ========================================
  // Generic Female
  // ========================================
  { key: 'acetrainerf', label: 'Ace Trainer (F)', category: 'generic-female' },
  { key: 'backpackerf', label: 'Backpacker (F)', category: 'generic-female' },
  { key: 'battlegirl', label: 'Battle Girl', category: 'generic-female' },
  { key: 'beauty', label: 'Beauty', category: 'generic-female' },
  { key: 'cowgirl', label: 'Cowgirl', category: 'generic-female' },
  { key: 'cyclistf', label: 'Cyclist (F)', category: 'generic-female' },
  { key: 'fairytalegirl', label: 'Fairy Tale Girl', category: 'generic-female' },
  { key: 'lady', label: 'Lady', category: 'generic-female' },
  { key: 'lass', label: 'Lass', category: 'generic-female' },
  { key: 'madame', label: 'Madame', category: 'generic-female' },
  { key: 'maid', label: 'Maid', category: 'generic-female' },
  { key: 'nurse', label: 'Nurse', category: 'generic-female' },
  { key: 'parasollady', label: 'Parasol Lady', category: 'generic-female' },
  { key: 'pokefanf', label: 'Pokefan (F)', category: 'generic-female' },
  { key: 'preschoolerf', label: 'Preschooler (F)', category: 'generic-female' },
  { key: 'psychicf', label: 'Psychic (F)', category: 'generic-female' },
  { key: 'schoolgirl', label: 'School Kid (F)', category: 'generic-female' },
  { key: 'scientistf', label: 'Scientist (F)', category: 'generic-female' },
  { key: 'swimmerf', label: 'Swimmer (F)', category: 'generic-female' },
  { key: 'veteranf', label: 'Veteran (F)', category: 'generic-female' },
  { key: 'waitress', label: 'Waitress', category: 'generic-female' },

  // ========================================
  // Specialists
  // ========================================
  { key: 'aromalady', label: 'Aroma Lady', category: 'specialists' },
  { key: 'birdkeeper', label: 'Bird Keeper', category: 'specialists' },
  { key: 'bugcatcher', label: 'Bug Catcher', category: 'specialists' },
  { key: 'bugmaniac', label: 'Bug Maniac', category: 'specialists' },
  { key: 'channeler', label: 'Channeler', category: 'specialists' },
  { key: 'collector', label: 'Collector', category: 'specialists' },
  { key: 'dragontamer', label: 'Dragon Tamer', category: 'specialists' },
  { key: 'firebreather', label: 'Fire Breather', category: 'specialists' },
  { key: 'hexmaniac', label: 'Hex Maniac', category: 'specialists' },
  { key: 'ninjaboy', label: 'Ninja Boy', category: 'specialists' },
  { key: 'pokemonbreeder', label: 'Pokemon Breeder', category: 'specialists' },
  { key: 'pokemonbreederf', label: 'Pokemon Breeder (F)', category: 'specialists' },
  { key: 'pokemonranger', label: 'Pokemon Ranger (M)', category: 'specialists' },
  { key: 'pokemonrangerf', label: 'Pokemon Ranger (F)', category: 'specialists' },
  { key: 'ruinmaniac', label: 'Ruin Maniac', category: 'specialists' },
  { key: 'supernerd', label: 'Super Nerd', category: 'specialists' },
  { key: 'triathlete', label: 'Triathlete', category: 'specialists' },

  // ========================================
  // Other
  // ========================================
  { key: 'artist', label: 'Artist', category: 'other' },
  { key: 'baker', label: 'Baker', category: 'other' },
  { key: 'bellhop', label: 'Bellhop', category: 'other' },
  { key: 'butler', label: 'Butler', category: 'other' },
  { key: 'chef', label: 'Chef', category: 'other' },
  { key: 'clown', label: 'Clown', category: 'other' },
  { key: 'dancer', label: 'Dancer', category: 'other' },
  { key: 'delinquent', label: 'Delinquent', category: 'other' },
  { key: 'doctor', label: 'Doctor', category: 'other' },
  { key: 'engineer', label: 'Engineer', category: 'other' },
  { key: 'guitarist', label: 'Guitarist', category: 'other' },
  { key: 'juggler', label: 'Juggler', category: 'other' },
  { key: 'musician', label: 'Musician', category: 'other' },
  { key: 'officeworker', label: 'Office Worker', category: 'other' },
  { key: 'policeman', label: 'Policeman', category: 'other' },
  { key: 'reporter', label: 'Reporter', category: 'other' },
  { key: 'tourist', label: 'Tourist', category: 'other' },
  { key: 'tumbler', label: 'Tumbler', category: 'other' },
  { key: 'youngcouple', label: 'Young Couple', category: 'other' },
]
