<template>
  <div class="map-overlay" :class="{ 'map-overlay--fullscreen': fullscreen }">
    <div class="map-container">
      <h2 class="map-title">{{ map.name }}</h2>

      <svg class="map-svg" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid meet">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1a4a6e;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#2d6a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a4a6e;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="forestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a3d1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0d2a0d;stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
          </filter>
        </defs>

        <!-- River -->
        <path
          d="M 0 200 Q 200 180, 400 200 Q 600 220, 800 200"
          fill="none"
          stroke="url(#riverGradient)"
          stroke-width="60"
          class="river"
        />
        <path
          d="M 0 200 Q 200 180, 400 200 Q 600 220, 800 200"
          fill="none"
          stroke="#4aa3c7"
          stroke-width="2"
          stroke-dasharray="10,5"
          class="river-shimmer"
        />
        <text x="400" y="205" class="river-label">~ ~ ~ R I V E R ~ ~ ~</text>

        <!-- Connections/Paths -->
        <!-- Rivermere Causeway -->
        <path
          d="M 400 80 L 400 170"
          stroke="#8b7355"
          stroke-width="8"
          stroke-linecap="round"
          filter="url(#shadow)"
        />
        <text x="500" y="130" class="path-label">Rivermere Causeway</text>

        <!-- Forest Path from River to Bramblewick -->
        <path
          d="M 300 230 Q 350 300, 400 400 Q 420 500, 400 600 L 400 750"
          stroke="#5c4a32"
          stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="15,8"
          fill="none"
        />
        <path
          d="M 500 230 Q 450 300, 400 400 Q 380 500, 400 600 L 400 750"
          stroke="#5c4a32"
          stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="15,8"
          fill="none"
        />

        <!-- Bramblewick Road -->
        <path
          d="M 400 600 L 400 750"
          stroke="#8b7355"
          stroke-width="8"
          stroke-linecap="round"
        />
        <text x="420" y="680" class="path-label">Bramblewick Road</text>

        <!-- Greywater Aqueduct -->
        <path
          d="M 200 200 Q 150 300, 200 400 L 250 500"
          stroke="#6b6b6b"
          stroke-width="10"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 200 200 Q 150 300, 200 400 L 250 500"
          stroke="#4aa3c7"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="20,10"
          fill="none"
        />
        <text x="100" y="350" class="path-label aqueduct-label">Greywater Aqueduct</text>

        <!-- Thickerby Forest -->
        <rect
          x="200" y="350"
          width="400" height="220"
          rx="20"
          fill="url(#forestGradient)"
          class="forest"
          filter="url(#shadow)"
        />
        <text x="400" y="390" class="location-name forest-name">THICKERBY FOREST</text>
        <text x="400" y="420" class="location-desc">(dim, berry-thick woodland)</text>

        <!-- Forest trees decoration -->
        <g class="trees" opacity="0.6">
          <text x="250" y="450" class="tree">🌲</text>
          <text x="300" y="480" class="tree">🌲</text>
          <text x="350" y="440" class="tree">🌲</text>
          <text x="450" y="460" class="tree">🌲</text>
          <text x="500" y="430" class="tree">🌲</text>
          <text x="550" y="470" class="tree">🌲</text>
          <text x="280" y="520" class="tree">🌲</text>
          <text x="520" y="510" class="tree">🌲</text>
        </g>

        <!-- Castle Grounds (inside forest) -->
        <rect
          x="320" y="470"
          width="160" height="80"
          rx="10"
          fill="#2a2a2a"
          stroke="#4a4a4a"
          stroke-width="2"
          opacity="0.8"
        />
        <text x="400" y="505" class="location-name small">Castle Grounds</text>
        <text x="400" y="525" class="location-desc small">(overgrown)</text>

        <!-- Town: Rivermere -->
        <g class="location town" transform="translate(400, 50)">
          <rect x="-80" y="-35" width="160" height="70" rx="10" class="town-bg"/>
          <text x="0" y="-5" class="location-name">RIVERMERE</text>
          <text x="0" y="15" class="location-desc">(stone bridge + waterwheels)</text>
          <circle cx="-60" cy="0" r="5" class="town-marker"/>
          <circle cx="60" cy="0" r="5" class="town-marker"/>
        </g>

        <!-- Town: Bramblewick -->
        <g class="location town" transform="translate(400, 780)">
          <rect x="-100" y="-35" width="200" height="70" rx="10" class="town-bg"/>
          <text x="0" y="-5" class="location-name">BRAMBLEWICK</text>
          <text x="0" y="15" class="location-desc">(berries, honey, timber + thatch)</text>
          <circle cx="-80" cy="0" r="5" class="town-marker"/>
          <circle cx="80" cy="0" r="5" class="town-marker"/>
        </g>

        <!-- Phasmosa's Castle -->
        <g class="location castle" transform="translate(250, 550)">
          <polygon
            points="0,-50 30,-20 30,30 -30,30 -30,-20"
            class="castle-shape"
          />
          <rect x="-15" y="-60" width="10" height="25" class="castle-tower"/>
          <rect x="5" y="-60" width="10" height="25" class="castle-tower"/>
          <polygon points="-15,-60 -10,-75 -5,-60" class="castle-spire"/>
          <polygon points="5,-60 10,-75 15,-60" class="castle-spire"/>
          <text x="0" y="55" class="location-name castle-name">PHASMOSA'S CASTLE</text>
          <text x="0" y="75" class="location-desc">(haunted keep on the hill)</text>
        </g>

        <!-- River banks annotations -->
        <text x="150" y="250" class="annotation">(banks/fishing)</text>
        <text x="650" y="250" class="annotation">(puddles/mud patches)</text>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MapLocation {
  id: string
  name: string
  type: 'town' | 'forest' | 'castle' | 'path' | 'river' | 'landmark'
  description?: string
  x: number
  y: number
  highlighted?: boolean
}

