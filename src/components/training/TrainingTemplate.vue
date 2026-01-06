<template>
  <div>
    <!-- 模板列表 -->
    <div v-if="!showCreateForm" class="space-y-4">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">训练模板</h3>
        <Button size="sm" @click="showCreateForm = true">
          <Plus class="w-4 h-4 mr-1" />
          新建模板
        </Button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="space-y-3">
        <Card v-for="i in 3" :key="i" class="p-4">
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-muted rounded w-1/3"></div>
            <div class="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </Card>
      </div>

      <!-- 模板列表 -->
      <div v-else-if="templates.length > 0" class="space-y-3">
        <Card
          v-for="template in templates"
          :key="template.id"
          class="p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold mb-1">{{ template.name }}</h4>
              <p v-if="template.description" class="text-sm text-muted-foreground mb-2">
                {{ template.description }}
              </p>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="(exercise, index) in template.exercises.slice(0, 3)"
                  :key="index"
                  variant="outline"
                  class="text-xs"
                >
                  {{ exercise.name }}
                </Badge>
                <Badge
                  v-if="template.exercises.length > 3"
                  variant="outline"
                  class="text-xs"
                >
                  +{{ template.exercises.length - 3 }}
                </Badge>
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                @click.stop="useTemplate(template)"
              >
                使用
              </Button>
              <Button
                size="sm"
                variant="ghost"
                @click.stop="deleteTemplate(template.id)"
              >
                <Trash2 class="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- 空状态 -->
      <Card v-else class="p-8">
        <div class="text-center">
          <div class="text-4xl mb-4">📋</div>
          <h3 class="text-lg font-semibold mb-2">暂无训练模板</h3>
          <p class="text-sm text-muted-foreground mb-4">
            创建模板以快速开始常用训练
          </p>
          <Button @click="showCreateForm = true">
            <Plus class="w-4 h-4 mr-1" />
            创建模板
          </Button>
        </div>
      </Card>
    </div>

    <!-- 创建模板表单 -->
    <Card v-else class="p-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">创建训练模板</h3>
          <Button
            variant="ghost"
            size="sm"
            @click="cancelCreate"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- 模板名称 -->
        <div>
          <Label class="mb-2 block">模板名称 *</Label>
          <Input
            v-model="newTemplate.name"
            placeholder="例如：胸+三头训练"
          />
        </div>

        <!-- 模板描述 -->
        <div>
          <Label class="mb-2 block">模板描述</Label>
          <Textarea
            v-model="newTemplate.description"
            placeholder="简单描述这个模板的用途（可选）"
            class="min-h-[60px]"
          />
        </div>

        <!-- 训练动作 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <Label>训练动作 *</Label>
            <Button
              size="sm"
              variant="outline"
              @click="addExercise"
            >
              <Plus class="w-4 h-4 mr-1" />
              添加动作
            </Button>
          </div>

          <div class="space-y-3">
            <Card
              v-for="(exercise, index) in newTemplate.exercises"
              :key="index"
              class="p-3"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Input
                    v-model="exercise.name"
                    placeholder="动作名称"
                    class="flex-1 mr-2"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="removeExercise(index)"
                  >
                    <Trash2 class="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <Label class="text-xs mb-1 block">组数</Label>
                    <Input
                      v-model.number="exercise.sets"
                      type="number"
                      min="1"
                      class="h-9"
                    />
                  </div>
                  <div>
                    <Label class="text-xs mb-1 block">次数</Label>
                    <Input
                      v-model="exercise.reps"
                      placeholder="8-12"
                      class="h-9"
                    />
                  </div>
                  <div>
                    <Label class="text-xs mb-1 block">休息(秒)</Label>
                    <Input
                      v-model.number="exercise.rest"
                      type="number"
                      min="0"
                      step="10"
                      class="h-9"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3 pt-4">
          <Button
            variant="outline"
            class="flex-1"
            @click="cancelCreate"
          >
            取消
          </Button>
          <Button
            class="flex-1"
            @click="saveTemplate"
            :disabled="!canSave || saving"
          >
            <Check class="w-4 h-4 mr-1" />
            保存模板
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, X, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

