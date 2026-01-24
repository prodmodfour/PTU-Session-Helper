<template>
  <div class="gm-layout">
    <header class="gm-header">
      <div class="gm-header__brand">
        <div class="gm-header__logo">
          <img src="/icons/ui/encounter.svg" alt="" class="gm-header__logo-icon" />
        </div>
        <div class="gm-header__title">
          <h1>PTU Session Helper</h1>
          <span class="gm-header__badge">GM View</span>
        </div>
      </div>

      <nav class="gm-header__nav">
        <NuxtLink to="/gm" class="gm-nav-link" active-class="gm-nav-link--active" :class="{ 'gm-nav-link--active': $route.path === '/gm' }">
          <img src="/icons/ui/encounter.svg" alt="" class="gm-nav-link__icon" />
          <span>Encounter</span>
        </NuxtLink>
        <NuxtLink to="/gm/encounters" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/phosphor/books.svg" alt="" class="gm-nav-link__icon" />
          <span>Encounters</span>
        </NuxtLink>
        <NuxtLink to="/gm/habitats" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/phosphor/tree.svg" alt="" class="gm-nav-link__icon" />
          <span>Habitats</span>
        </NuxtLink>
        <NuxtLink to="/gm/library" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/ui/library.svg" alt="" class="gm-nav-link__icon" />
          <span>Library</span>
        </NuxtLink>
        <NuxtLink to="/gm/create" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/ui/create.svg" alt="" class="gm-nav-link__icon" />
          <span>Create</span>
        </NuxtLink>
      </nav>

      <div class="gm-header__actions">
        <NuxtLink to="/group" target="_blank" class="btn btn--secondary btn--sm gm-header__group-btn">
          <img src="/icons/ui/player-view.svg" alt="" class="btn-icon" />
          <span>Group View</span>
        </NuxtLink>
      </div>
    </header>
    <main class="gm-main">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.gm-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg-radial;
}

.gm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-xl;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color-default;
  position: sticky;
  top: 0;
  z-index: $z-index-sticky;

  // Gradient accent line
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: $gradient-sv-cool;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__logo {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
    box-shadow: $shadow-glow-scarlet;
  }

  &__logo-icon {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h1 {
      font-size: $font-size-lg;
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__badge {
    background: $gradient-sv-primary;
    color: $color-text;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__nav {
    display: flex;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__group-btn {
    .btn-icon {
      width: 18px;
      height: 18px;
      filter: brightness(0) invert(1);
      opacity: 0.9;
    }
  }
}

.gm-nav-link {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  color: $color-text-muted;
  font-weight: 500;
  font-size: $font-size-sm;
  border-radius: $border-radius-md;
  transition: all $transition-fast;
  text-decoration: none;
  position: relative;

  &__icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(0.7);
    transition: filter $transition-fast;
  }


  &:hover {
    color: $color-text;
    background: $color-bg-hover;

    .gm-nav-link__icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    color: $color-text;
    background: $gradient-sv-cool;
    box-shadow: $shadow-glow-scarlet;

    .gm-nav-link__icon {
      filter: brightness(0) invert(1);
    }

    &:hover {
      background: $gradient-sv-cool;
    }
  }
}

.gm-main {
  flex: 1;
  padding: $spacing-xl;
  overflow-y: auto;
}
</style>