interface MapConnection {
  from: string
  to: string
  label?: string
  type: 'road' | 'path' | 'river' | 'aqueduct'
}

interface Props {
  map: {
    id: string
    name: string
    locations: MapLocation[]
    connections: MapConnection[]
  }
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
})
</script>

<style lang="scss" scoped>
.map-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  // When used as a full-screen overlay (group view)
  &--fullscreen {
    position: fixed;
    padding: 1rem 2rem;
  }
}

.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.map-title {
  text-align: center;
  font-size: 1.5rem;
  color: #f0e6d3;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(255, 200, 100, 0.5);
  font-family: 'Georgia', serif;
  flex-shrink: 0;

  .map-overlay--fullscreen & {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
}

.map-svg {
  max-width: 100%;
  max-height: calc(100vh - 5rem);
  width: auto;
  height: auto;
  filter: drop-shadow(0 0 30px rgba(0, 0, 0, 0.5));

  .map-overlay--fullscreen & {
    max-height: calc(100vh - 6rem);
  }
}

.river {
  animation: river-flow 3s ease-in-out infinite;
}

.river-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes river-flow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes shimmer {
  0%, 100% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 30; }
}

.river-label {
  fill: #4aa3c7;
  font-size: 14px;
  text-anchor: middle;
  letter-spacing: 0.5em;
  opacity: 0.7;
}

.path-label {
  fill: #a89070;
  font-size: 12px;
  font-style: italic;
}

.aqueduct-label {
  fill: #8aa;
  font-size: 11px;
}

.forest {
  opacity: 0.9;
}

.forest-name {
  fill: #7cb97c;
}

.location-name {
  fill: #f0e6d3;
  font-size: 16px;
  font-weight: bold;
  text-anchor: middle;
  text-transform: uppercase;
  letter-spacing: 0.15em;

  &.small {
    font-size: 12px;
    letter-spacing: 0.1em;
  }

  &.castle-name {
    fill: #c8a0d0;
    text-shadow: 0 0 10px rgba(200, 160, 208, 0.5);
  }
}

.location-desc {
  fill: #a89080;
  font-size: 11px;
  text-anchor: middle;
  font-style: italic;

  &.small {
    font-size: 9px;
  }
}

.town-bg {
  fill: #2a2520;
  stroke: #5a4a3a;
  stroke-width: 2;
}

.town-marker {
  fill: #d4a054;
  filter: url(#glow);
}

.castle-shape {
  fill: #3a3040;
  stroke: #6a5a6a;
  stroke-width: 2;
}

.castle-tower {
  fill: #4a4050;
  stroke: #6a5a6a;
  stroke-width: 1;
}

.castle-spire {
  fill: #5a5060;
}

.tree {
  font-size: 24px;
}

.annotation {
  fill: #706050;
  font-size: 10px;
  font-style: italic;
  text-anchor: middle;
}

.location {
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
