import { describe, it, expect } from 'vitest'

// Test the sprite URL generation logic directly

// Map of special Pokemon names
const specialNames: Record<string, string> = {
  'nidoran-f': 'nidoran-f',
  'nidoran-m': 'nidoran-m',
  'mr. mime': 'mr-mime',
  'mr mime': 'mr-mime',
  'mime jr.': 'mime-jr',
  'mime jr': 'mime-jr',
  'type: null': 'type-null',
  'type null': 'type-null',
  'tapu koko': 'tapu-koko',
  'tapu lele': 'tapu-lele',
  'tapu bulu': 'tapu-bulu',
  'tapu fini': 'tapu-fini',
  'ho-oh': 'ho-oh',
  'porygon-z': 'porygon-z',
  'jangmo-o': 'jangmo-o',
  'hakamo-o': 'hakamo-o',
  'kommo-o': 'kommo-o',
}

const normalizeSpeciesName = (species: string): string => {
  const lower = species.toLowerCase().trim()

  // Check special cases first
  if (specialNames[lower]) {
    return specialNames[lower]
  }

  // Replace spaces and special characters with hyphens
  return lower
    .replace(/[.']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const getSpriteUrl = (species: string, shiny: boolean = false): string => {
  const normalizedName = normalizeSpeciesName(species)

  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${normalizedName}.png`
  }

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${normalizedName}.png`
}

const getAnimatedSpriteUrl = (species: string, shiny: boolean = false): string => {
  const normalizedName = normalizeSpeciesName(species)
  const shinyPath = shiny ? 'shiny/' : ''

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${shinyPath}${normalizedName}.gif`
}

const getSpriteByDexNumber = (dexNumber: number, shiny: boolean = false): string => {
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${dexNumber}.png`
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`
}

const getOfficialArtwork = (dexNumber: number, shiny: boolean = false): string => {
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${dexNumber}.png`
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`
}

const getShowdownSprite = (species: string, shiny: boolean = false): string => {
  const normalizedName = normalizeSpeciesName(species)
  const shinyPath = shiny ? 'shiny/' : ''

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${shinyPath}${normalizedName}.gif`
}

describe('usePokemonSprite composable', () => {
  describe('normalizeSpeciesName', () => {
    it('should lowercase species names', () => {
      expect(normalizeSpeciesName('Pikachu')).toBe('pikachu')
      expect(normalizeSpeciesName('CHARIZARD')).toBe('charizard')
      expect(normalizeSpeciesName('BuLbAsAuR')).toBe('bulbasaur')
    })

    it('should trim whitespace', () => {
      expect(normalizeSpeciesName('  pikachu  ')).toBe('pikachu')
      expect(normalizeSpeciesName('\tcharizard\n')).toBe('charizard')
    })

    it('should replace spaces with hyphens', () => {
      expect(normalizeSpeciesName('Iron Treads')).toBe('iron-treads')
      expect(normalizeSpeciesName('Roaring Moon')).toBe('roaring-moon')
    })

    it('should remove apostrophes and periods', () => {
      expect(normalizeSpeciesName("Farfetch'd")).toBe('farfetchd')
      expect(normalizeSpeciesName("Sirfetch'd")).toBe('sirfetchd')
    })

    it('should handle special cases correctly', () => {
      expect(normalizeSpeciesName('Mr. Mime')).toBe('mr-mime')
      expect(normalizeSpeciesName('Mr Mime')).toBe('mr-mime')
      expect(normalizeSpeciesName('Mime Jr.')).toBe('mime-jr')
      expect(normalizeSpeciesName('Type: Null')).toBe('type-null')
      expect(normalizeSpeciesName('Ho-Oh')).toBe('ho-oh')
      expect(normalizeSpeciesName('Porygon-Z')).toBe('porygon-z')
      expect(normalizeSpeciesName('Tapu Koko')).toBe('tapu-koko')
      expect(normalizeSpeciesName('Tapu Lele')).toBe('tapu-lele')
      expect(normalizeSpeciesName('Jangmo-o')).toBe('jangmo-o')
      expect(normalizeSpeciesName('Hakamo-o')).toBe('hakamo-o')
      expect(normalizeSpeciesName('Kommo-o')).toBe('kommo-o')
    })

    it('should remove special characters', () => {
      expect(normalizeSpeciesName('Nidoran♀')).toBe('nidoran')
      expect(normalizeSpeciesName('Nidoran♂')).toBe('nidoran')
    })
  })

  describe('getSpriteUrl', () => {
    it('should return correct URL for normal Pokemon', () => {
      const url = getSpriteUrl('Pikachu')
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/pikachu.png')
    })

    it('should return shiny URL when shiny is true', () => {
      const url = getSpriteUrl('Pikachu', true)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/pikachu.png')
    })

    it('should handle special named Pokemon', () => {
      const url = getSpriteUrl('Mr. Mime')
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/mr-mime.png')
    })
  })

  describe('getAnimatedSpriteUrl', () => {
    it('should return BW animated sprite URL', () => {
      const url = getAnimatedSpriteUrl('Charizard')
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/charizard.gif')
    })

    it('should return shiny animated sprite URL', () => {
      const url = getAnimatedSpriteUrl('Charizard', true)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/charizard.gif')
    })
  })

  describe('getSpriteByDexNumber', () => {
    it('should return URL with dex number', () => {
      expect(getSpriteByDexNumber(25)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png')
      expect(getSpriteByDexNumber(6)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png')
    })

    it('should return shiny URL with dex number', () => {
      expect(getSpriteByDexNumber(25, true)).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png')
    })
  })

  describe('getOfficialArtwork', () => {
    it('should return official artwork URL', () => {
      const url = getOfficialArtwork(25)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png')
    })

    it('should return shiny official artwork URL', () => {
      const url = getOfficialArtwork(25, true)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png')
    })
  })

  describe('getShowdownSprite', () => {
    it('should return Showdown sprite URL', () => {
      const url = getShowdownSprite('Pikachu')
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/pikachu.gif')
    })

    it('should return shiny Showdown sprite URL', () => {
      const url = getShowdownSprite('Pikachu', true)
      expect(url).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/pikachu.gif')
    })
  })

  describe('Various Pokemon species', () => {
    const testCases = [
      { input: 'Bulbasaur', expected: 'bulbasaur' },
      { input: 'Charmander', expected: 'charmander' },
      { input: 'Squirtle', expected: 'squirtle' },
      { input: 'Pikachu', expected: 'pikachu' },
      { input: 'Mewtwo', expected: 'mewtwo' },
      { input: 'Mew', expected: 'mew' },
      { input: 'Scizor', expected: 'scizor' },
      { input: 'Tyranitar', expected: 'tyranitar' },
      { input: 'Gardevoir', expected: 'gardevoir' },
      { input: 'Lucario', expected: 'lucario' },
      { input: 'Garchomp', expected: 'garchomp' },
      { input: 'Greninja', expected: 'greninja' },
      { input: 'Mimikyu', expected: 'mimikyu' },
    ]

    it.each(testCases)('should normalize "$input" to "$expected"', ({ input, expected }) => {
      expect(normalizeSpeciesName(input)).toBe(expected)
    })
  })
})
