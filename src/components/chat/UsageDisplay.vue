<script setup lang="ts">
/**
 * 用量展示组件（已改为积分余额展示）
 * 
 * 原先显示 DAG/Agent 次数，现改为显示积分余额
 * 使用 CreditBalanceCard compact 模式
 * 
 * @see CreditBalanceCard.vue
 * @author 薛小川
 * @updated 2026-02-05 改为积分展示
 */
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCreditsStore } from '@/stores/credits'
import { useAuthStore } from '@/stores/auth'
import CreditBalanceCard from '@/components/credits/CreditBalanceCard.vue'

// Props
interface Props {
  /** 是否显示详细信息 */
  showDetail?: boolean
  /** 是否紧凑模式 */
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  showDetail: false,
  compact: false
})

const router = useRouter()
const creditsStore = useCreditsStore()
const authStore = useAuthStore()

// 是否已登录
const isLoggedIn = computed(() => authStore.isAuthenticated)

// 跳转到积分中心
function goToCredits() {
  router.push('/credits')
}

// 初始化
onMounted(async () => {
  if (isLoggedIn.value && !creditsStore.balance) {
    await creditsStore.loadBalance()
  }
})

// 监听登录状态变化
watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await creditsStore.loadBalance()
  }
})
</script>

<template>
  <div v-if="isLoggedIn" class="usage-display">
    <CreditBalanceCard
      :balance="creditsStore.balance"
      :compact="compact"
      @click="goToCredits"
    />
  </div>
</template>
