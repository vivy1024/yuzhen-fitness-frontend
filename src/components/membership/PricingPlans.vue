<script setup lang="ts">
/**
 * 会员套餐定价组件
 * 显示所有会员套餐，支持套餐选择
 */
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Sparkles, Zap } from 'lucide-vue-next'
import type { MembershipTier } from '@/api/membership'

interface Props {
  tiers: MembershipTier[]
  currentTierId?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  select: [tier: MembershipTier]
}>()

// 获取套餐图标
function getTierIcon(slug: string) {
  switch (slug) {
    case 'basic':
      return Zap
    case 'premium':
      return Crown
    case 'pro':
      return Sparkles
    default:
      return Zap
  }
}

// 获取套餐渐变色
function getTierGradient(slug: string, popular?: boolean) {
  if (popular) {
    return 'from-amber-500 to-orange-500'
  }
  switch (slug) {
    case 'basic':
      return 'from-blue-500 to-cyan-500'
    case 'premium':
      return 'from-purple-500 to-pink-500'
    case 'pro':
      return 'from-emerald-500 to-teal-500'
    default:
      return 'from-gray-500 to-slate-500'
  }
}

// 格式化价格
function formatPrice(price: number | undefined | null) {
  if (price === undefined || price === null) return '0.00'
  return Number(price).toFixed(2)
}

// 计算每日价格
function getDailyPrice(price: number | undefined | null, days: number | undefined | null) {
  if (!price || !days || days === 0) return '0.00'
  return (Number(price) / Number(days)).toFixed(2)
}

// 是否是当前套餐
function isCurrentTier(tierId: number) {
  return props.currentTierId === tierId
}

function handleSelect(tier: MembershipTier) {
  if (!isCurrentTier(tier.id)) {
    emit('select', tier)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="tier in tiers" :key="tier.id">
      <Card 
        :class="[
          'relative overflow-hidden transition-all cursor-pointer',
          tier.popular ? 'ring-2 ring-amber-500 shadow-lg' : 'hover:shadow-md',
          isCurrentTier(tier.id) ? 'ring-2 ring-green-500' : ''
        ]"
        @click="handleSelect(tier)"
      >
        <!-- 热门标签 -->
        <div 
          v-if="tier.popular" 
          class="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg"
        >
          最受欢迎
        </div>
        
        <!-- 当前套餐标签 -->
        <div 
          v-if="isCurrentTier(tier.id)" 
          class="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg"
        >
          当前套餐
        </div>

        <CardHeader class="pb-2">
          <div class="flex items-center gap-3">
            <div 
              :class="[
                'h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
                getTierGradient(tier.slug, tier.popular)
              ]"
            >
              <component :is="getTierIcon(tier.slug)" class="h-6 w-6" />
            </div>
            <div>
              <CardTitle class="text-lg">{{ tier.name }}</CardTitle>
              <CardDescription>{{ tier.duration_days }}天会员</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-4">
          <!-- 价格区域 -->
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold">¥{{ formatPrice(tier.price) }}</span>
            <span v-if="tier.original_price && tier.original_price > tier.price" class="text-sm text-muted-foreground line-through">
              ¥{{ formatPrice(tier.original_price) }}
            </span>
            <Badge v-if="tier.discount_percent" variant="destructive" class="ml-2">
              省{{ tier.discount_percent }}%
            </Badge>
          </div>
          
          <p class="text-sm text-muted-foreground">
            约 ¥{{ getDailyPrice(tier.price, tier.duration_days) }}/天
          </p>

          <!-- 功能列表 -->
          <ul class="space-y-2">
            <li v-for="(feature, index) in tier.features" :key="index" class="flex items-center gap-2 text-sm">
              <Check class="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <!-- 权益限制 -->
          <div class="pt-2 border-t space-y-1 text-sm text-muted-foreground">
            <p>• 每日AI对话 {{ tier.limits.daily_ai_queries === -1 ? '无限次' : tier.limits.daily_ai_queries + '次' }}</p>
            <p>• 训练计划 {{ tier.limits.max_training_plans === -1 ? '无限个' : '最多' + tier.limits.max_training_plans + '个' }}</p>
            <p v-if="tier.limits.advanced_features">• 解锁全部高级功能</p>
          </div>

          <!-- 选择按钮 - 免费套餐不显示购买按钮 -->
          <Button 
            v-if="tier.price > 0"
            :class="[
              'w-full',
              tier.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''
            ]"
            :variant="isCurrentTier(tier.id) ? 'outline' : 'default'"
            :disabled="isCurrentTier(tier.id) || loading"
          >
            {{ isCurrentTier(tier.id) ? '当前套餐' : '选择此套餐' }}
          </Button>
          <!-- 免费套餐显示当前状态 -->
          <div v-else-if="tier.slug === 'free'" class="text-center text-sm text-muted-foreground py-2">
            {{ isCurrentTier(tier.id) ? '✓ 当前使用中' : '默认套餐' }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 空状态 -->
    <div v-if="tiers.length === 0 && !loading" class="text-center py-8 text-muted-foreground">
      暂无可用套餐
    </div>
  </div>
</template>
