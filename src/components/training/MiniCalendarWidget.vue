<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">打卡日历</CardTitle>
        <span class="text-xs text-muted-foreground">{{ year }}年{{ month }}月</span>
      </div>
    </CardHeader>
    <CardContent>
      <!-- 星期标题 -->
      <div class="grid grid-cols-7 gap-1 mb-1">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-xs text-muted-foreground font-medium py-1"
        >
          {{ day }}
        </div>
      </div>

      <!-- 日历方格 -->
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(cell, index) in calendarCells"
          :key="index"
          class="aspect-square flex items-center justify-center rounded-md text-xs transition-colors"
          :class="cellClass(cell)"
        >
          <span v-if="cell.day">{{ cell.day }}</span>
        </div>
      </div>

      <!-- 底部统计 -->
      <div class="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
        <span class="text-sm text-muted-foreground">
          本月 <span class="font-semibold text-foreground">{{ trainedDays }}</span>/{{ totalDaysInMonth }} 天
        </span>
        <span class="text-muted-foreground">·</span>
        <span class="text-sm" :class="streakDays >= 3 ? 'text-orange-500 font-semibold' : 'text-muted-foreground'">
          连续 {{ streakDays }} 天
          <span v-if="streakDays >= 3" class="inline-block fire-animation">🔥</span>
        </span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTrainingCalendar, type TrainingCalendarDay } from '@/api/progress'

const props = withDefaults(defineProps<{
  streakDays?: number
}>(), {
  streakDays: 0,
})

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1

const calendarData = ref<TrainingCalendarDay[]>([])

interface CalendarCell {
  day: number | null
  isToday: boolean
  hasTrained: boolean
}

const totalDaysInMonth = computed(() => new Date(year, month, 0).getDate())

const trainedDays = computed(() =>
  calendarData.value.filter(d => d.hasTraining).length
)

const calendarCells = computed<CalendarCell[]>(() => {
  const firstDay = new Date(year, month - 1, 1)
  // getDay(): 0=Sun, adjust to Mon-based (0=Mon)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const trainedSet = new Set(
    calendarData.value.filter(d => d.hasTraining).map(d => d.date)
  )

  const cells: CalendarCell[] = []

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, isToday: false, hasTrained: false })
  }

  for (let d = 1; d <= totalDaysInMonth.value; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      isToday: dateStr === todayStr,
      hasTrained: trainedSet.has(dateStr),
    })
  }

  return cells
})

function cellClass(cell: CalendarCell): string {
  if (!cell.day) return ''
  const classes: string[] = []
  if (cell.hasTrained) {
    classes.push('bg-green-500 text-white font-medium')
  }
  if (cell.isToday) {
    classes.push(cell.hasTrained ? 'ring-2 ring-blue-400 ring-offset-1' : 'ring-2 ring-blue-400 ring-offset-1 text-blue-600 font-medium')
  }
  if (!cell.hasTrained && !cell.isToday) {
    classes.push('text-muted-foreground')
  }
  return classes.join(' ')
}

onMounted(async () => {
  try {
    const response = await getTrainingCalendar({ year, month })
    if (response.code === 200 && response.data) {
      calendarData.value = response.data
    }
  } catch (e) {
    console.error('Failed to load calendar data:', e)
  }
})
</script>

<style scoped>
.fire-animation {
  animation: fire-pulse 1s ease-in-out infinite;
}

@keyframes fire-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}
</style>
