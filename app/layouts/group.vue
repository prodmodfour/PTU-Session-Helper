<template>
  <div class="group-layout">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.group-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg-radial;
  position: relative;

  // Subtle animated gradient overlay
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba($color-accent-violet, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba($color-accent-scarlet, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  // Optimized for 4K TV display
  @media (min-width: 3000px) {
    font-size: 1.5rem;
  }
}
</style>