// ============ Props & Emits ============

const emit = defineEmits<{
  useTemplate: [template: TrainingTemplate]
}>()

// ============ 类型定义 ============

interface TemplateExercise {
  exerciseId?: number
  name: string
  sets: number
  reps: string
  rest: number
}

interface TrainingTemplate {
  id: number
  name: string
  description?: string
  exercises: TemplateExercise[]
  createdAt: string
}

// ============ 状态 ============

const templates = ref<TrainingTemplate[]>([])
const loading = ref(false)
const saving = ref(false)
const showCreateForm = ref(false)

const newTemplate = ref({
  name: '',
  description: '',
  exercises: [] as TemplateExercise[],
})

// ============ 计算属性 ============

/** 是否可以保存 */
const canSave = computed(() => {
  return (
    newTemplate.value.name.trim() !== '' &&
    newTemplate.value.exercises.length > 0 &&
    newTemplate.value.exercises.every(ex => ex.name.trim() !== '')
  )
})

// ============ 方法 ============

/** 加载模板列表 */
async function loadTemplates(): Promise<void> {
  loading.value = true

  try {
    // 从localStorage加载（临时方案，待后端API对接）
    const stored = localStorage.getItem('training_templates')
    if (stored) {
      templates.value = JSON.parse(stored)
    }
  } catch (error: any) {
    console.error('Load templates error:', error)
    toast({
      title: '加载失败',
      description: '加载训练模板失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

/** 添加动作 */
function addExercise(): void {
  newTemplate.value.exercises.push({
    name: '',
    sets: 3,
    reps: '8-12',
    rest: 90,
  })
}

/** 移除动作 */
function removeExercise(index: number): void {
  newTemplate.value.exercises.splice(index, 1)
}

/** 保存模板 */
async function saveTemplate(): Promise<void> {
  if (!canSave.value) return

  saving.value = true

  try {
    const template: TrainingTemplate = {
      id: Date.now(),
      name: newTemplate.value.name,
      description: newTemplate.value.description,
      exercises: newTemplate.value.exercises,
      createdAt: new Date().toISOString(),
    }

    // 保存到localStorage（临时方案，待后端API对接）
    templates.value.push(template)
    localStorage.setItem('training_templates', JSON.stringify(templates.value))

    toast({
      title: '保存成功',
      description: '训练模板已保存',
    })

    // 重置表单
    resetForm()
    showCreateForm.value = false
  } catch (error: any) {
    console.error('Save template error:', error)
    toast({
      title: '保存失败',
      description: error.message || '保存训练模板失败',
      variant: 'destructive',
    })
  } finally {
    saving.value = false
  }
}

/** 使用模板 */
function useTemplate(template: TrainingTemplate): void {
  emit('useTemplate', template)
  toast({
    title: '模板已应用',
    description: `已加载"${template.name}"模板`,
  })
}

/** 删除模板 */
async function deleteTemplate(id: number): Promise<void> {
  if (!confirm('确定要删除这个训练模板吗？')) {
    return
  }

  try {
    templates.value = templates.value.filter(t => t.id !== id)
    localStorage.setItem('training_templates', JSON.stringify(templates.value))

    toast({
      title: '删除成功',
      description: '训练模板已删除',
    })
  } catch (error: any) {
    console.error('Delete template error:', error)
    toast({
      title: '删除失败',
      description: error.message || '删除训练模板失败',
      variant: 'destructive',
    })
  }
}

/** 取消创建 */
function cancelCreate(): void {
  resetForm()
  showCreateForm.value = false
}

/** 重置表单 */
function resetForm(): void {
  newTemplate.value = {
    name: '',
    description: '',
    exercises: [],
  }
}

// ============ 生命周期 ============

onMounted(() => {
  loadTemplates()
})
</script>
