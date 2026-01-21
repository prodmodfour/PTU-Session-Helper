// Pokemon sprite URL generator
// Uses Pokemon Showdown animated sprites as primary source

export function usePokemonSprite() {
  // Map of special Pokemon names for Showdown sprite URLs
  const showdownNames: Record<string, string> = {
    'nidoran-f': 'nidoranf',
    'nidoran-m': 'nidoranm',
    'nidoran♀': 'nidoranf',
    'nidoran♂': 'nidoranm',
    'mr. mime': 'mrmime',
    'mr mime': 'mrmime',
    'mr-mime': 'mrmime',
    'mime jr.': 'mimejr',
    'mime jr': 'mimejr',
    'type: null': 'typenull',
    'type null': 'typenull',
    'tapu koko': 'tapukoko',
    'tapu lele': 'tapulele',
    'tapu bulu': 'tapubulu',
    'tapu fini': 'tapufini',
    'ho-oh': 'hooh',
    'porygon-z': 'porygonz',
    'jangmo-o': 'jangmoo',
    'hakamo-o': 'hakamoo',
    'kommo-o': 'kommoo',
    "farfetch'd": 'farfetchd',
    "sirfetch'd": 'sirfetchd',
    'flabébé': 'flabebe',
  }

  // Dex number lookup for reliable sprite fetching
  const dexNumbers: Record<string, number> = {
    'bulbasaur': 1, 'ivysaur': 2, 'venusaur': 3, 'charmander': 4, 'charmeleon': 5,
    'charizard': 6, 'squirtle': 7, 'wartortle': 8, 'blastoise': 9, 'caterpie': 10,
    'metapod': 11, 'butterfree': 12, 'weedle': 13, 'kakuna': 14, 'beedrill': 15,
    'pidgey': 16, 'pidgeotto': 17, 'pidgeot': 18, 'rattata': 19, 'raticate': 20,
    'spearow': 21, 'fearow': 22, 'ekans': 23, 'arbok': 24, 'pikachu': 25,
    'raichu': 26, 'sandshrew': 27, 'sandslash': 28, 'nidoran-f': 29, 'nidorina': 30,
    'nidoqueen': 31, 'nidoran-m': 32, 'nidorino': 33, 'nidoking': 34, 'clefairy': 35,
    'clefable': 36, 'vulpix': 37, 'ninetales': 38, 'jigglypuff': 39, 'wigglytuff': 40,
    'zubat': 41, 'golbat': 42, 'oddish': 43, 'gloom': 44, 'vileplume': 45,
    'paras': 46, 'parasect': 47, 'venonat': 48, 'venomoth': 49, 'diglett': 50,
    'dugtrio': 51, 'meowth': 52, 'persian': 53, 'psyduck': 54, 'golduck': 55,
    'mankey': 56, 'primeape': 57, 'growlithe': 58, 'arcanine': 59, 'poliwag': 60,
    'poliwhirl': 61, 'poliwrath': 62, 'abra': 63, 'kadabra': 64, 'alakazam': 65,
    'machop': 66, 'machoke': 67, 'machamp': 68, 'bellsprout': 69, 'weepinbell': 70,
    'victreebel': 71, 'tentacool': 72, 'tentacruel': 73, 'geodude': 74, 'graveler': 75,
    'golem': 76, 'ponyta': 77, 'rapidash': 78, 'slowpoke': 79, 'slowbro': 80,
    'magnemite': 81, 'magneton': 82, 'farfetchd': 83, 'doduo': 84, 'dodrio': 85,
    'seel': 86, 'dewgong': 87, 'grimer': 88, 'muk': 89, 'shellder': 90,
    'cloyster': 91, 'gastly': 92, 'haunter': 93, 'gengar': 94, 'onix': 95,
    'drowzee': 96, 'hypno': 97, 'krabby': 98, 'kingler': 99, 'voltorb': 100,
    'electrode': 101, 'exeggcute': 102, 'exeggutor': 103, 'cubone': 104, 'marowak': 105,
    'hitmonlee': 106, 'hitmonchan': 107, 'lickitung': 108, 'koffing': 109, 'weezing': 110,
    'rhyhorn': 111, 'rhydon': 112, 'chansey': 113, 'tangela': 114, 'kangaskhan': 115,
    'horsea': 116, 'seadra': 117, 'goldeen': 118, 'seaking': 119, 'staryu': 120,
    'starmie': 121, 'mr-mime': 122, 'scyther': 123, 'jynx': 124, 'electabuzz': 125,
    'magmar': 126, 'pinsir': 127, 'tauros': 128, 'magikarp': 129, 'gyarados': 130,
    'lapras': 131, 'ditto': 132, 'eevee': 133, 'vaporeon': 134, 'jolteon': 135,
    'flareon': 136, 'porygon': 137, 'omanyte': 138, 'omastar': 139, 'kabuto': 140,
    'kabutops': 141, 'aerodactyl': 142, 'snorlax': 143, 'articuno': 144, 'zapdos': 145,
    'moltres': 146, 'dratini': 147, 'dragonair': 148, 'dragonite': 149, 'mewtwo': 150,
    'mew': 151,
    // Gen 2
    'chikorita': 152, 'bayleef': 153, 'meganium': 154, 'cyndaquil': 155, 'quilava': 156,
    'typhlosion': 157, 'totodile': 158, 'croconaw': 159, 'feraligatr': 160,
    'crobat': 169, 'espeon': 196, 'umbreon': 197, 'slowking': 199, 'steelix': 208,
    'scizor': 212, 'heracross': 214, 'sneasel': 215, 'ursaring': 217, 'piloswine': 221,
    'kingdra': 230, 'porygon2': 233, 'hitmontop': 237, 'blissey': 242, 'raikou': 243,
    'entei': 244, 'suicune': 245, 'larvitar': 246, 'pupitar': 247, 'tyranitar': 248,
    'lugia': 249, 'ho-oh': 250, 'celebi': 251,
    // Gen 3+
    'gardevoir': 282, 'slaking': 289, 'aggron': 306, 'flygon': 330, 'altaria': 334,
    'milotic': 350, 'salamence': 373, 'metagross': 376, 'latias': 380, 'latios': 381,
    'kyogre': 382, 'groudon': 383, 'rayquaza': 384, 'lucario': 448, 'garchomp': 445,
    'leafeon': 470, 'glaceon': 471, 'mamoswine': 473, 'porygon-z': 474, 'gallade': 475,
    'sylveon': 700, 'greninja': 658, 'mimikyu': 778,
  }

  // Normalize name for Showdown sprite URLs (no hyphens, no special chars)
  const normalizeForShowdown = (species: string): string => {
    const lower = species.toLowerCase().trim()

    // Check special cases first
    if (showdownNames[lower]) {
      return showdownNames[lower]
    }

    // Showdown uses lowercase names with no spaces, hyphens, or special characters
    return lower
      .replace(/[.'\-\s:]/g, '')
      .replace(/[^a-z0-9]/g, '')
  }

  // Normalize for other sprite sources (with hyphens)
  const normalizeSpeciesName = (species: string): string => {
    const lower = species.toLowerCase().trim()

    // Replace spaces and special characters with hyphens
    return lower
      .replace(/[.']/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  // Get dex number from species name
  const getDexNumber = (species: string): number | null => {
    const normalized = normalizeSpeciesName(species)
    return dexNumbers[normalized] || null
  }

  // Get animated sprite URL - B2W2 for Gen 1-5, Showdown for Gen 6+
  const getSpriteUrl = (species: string, shiny: boolean = false): string => {
    const dexNum = getDexNumber(species)

    // Gen 5 and earlier (up to Genesect #649) - use B2W2 animated sprites
    if (dexNum && dexNum <= 649) {
      const shinyPath = shiny ? 'shiny/' : ''
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${shinyPath}${dexNum}.gif`
    }

    // Gen 6+ - use Pokemon Showdown animated sprites
    const showdownName = normalizeForShowdown(species)
    if (shiny) {
      return `https://play.pokemonshowdown.com/sprites/ani-shiny/${showdownName}.gif`
    }
    return `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`
  }

  // Get static sprite URL using dex number (fallback)
  const getStaticSpriteUrl = (species: string, shiny: boolean = false): string => {
    const dexNum = getDexNumber(species)

    if (dexNum) {
      // Use PokeAPI sprites with dex number
      if (shiny) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${dexNum}.png`
      }
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNum}.png`
    }

    // Fallback to name-based URL for Pokemon not in our list
    const normalizedName = normalizeSpeciesName(species)
    if (shiny) {
      return `https://img.pokemondb.net/sprites/home/shiny/${normalizedName}.png`
    }
    return `https://img.pokemondb.net/sprites/home/normal/${normalizedName}.png`
  }

  // Get animated sprite (Gen 5 BW style from PokeAPI)
  const getAnimatedSpriteUrl = (species: string, shiny: boolean = false): string => {
    const dexNum = getDexNumber(species)
    const shinyPath = shiny ? 'shiny/' : ''

    if (dexNum && dexNum <= 649) {
      // Gen 5 and earlier have BW animated sprites (up to Genesect #649)
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${shinyPath}${dexNum}.gif`
    }

    // For Gen 6+, use Showdown sprites
    return getSpriteUrl(species, shiny)
  }

  // Get sprite by Pokedex number (more reliable)
  const getSpriteByDexNumber = (dexNumber: number, shiny: boolean = false): string => {
    if (shiny) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${dexNumber}.png`
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`
  }

  // Get official artwork
  const getOfficialArtwork = (dexNumber: number, shiny: boolean = false): string => {
    if (shiny) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${dexNumber}.png`
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`
  }

  // Get showdown sprite (same as getSpriteUrl, kept for compatibility)
  const getShowdownSprite = (species: string, shiny: boolean = false): string => {
    return getSpriteUrl(species, shiny)
  }

  // Fallback chain - tries multiple sources
  const getSpriteWithFallback = async (species: string, shiny: boolean = false): Promise<string> => {
    const sources = [
      getSpriteUrl(species, shiny),           // Showdown animated (primary)
      getAnimatedSpriteUrl(species, shiny),   // PokeAPI BW animated
      getStaticSpriteUrl(species, shiny),     // PokeAPI static
    ]

    for (const url of sources) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (response.ok) {
          return url
        }
      } catch {
        continue
      }
    }

    // Return default placeholder
    return '/images/pokemon-placeholder.svg'
  }

  return {
    getSpriteUrl,
    getStaticSpriteUrl,
    getAnimatedSpriteUrl,
    getSpriteByDexNumber,
    getOfficialArtwork,
    getShowdownSprite,
    getSpriteWithFallback,
    normalizeSpeciesName,
    normalizeForShowdown,
    getDexNumber
  }
}
