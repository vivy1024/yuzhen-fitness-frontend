<script setup lang="ts">
/**
 * 积分消耗徽章
 * 用于对话中显示本次消耗
 */
const props = defineProps<{
  cost: number
}>()
</script>

<template>
  <span
    v-if="cost === 0"
    class="text-xs text-muted-foreground"
  >
    免费
  </span>
  <span
    v-else
    class="text-xs text-muted-foreground"
  >
    -{{ cost.toFixed(2) }}
  </span>
</template>
