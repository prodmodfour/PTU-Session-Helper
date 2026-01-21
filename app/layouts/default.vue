<template>
  <div class="app-layout">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg-radial;
  position: relative;

  // Ambient glow effect
  &::before {
    content: '';
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 30%, rgba($color-accent-violet, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 70% 70%, rgba($color-accent-scarlet, 0.05) 0%, transparent 40%);
    pointer-events: none;
    animation: ambient-shift 20s ease-in-out infinite;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

@keyframes ambient-shift {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-5%, -5%);
  }
}
</style>
