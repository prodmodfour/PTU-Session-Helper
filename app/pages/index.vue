<template>
  <div class="home">
    <div class="home__hero">
      <h1 class="home__title">PTU Session Helper</h1>
      <p class="home__subtitle">Pokemon Tabletop United 1.05</p>
    </div>

    <div class="home__actions">
      <NuxtLink to="/gm" class="home__card">
        <div class="home__card-icon">
          <img src="/icons/ui/gm.svg" alt="" />
        </div>
        <h2>GM View</h2>
        <p>Full control over encounters, characters, and combat</p>
      </NuxtLink>

      <NuxtLink to="/group" class="home__card">
        <div class="home__card-icon">
          <img src="/icons/ui/player-view.svg" alt="" />
        </div>
        <h2>Group View</h2>
        <p>Simplified view optimized for TV display</p>
      </NuxtLink>
    </div>

    <div class="home__info">
      <h3>Quick Start</h3>
      <ol>
        <li>Open <strong>GM View</strong> on your laptop</li>
        <li>Open <strong>Group View</strong> on your TV (via browser or cast)</li>
        <li>Create or load characters in the Library</li>
        <li>Start an encounter and serve it to the group!</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'PTU Session Helper - Home'
})
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  text-align: center;

  &__hero {
    margin-bottom: $spacing-xxl;
  }

  &__title {
    font-size: 3.5rem;
    margin-bottom: $spacing-sm;
    background: $gradient-sv-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  &__subtitle {
    font-size: $font-size-xl;
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    gap: $spacing-xl;
    margin-bottom: $spacing-xxl;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $spacing-xl;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    border-radius: $border-radius-xl;
    width: 280px;
    transition: all $transition-normal;
    text-decoration: none;
    color: $color-text;

    &:hover {
      border-color: $color-accent-scarlet;
      transform: translateY(-8px);
      box-shadow: $shadow-lg, $shadow-glow-scarlet;
    }

    h2 {
      margin-bottom: $spacing-sm;
      font-weight: 600;
    }

    p {
      color: $color-text-muted;
      margin: 0;
      font-size: $font-size-sm;
    }
  }

  &__card-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-lg;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-glow-scarlet;

    img {
      width: 32px;
      height: 32px;
      filter: brightness(0) invert(1);
    }
  }

  &__info {
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    padding: $spacing-lg $spacing-xl;
    border-radius: $border-radius-lg;
    text-align: left;
    max-width: 500px;

    h3 {
      margin-bottom: $spacing-md;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
    }

    ol {
      margin: 0;
      padding-left: $spacing-lg;

      li {
        margin-bottom: $spacing-sm;
        color: $color-text-muted;
        line-height: 1.5;

        strong {
          color: $color-accent-scarlet;
        }
      }
    }
  }
}
</style>
