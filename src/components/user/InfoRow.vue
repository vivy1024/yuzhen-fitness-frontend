<template>
  <div class="flex justify-between items-center">
    <span class="text-sm text-gray-600 dark:text-gray-400">{{ label }}</span>
    <span class="text-sm font-medium">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>
