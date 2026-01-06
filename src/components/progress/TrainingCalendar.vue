<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <CalendarIcon class="h-4 w-4" />
          训练日历
        </CardTitle>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            训练日
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-muted"></span>
            休息日
          </span>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <!-- 加载状态 -->
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
        <div class="grid grid-cols-7 gap-1">
          <div v-for="i in 35" :key="i" class="h-9 bg-muted rounded"></div>
        </div>
      </div>

      <!-- 日历 -->
      <div v-else>
        <!-- 月份导航 -->
        <div class="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" @click="prevMonth">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="font-medium">{{ currentMonthLabel }}</span>
          <Button variant="ghost" size="icon" @click="nextMonth">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <!-- 星期标题 -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div
            v-for="day in weekDays"
            :key="day"
            class="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {{ day }}
          </div>
        </div>

        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="relative"
          >
            <button
              v-if="day"
              :class="[
                'w-full h-9 rounded-md text-sm font-normal transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                day.isToday && !day.hasTraining ? 'bg-accent text-accent-foreground' : '',
                day.hasTraining ? 'bg-green-500/20 text-green-700 dark:text-green-400' : '',
                day.isSelected ? 'bg-primary text-primary-foreground' : '',
                !day.isCurrentMonth ? 'text-muted-foreground opacity-50' : '',
              ]"
              @click="handleDayClick(day)"
            >
              {{ day.dayNumber }}
              <!-- 训练指示器 -->
              <span
                v-if="day.hasTraining && day.isCurrentMonth"
                class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500"
              ></span>
            </button>
            <div v-else class="w-full h-9"></div>
          </div>
        </div>

        <!-- 选中日期详情 -->
        <div v-if="selectedDay && selectedDayData" class="mt-4 p-3 rounded-lg bg-muted/50">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-sm">{{ formatSelectedDate }}</span>
            <Badge v-if="selectedDayData.hasTraining" variant="default" class="bg-green-500">
              已训练
            </Badge>
            <Badge v-else variant="secondary">休息日</Badge>
          </div>
          <div v-if="selectedDayData.hasTraining" class="space-y-1 text-sm text-muted-foreground">
            <div class="flex justify-between">
              <span>训练次数</span>
              <span>{{ selectedDayData.sessionCount }} 次</span>
            </div>
            <div class="flex justify-between">
              <span>总训练量</span>
              <span>{{ formatVolume(selectedDayData.totalVolume) }}</span>
            </div>
            <div v-if="selectedDayData.feeling" class="flex justify-between">
              <span>训练感受</span>
              <span>{{ getFeelingText(selectedDayData.feeling) }}</span>
            </div>
          </div>
          <Button
            v-if="selectedDayData.hasTraining"
            variant="outline"
            size="sm"
            class="w-full mt-3"
            @click="$emit('view-detail', selectedDay)"
          >
            查看详情
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TrainingCalendarDay } from '@/api/progress'

// ============ Props & Emits ============

interface Props {
  calendarData: TrainingCalendarDay[]
  loading?: boolean
  initialYear?: number
  initialMonth?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'month-change': [year: number, month: number]
  'day-click': [date: string]
  'view-detail': [date: string]
}>()

// ============ 状态 ============

const currentYear = ref(props.initialYear || new Date().getFullYear())
const currentMonth = ref(props.initialMonth || new Date().getMonth() + 1)
const selectedDay = ref<string | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// ============ 计算属性 ============

/** 当前月份标签 */
const currentMonthLabel = computed(() => {
  return `${currentYear.value}年${currentMonth.value}月`
})

/** 日历数据映射 */
const calendarDataMap = computed(() => {
  const map = new Map<string, TrainingCalendarDay>()
  props.calendarData.forEach(day => {
    map.set(day.date, day)
  })
  return map
})

/** 日历天数 */
interface CalendarDay {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasTraining: boolean
}

const calendarDays = computed((): (CalendarDay | null)[] => {
  const year = currentYear.value
  const month = currentMonth.value
  
  // 当月第一天
  const firstDay = new Date(year, month - 1, 1)
  // 当月最后一天
  const lastDay = new Date(year, month, 0)
  // 当月天数
  const daysInMonth = lastDay.getDate()
  // 第一天是星期几
  const startDayOfWeek = firstDay.getDay()
  
  const today = new Date()
  const todayStr = formatDate(today)
  
  const days: (CalendarDay | null)[] = []
  
  // 填充上月的空白
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  
  // 填充当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateStr = formatDate(date)
    const dayData = calendarDataMap.value.get(dateStr)
    
    days.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDay.value,
      hasTraining: dayData?.hasTraining || false,
    })
  }
  
  return days
})

/** 选中日期的数据 */
const selectedDayData = computed(() => {
  if (!selectedDay.value) return null
  return calendarDataMap.value.get(selectedDay.value) || {
    date: selectedDay.value,
    hasTraining: false,
    sessionCount: 0,
    totalVolume: 0,
  }
})

/** 格式化选中日期 */
const formatSelectedDate = computed(() => {
  if (!selectedDay.value) return ''
  const date = new Date(selectedDay.value)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
})

// ============ 方法 ============

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 上一个月 */
function prevMonth(): void {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  emit('month-change', currentYear.value, currentMonth.value)
}

/** 下一个月 */
function nextMonth(): void {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  emit('month-change', currentYear.value, currentMonth.value)
}

/** 点击日期 */
function handleDayClick(day: CalendarDay): void {
  selectedDay.value = day.date
  emit('day-click', day.date)
}

/** 格式化训练量 */
function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}t`
  }
  return `${volume.toFixed(0)}kg`
}

/** 获取感受文本 */
function getFeelingText(feeling: string): string {
  const texts: Record<string, string> = {
    excellent: '非常好 😄',
    good: '良好 🙂',
    fair: '一般 😐',
    poor: '较差 😔',
  }
  return texts[feeling] || feeling
}

// ============ 监听 ============

watch([currentYear, currentMonth], () => {
  selectedDay.value = null
})
</script>
