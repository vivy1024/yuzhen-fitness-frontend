<script setup lang="ts">
// 备案信息组件
</script>

<template>
  <footer class="w-full py-6 px-4 bg-muted/30 border-t mt-auto">
    <div class="max-w-7xl mx-auto">
      <!-- 备案信息 -->
      <div class="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <!-- ICP备案 -->
        <div class="flex items-center gap-2">
          <a 
            href="https://beian.miit.gov.cn/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            陕ICP备2026000942号-1
          </a>
        </div>

        <!-- 公安备案 -->
        <div class="flex items-center gap-2">
          <img 
            src="/beian-icon.png" 
            alt="公安备案图标" 
            class="w-4 h-4"
          />
          <a 
            href="https://beian.mps.gov.cn/#/query/webSearch?code=61011602000758" 
            target="_blank" 
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            陕公网安备61011602000758号
          </a>
        </div>

        <!-- 版权信息 -->
        <div class="text-center">
          <p>© 2026 玉珍健身 · 智能健身应用</p>
          <p class="mt-1">开发者：薛小川 | 联系邮箱：1336495069@qq.com</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer {
  /* 确保footer在底部导航上方 */
  margin-bottom: 4rem;
}
</style>
