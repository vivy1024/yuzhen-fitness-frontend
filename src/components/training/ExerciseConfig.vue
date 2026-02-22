<template>
  <div class="space-y-3 p-3 bg-muted/50 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab" />
        <span class="text-sm font-medium">{{ exercise.exercise_name }}</span>
      </div>
      <Button variant="ghost" size="icon" class="h-7 w-7" @click="emit('remove')">
        <Trash2 class="w-3.5 h-3.5 text-destructive" />
      </Button>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <div>
        <Label class="text-xs text-muted-foreground">组数</Label>
        <Input
          type="number"
          :model-value="exercise.sets"
          min="1"
          max="20"
          class="h-8 text-sm"
          @update:model-value="update('sets', Number($event))"
        />
      </div>
      <div>
        <Label class="text-xs text-muted-foreground">次数</Label>
        <Input
          :model-value="exercise.reps"
          placeholder="8-12"
          class="h-8 text-sm"
          @update:model-value="update('reps', $event)"
        />
      </div>
      <div>
        <Label class="text-xs text-muted-foreground">重量</Label>
        <Input
          :model-value="exercise.weight"
          placeholder="60kg"
          class="h-8 text-sm"
          @update:model-value="update('weight', $event)"
        />
      </div>
      <div>
        <Label class="text-xs text-muted-foreground">休息</Label>
        <Input
          :model-value="exercise.rest_time"
          placeholder="60s"
          class="h-8 text-sm"
          @update:model-value="update('rest_time', $event)"
        />
      </div>
    </div>

    <Input
      :model-value="exercise.notes"
      placeholder="备注（可选）"
      class="h-8 text-sm"
      @update:model-value="update('notes', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { GripVertical, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface PlanExerciseForm {
  exercise_id?: number
  exercise_name: string
  day_of_week?: number
  sets: number
  reps: string
  weight?: string
  rest_time?: string
  notes?: string
  order_index?: number
}

const props = defineProps<{
  exercise: PlanExerciseForm
}>()

const emit = defineEmits<{
  (e: 'update', data: PlanExerciseForm): void
  (e: 'remove'): void
}>()

function update(field: string, value: any) {
  emit('update', { ...props.exercise, [field]: value })
}
</script>
