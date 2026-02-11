# Scene Future Features

Features removed from the scene UI to be re-implemented later. DB columns and store types are still intact.

## Terrain

Scene-level terrain conditions (distinct from the VTT grid terrain painter).

**Previous UI:**
- Scene editor: 4 checkboxes (grassy, electric, psychic, misty) in properties panel
- Group view: Colored badges in top-right corner with icons (PhLeaf, PhLightning, PhBrain, PhCloudFog)

**Data shape:**
```ts
// Scene.terrains: string[]
// Stored as JSON string in SQLite, parsed by API endpoints
terrains: ['grassy', 'electric', 'psychic', 'misty']
```

**DB column:** `Scene.terrains` (`String @default("[]")`) in `app/prisma/schema.prisma`

## Modifiers

Custom scene-wide modifiers with name, description, and effect.

**Previous UI:**
- Scene editor: Add/remove form in properties panel (name input, description textarea, effect input)
- Group view: Panel in bottom-left showing modifier name and description

**Data shape:**
```ts
// Defined in app/stores/groupViewTabs.ts
interface SceneModifier {
  name: string
  description?: string
  effect?: string
}

// Scene.modifiers: SceneModifier[]
// Stored as JSON string in SQLite, parsed by API endpoints
```

**DB column:** `Scene.modifiers` (`String @default("[]")`) in `app/prisma/schema.prisma`
