<script setup lang="ts">
import { usePWAInstall } from '@/composables/usePWAInstall'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-vue-next'

const { canInstall, install, dismiss } = usePWAInstall()

async function handleInstall() {
  await install()
}
</script>

<template>
  <Transition name="slide-up">
    <div 
      v-if="canInstall" 
      class="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
    >
      <Card class="shadow-lg border-primary/20">
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download class="h-5 w-5 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-sm">安装玉珍健身</h3>
              <p class="text-xs text-muted-foreground mt-1">
                添加到主屏幕，获得更好的体验
              </p>
            </div>
            <Button size="icon" variant="ghost" class="shrink-0 -mt-1 -mr-1" @click="dismiss">
              <X class="h-4 w-4" />
            </Button>
          </div>
          <div class="flex gap-2 mt-3">
            <Button size="sm" class="flex-1" @click="handleInstall">
              立即安装
            </Button>
            <Button size="sm" variant="outline" @click="dismiss">
              稍后再说
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
