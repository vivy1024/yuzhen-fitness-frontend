<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Shield, FileText, AlertTriangle, Check } from 'lucide-vue-next'

const router = useRouter()

// 是否已同意条款
const agreedToTerms = ref(false)
const agreedToPrivacy = ref(false)

// 当前显示的标签页
const activeTab = ref<'terms' | 'privacy' | 'disclaimer'>('terms')

// 检查是否已经同意过条款
const hasAgreed = ref(false)

// 计算是否可以提交
const canSubmit = computed(() => {
  return agreedToTerms.value === true && agreedToPrivacy.value === true
})

onMounted(() => {
  const agreed = localStorage.getItem('yuzhen_terms_agreed')
  if (agreed === 'true') {
    hasAgreed.value = true
  }
})

// 同意条款
function handleAgree() {
  if (canSubmit.value) {
    localStorage.setItem('yuzhen_terms_agreed', 'true')
    localStorage.setItem('yuzhen_terms_agreed_at', new Date().toISOString())
    router.push('/')
  }
}

// 返回
function handleBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="handleBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="ml-2 text-lg font-semibold">服务协议与免责声明</h1>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6 pb-32">
      <!-- 标签页切换 -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <Button
          :variant="activeTab === 'terms' ? 'default' : 'outline'"
          size="sm"
          @click="activeTab = 'terms'"
        >
          <FileText class="h-4 w-4 mr-1.5" />
          服务条款
        </Button>
        <Button
          :variant="activeTab === 'privacy' ? 'default' : 'outline'"
          size="sm"
          @click="activeTab = 'privacy'"
        >
          <Shield class="h-4 w-4 mr-1.5" />
          隐私政策
        </Button>
        <Button
          :variant="activeTab === 'disclaimer' ? 'default' : 'outline'"
          size="sm"
          @click="activeTab = 'disclaimer'"
        >
          <AlertTriangle class="h-4 w-4 mr-1.5" />
          免责声明
        </Button>
      </div>

      <!-- 服务条款 -->
      <Card v-show="activeTab === 'terms'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5" />
            玉珍健身服务条款
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea class="h-[400px] pr-4">
            <div class="space-y-4 text-sm text-muted-foreground">
              <p class="font-medium text-foreground">最后更新日期：2025年1月</p>
              
              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">1. 服务说明</h3>
                <p>玉珍健身是一款智能健身应用，提供以下服务：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>智能健身顾问：基于专业数据库的健身建议</li>
                  <li>训练计划生成：个性化训练计划设计</li>
                  <li>动作库查询：1790个专业健身动作</li>
                  <li>营养分析：1880个食物营养数据</li>
                  <li>进度追踪：训练记录和身体数据管理</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">2. 用户责任</h3>
                <p>使用本服务时，您同意：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>提供真实、准确的个人信息</li>
                  <li>根据自身健康状况合理使用建议</li>
                  <li>不将服务用于任何非法目的</li>
                  <li>保护账户安全，不与他人共享</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">3. 智能系统说明</h3>
                <p>本应用使用智能系统辅助生成健身建议：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>所有建议基于专业数据库和算法生成</li>
                  <li>建议仅供参考，不构成医疗或专业健身指导</li>
                  <li>用户应根据个人情况自行判断和调整</li>
                  <li>如有健康问题，请咨询专业医生或健身教练</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">4. 知识产权</h3>
                <p>本应用的所有内容（包括但不限于文字、图片、代码、数据）均受知识产权法保护。未经授权，不得复制、修改或分发。</p>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">5. 服务变更</h3>
                <p>我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。</p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <!-- 隐私政策 -->
      <Card v-show="activeTab === 'privacy'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            隐私政策
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea class="h-[400px] pr-4">
            <div class="space-y-4 text-sm text-muted-foreground">
              <p class="font-medium text-foreground">最后更新日期：2025年1月</p>
              
              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">1. 信息收集</h3>
                <p>我们收集以下类型的信息：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>账户信息：邮箱、手机号、昵称</li>
                  <li>身体数据：身高、体重、体脂率等</li>
                  <li>健身数据：训练记录、目标设置</li>
                  <li>健康信息：禁忌症、损伤历史（可选）</li>
                  <li>使用数据：应用使用情况、偏好设置</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">2. 信息使用</h3>
                <p>我们使用收集的信息用于：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>提供个性化的健身建议和训练计划</li>
                  <li>改进服务质量和用户体验</li>
                  <li>发送服务相关通知</li>
                  <li>进行数据分析和研究（匿名化处理）</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">3. 信息保护</h3>
                <p>我们采取以下措施保护您的信息：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>使用加密技术传输和存储数据</li>
                  <li>限制员工访问用户数据的权限</li>
                  <li>定期进行安全审计和漏洞检测</li>
                  <li>遵守相关法律法规的数据保护要求</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">4. 信息共享</h3>
                <p>我们不会出售您的个人信息。仅在以下情况下可能共享：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>获得您的明确同意</li>
                  <li>法律法规要求</li>
                  <li>与服务提供商合作（受保密协议约束）</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">5. 用户权利</h3>
                <p>您有权：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>访问和更正您的个人信息</li>
                  <li>删除您的账户和数据</li>
                  <li>撤回同意（可能影响服务使用）</li>
                  <li>导出您的数据</li>
                </ul>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <!-- 免责声明 -->
      <Card v-show="activeTab === 'disclaimer'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5" />
            免责声明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea class="h-[400px] pr-4">
            <div class="space-y-4 text-sm text-muted-foreground">
              <div class="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 text-amber-800 dark:text-amber-200">
                <p class="font-medium">重要提示</p>
                <p class="mt-1">请在使用本应用前仔细阅读以下免责声明。使用本应用即表示您已阅读、理解并同意以下条款。</p>
              </div>
              
              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">1. 非医疗建议</h3>
                <p>本应用提供的所有内容（包括但不限于训练计划、营养建议、健身指导）均为一般性信息，<strong class="text-foreground">不构成医疗建议、诊断或治疗方案</strong>。</p>
                <p>如果您有任何健康问题或疑虑，请咨询专业医生或医疗保健提供者。</p>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">2. 智能系统局限性</h3>
                <p>本应用使用智能系统辅助生成内容：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>智能系统可能产生不准确或不完整的信息</li>
                  <li>建议基于您提供的信息，信息不准确可能导致建议不适用</li>
                  <li>智能系统无法完全了解您的个人情况和健康状况</li>
                  <li>所有建议仅供参考，请根据实际情况自行判断</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">3. 运动风险</h3>
                <p>任何体育锻炼都存在受伤风险。使用本应用时：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>请根据自身体能水平选择适当的训练强度</li>
                  <li>如感到不适，请立即停止训练</li>
                  <li>建议在专业人士指导下进行高强度训练</li>
                  <li>如有心脏病、高血压等疾病，请先咨询医生</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">4. 营养建议声明</h3>
                <p>本应用提供的营养建议：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>基于一般营养学原则，可能不适用于特殊人群</li>
                  <li>如有食物过敏、糖尿病等特殊情况，请咨询专业营养师</li>
                  <li>营养数据来源于公开数据库，可能存在误差</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">5. 责任限制</h3>
                <p>在法律允许的最大范围内，玉珍健身及其开发者不对以下情况承担责任：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>因使用本应用建议而导致的任何伤害或损失</li>
                  <li>因服务中断或数据丢失造成的损失</li>
                  <li>因第三方行为造成的损失</li>
                  <li>任何间接、附带或惩罚性损害</li>
                </ul>
              </section>

              <section class="space-y-2">
                <h3 class="font-semibold text-foreground">6. 数据来源说明</h3>
                <p>本应用使用的数据来源：</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>动作库：基于1790个专业健身动作数据</li>
                  <li>食物库：基于1880个食物营养数据</li>
                  <li>训练理论：基于运动科学研究和专业文献</li>
                </ul>
                <p class="mt-2">数据仅供参考，我们不保证数据的绝对准确性。</p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </main>

    <!-- 底部同意区域（仅首次使用时显示） -->
    <div v-if="!hasAgreed" class="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-4">
      <div class="space-y-3">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="relative mt-0.5">
            <input 
              type="checkbox" 
              v-model="agreedToTerms"
              class="peer sr-only" 
            />
            <div class="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground grid place-content-center">
              <Check v-if="agreedToTerms" class="h-3 w-3 text-white" />
            </div>
          </div>
          <span class="text-sm">我已阅读并同意《服务条款》</span>
        </label>
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="relative mt-0.5">
            <input 
              type="checkbox" 
              v-model="agreedToPrivacy"
              class="peer sr-only" 
            />
            <div class="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground grid place-content-center">
              <Check v-if="agreedToPrivacy" class="h-3 w-3 text-white" />
            </div>
          </div>
          <span class="text-sm">我已阅读并同意《隐私政策》和《免责声明》</span>
        </label>
      </div>
      <Button 
        class="w-full" 
        :disabled="!canSubmit"
        @click="handleAgree"
      >
        同意并继续
      </Button>
    </div>
  </div>
</template>
