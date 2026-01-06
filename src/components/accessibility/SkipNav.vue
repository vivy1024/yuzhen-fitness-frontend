<template>
  <a
    href="#main-content"
    class="skip-nav"
    @click.prevent="skipToMain"
  >
    跳转到主内容
  </a>
</template>

<script setup lang="ts">
import { useSkipNav } from '@/composables/useAccessibility'

const { skipToMain } = useSkipNav()
</script>

<style scoped>
.skip-nav {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
  padding: 8px 16px;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  text-decoration: none;
  border-radius: 0 0 4px 0;
  font-weight: 500;
  transition: top 0.2s;
}

.skip-nav:focus {
  top: 0;
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
</style>
