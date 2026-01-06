<script setup lang="ts">
/**
 * 时序图表组件
 * 基于ECharts实现，支持多系列折线图
 * 使用按需导入优化包体积
 */
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
// 按需导入ECharts核心模块
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts, ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
} from 'echarts/components'

// 注册必要的组件
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

// 定义图表选项类型
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

interface SeriesData {
  name: string
  data: [number, number][]  // [timestamp, value]
  color?: string
}

const props = withDefaults(defineProps<{
  title?: string
  series: SeriesData[]
  yAxisLabel?: string
  yAxisFormat?: 'number' | 'percent' | 'bytes' | 'duration' | 'ops'
  height?: string
  showLegend?: boolean
  areaStyle?: boolean
  stack?: boolean
}>(), {
  title: '',
  yAxisLabel: '',
  yAxisFormat: 'number',
  height: '300px',
  showLegend: true,
  areaStyle: false,
  stack: false
})

const chartRef = ref<HTMLDivElement>()
let chart: ECharts | null = null

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
]

// 格式化Y轴值
function formatValue(value: number): string {
  switch (props.yAxisFormat) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`
    case 'bytes':
      if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)}GB`
      if (value >= 1048576) return `${(value / 1048576).toFixed(1)}MB`
      if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`
      return `${value}B`
    case 'duration':
      if (value >= 60) return `${(value / 60).toFixed(1)}m`
      if (value >= 1) return `${value.toFixed(2)}s`
      return `${(value * 1000).toFixed(0)}ms`
    case 'ops':
      return `${value.toFixed(1)}/s`
    default:
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(2)
  }
}

const chartOption = computed<ECOption>(() => ({
  title: props.title ? {
    text: props.title,
    left: 'center',
    textStyle: { fontSize: 14, fontWeight: 500 }
  } : undefined,
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      if (!params || params.length === 0) return ''
      const time = new Date(params[0].value[0]).toLocaleTimeString()
      let html = `<div style="font-weight:500">${time}</div>`
      params.forEach((p: any) => {
        html += `<div style="display:flex;align-items:center;gap:4px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
          <span>${p.seriesName}: ${formatValue(p.value[1])}</span>
        </div>`
      })
      return html
    }
  },
  legend: props.showLegend ? {
    bottom: 0,
    type: 'scroll'
  } : undefined,
  grid: {
    left: '3%',
    right: '4%',
    bottom: props.showLegend ? '15%' : '3%',
    top: props.title ? '15%' : '3%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: (value: number) => {
        const date = new Date(value)
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }
    }
  },
  yAxis: {
    type: 'value',
    name: props.yAxisLabel,
    axisLabel: {
      formatter: (value: number) => formatValue(value)
    }
  },
  series: props.series.map((s, i) => ({
    name: s.name,
    type: 'line' as const,
    data: s.data,
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 2 },
    itemStyle: { color: s.color || colors[i % colors.length] },
    areaStyle: props.areaStyle ? { opacity: 0.3 } : undefined,
    stack: props.stack ? 'total' : undefined
  }))
}))

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption(chartOption.value)
}

function resizeChart() {
  chart?.resize()
}

watch(() => props.series, () => {
  chart?.setOption(chartOption.value)
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>

<template>
  <div ref="chartRef" :style="{ height, width: '100%' }"></div>
</template>
