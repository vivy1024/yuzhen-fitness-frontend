<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-base flex items-center gap-2">
        <TrendingUp class="h-4 w-4" />
        FFMI趋势
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="data.length > 0" class="space-y-4">
        <!-- 简化的趋势图 -->
        <div class="relative h-40 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <svg class="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
            <!-- 网格线 -->
            <line v-for="i in 4" :key="'h'+i" 
                  :x1="0" :y1="i * 25" :x2="300" :y2="i * 25" 
                  stroke="#e5e7eb" stroke-width="1" />
            
            <!-- 趋势线 -->
            <polyline
              :points="chartPoints"
              fill="none"
              stroke="#8b5cf6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in dataPoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="4"
              fill="#8b5cf6"
              class="cursor-pointer"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            />
          </svg>
          
          <!-- 悬浮提示 -->
          <div v-if="hoveredIndex !== null && dataPoints[hoveredIndex]"
               class="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
               :style="{ 
                 left: `${(dataPoints[hoveredIndex].x / 300) * 100}%`, 
                 top: `${(dataPoints[hoveredIndex].y / 100) * 100}%`,
                 transform: 'translate(-50%, -120%)'
               }">
            <div>FFMI: {{ data[hoveredIndex].ffmi_data.normalized_ffmi }}</div>
            <div class="text-gray-400">{{ formatDate(data[hoveredIndex].recorded_at) }}</div>
          </div>
        </div>
        
        <!-- 数据列表 -->
        <div class="space-y-2">
          <div v-for="(record, index) in data.slice(0, 5)" :key="record.id"
               class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="text-sm">
              <span class="text-gray-500">{{ formatDate(record.recorded_at) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{{ record.ffmi_data.normalized_ffmi }}</span>
              <Badge :variant="getAssessmentVariant(record.ffmi_data.assessment)" size="sm">
                {{ record.ffmi_data.assessment }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="text-center py-8 text-gray-500">
        <TrendingUp class="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>暂无FFMI历史数据</p>
        <p class="text-xs mt-1">完善身体数据后将自动计算</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-vue-next'
import type { FFMIHistory } from '@/api/user'

const props = defineProps<{
  data: FFMIHistory[]
  height?: number
}>()

const hoveredIndex = ref<number | null>(null)

// 计算数据点位置
const dataPoints = computed(() => {
  if (props.data.length === 0) return []
  
  const minFFMI = Math.min(...props.data.map(d => d.ffmi_data.normalized_ffmi)) - 1
  const maxFFMI = Math.max(...props.data.map(d => d.ffmi_data.normalized_ffmi)) + 1
  const range = maxFFMI - minFFMI || 1
  
  return props.data.map((record, index) => ({
    x: (index / Math.max(props.data.length - 1, 1)) * 280 + 10,
    y: 90 - ((record.ffmi_data.normalized_ffmi - minFFMI) / range) * 80,
  }))
})

// 生成SVG路径点
const chartPoints = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 格式化日期
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 获取评估等级的Badge变体
function getAssessmentVariant(assessment: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (assessment.includes('偏低')) return 'destructive'
  if (assessment.includes('一般')) return 'outline'
  if (assessment.includes('良好') || assessment.includes('优秀')) return 'default'
  return 'secondary'
}
</script>
