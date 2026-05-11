<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <h1 class="text-lg font-semibold">训练模板</h1>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- 筛选 -->
      <div class="flex gap-2">
        <Select v-model="filterGoal">
          <SelectTrigger class="flex-1">
            <SelectValue placeholder="训练目标" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部目标</SelectItem>
            <SelectItem value="hypertrophy">增肌</SelectItem>
            <SelectItem value="fat_loss">减脂</SelectItem>
            <SelectItem value="strength">增强力量</SelectItem>
            <SelectItem value="endurance">提高耐力</SelectItem>
            <SelectItem value="body_shaping">塑形</SelectItem>
            <SelectItem value="general_fitness">综合健身</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="filterLevel">
          <SelectTrigger class="flex-1">
            <SelectValue placeholder="难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部难度</SelectItem>
            <SelectItem value="beginner">初级</SelectItem>
            <SelectItem value="intermediate">中级</SelectItem>
            <SelectItem value="advanced">高级</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 模板列表 -->
      <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">加载中...</div>
      <div v-else-if="templates.length === 0" class="py-12 text-center">
        <BookOpen class="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
        <p class="text-sm text-muted-foreground">暂无匹配模板</p>
      </div>
      <div v-else class="grid gap-3">
        <TemplateCard
          v-for="tpl in templates"
          :key="tpl.id"
          :template="tpl"
          @use="handleUseTemplate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, BookOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import TemplateCard from '@/components/training/TemplateCard.vue'
import { getTemplates, useTemplate, type PlanTemplate } from '@/api/training-plan'

const router = useRouter()
const { toast } = useToast()

const templates = ref<PlanTemplate[]>([])
const loading = ref(false)
const filterGoal = ref('all')
const filterLevel = ref('all')

async function fetchTemplates() {
  loading.value = true
  try {
    const res = await getTemplates({
      goal: filterGoal.value === 'all' ? undefined : filterGoal.value,
      level: filterLevel.value === 'all' ? undefined : filterLevel.value,
    })
    templates.value = res.data || []
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

async function handleUseTemplate(id: number) {
  try {
    const res = await useTemplate(id)
    toast({ title: `已从模板创建计划：${res.data.name}` })
    router.push('/training/plans')
  } catch (err: any) {
    toast({ title: err?.response?.data?.msg || '创建失败', variant: 'destructive' })
  }
}

watch([filterGoal, filterLevel], fetchTemplates)
onMounted(fetchTemplates)
</script>
