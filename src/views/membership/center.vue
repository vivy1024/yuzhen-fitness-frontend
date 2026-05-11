<script setup lang="ts">
/**
 * 会员中心页面（已重定向到积分中心）
 * 
 * @deprecated 旧会员中心已废弃，自动重定向到 /credits
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace('/credits')
})
</script>

<template>
  <div />
</template>
