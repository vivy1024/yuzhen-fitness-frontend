<template>
  <!-- 浮动按钮样式 -->
  <div
    v-if="variant === 'floating'"
    class="fixed bottom-20 right-4 z-50"
  >
    <Button
      size="icon"
      class="h-12 w-12 rounded-full shadow-lg"
      :class="modelValue === 'male' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-pink-500 hover:bg-pink-600'"
      @click="toggleGender"
    >
      <User class="w-6 h-6 text-white" />
    </Button>
  </div>

  <!-- 切换按钮组样式 -->
  <div
    v-else-if="variant === 'toggle'"
    class="flex gap-2"
    @click.stop
  >
    <Button
      v-for="option in genderOptions"
      :key="option.value"
      :variant="modelValue === option.value ? 'default' : 'outline'"
      size="sm"
      class="h-7 text-xs"
      @click="handleSelect(option.value)"
    >
      <component :is="option.icon" class="w-3 h-3 mr-1" />
      {{ option.label }}
    </Button>
  </div>

  <!-- 芯片样式 -->
  <div
    v-else-if="variant === 'chip'"
    class="flex items-center gap-3"
  >
    <Badge
      :class="modelValue === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
      class="text-white"
    >
      <User class="w-3 h-3 mr-1" />
      {{ currentGenderLabel }}演示
    </Badge>
    
    <Button
      size="sm"
      @click="toggleGender"
    >
      <Users class="w-3 h-3 mr-1" />
      切换到{{ otherGenderLabel }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import type { Gender } from '@/types/exercise'

type GenderSwitchVariant = 'floating' | 'toggle' | 'chip'

interface Props {
  modelValue: Gender
  variant?: GenderSwitchVariant
  showToast?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'male',
  variant: 'toggle',
  showToast: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Gender): void
  (e: 'change', value: Gender): void
}>()

const { toast } = useToast()

const genderOptions = [
  { label: '男', value: 'male' as Gender, icon: User },
  { label: '女', value: 'female' as Gender, icon: Users },
]

const currentGenderLabel = computed(() => props.modelValue === 'male' ? '男性' : '女性')
const otherGenderLabel = computed(() => props.modelValue === 'male' ? '女性' : '男性')

function toggleGender() {
  const newValue: Gender = props.modelValue === 'male' ? 'female' : 'male'
  handleSelect(newValue)
}

function handleSelect(value: Gender) {
  emit('update:modelValue', value)
  emit('change', value)

  if (props.showToast) {
    toast({
      description: `切换到${value === 'male' ? '男性' : '女性'}`,
      duration: 1000,
    })
  }
}
</script>
