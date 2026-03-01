<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, AlertTriangle, Scale, Ban, RefreshCw, Mail } from 'lucide-vue-next'
import { recordConsent } from '@/api/consent'

const router = useRouter()

const CONSENT_VERSION = '2026-03-01'

/** 同意协议并进入应用 */
async function agreeAndContinue() {
  localStorage.setItem('yuzhen_terms_agreed', 'true')
  // 服务端记录同意（静默失败，不阻塞用户）
  try {
    await Promise.all([
      recordConsent('terms', CONSENT_VERSION),
      recordConsent('privacy', CONSENT_VERSION),
    ])
  } catch {
    // 网络异常时不阻塞，localStorage 已记录
  }
  router.replace('/')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div class="flex items-center h-14 px-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="ml-2 text-lg font-semibold">用户协议</h1>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <!-- 概述 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5 text-primary" />
            服务协议
          </CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground space-y-3">
          <p>
            欢迎使用玉珍健身！在使用我们的服务之前，请仔细阅读本用户协议。
            注册或使用我们的服务即表示您同意本协议的所有条款。
          </p>
          <p class="text-sm">
            更新日期：2026年3月1日 | 生效日期：2026年3月1日
          </p>
        </CardContent>
      </Card>

      <!-- 服务说明 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Scale class="h-5 w-5 text-blue-500" />
            服务内容
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <h4 class="font-medium mb-2">1. AI健身顾问</h4>
            <p class="text-muted-foreground text-sm">
              基于DAML-RAG技术的智能健身助手，提供个性化训练和营养建议。
              AI建议仅供参考，不构成医疗建议。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">2. 动作库</h4>
            <p class="text-muted-foreground text-sm">
              包含1,790+专业健身动作，提供详细的动作指导和肌肉分析。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">3. 训练计划</h4>
            <p class="text-muted-foreground text-sm">
              支持AI生成和手动创建训练计划，记录训练进度。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">4. 进度追踪</h4>
            <p class="text-muted-foreground text-sm">
              记录体重、体脂等数据变化，可视化展示健身进展。
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- 用户责任 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-orange-500" />
            用户责任
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li>提供真实、准确的个人信息</li>
            <li>妥善保管账号密码，对账号行为负责</li>
            <li>根据自身身体状况合理使用健身建议</li>
            <li>如有健康问题，请先咨询专业医生</li>
            <li>不得利用服务从事违法违规活动</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 禁止行为 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Ban class="h-5 w-5 text-red-500" />
            禁止行为
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li>使用虚假信息注册账号</li>
            <li>尝试破解、攻击或干扰服务正常运行</li>
            <li>未经授权访问他人账号或数据</li>
            <li>传播违法、有害或侵权内容</li>
            <li>利用服务进行商业推广或垃圾信息发送</li>
            <li>其他违反法律法规或本协议的行为</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 免责声明 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <RefreshCw class="h-5 w-5 text-purple-500" />
            免责声明
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li>AI健身建议仅供参考，不能替代专业医疗建议</li>
            <li>用户应根据自身身体状况谨慎选择训练强度</li>
            <li>因用户自身原因导致的运动损伤，我们不承担责任</li>
            <li>我们不保证服务不会中断或完全无错误</li>
            <li>对于不可抗力导致的服务中断，我们不承担责任</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 协议变更 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5 text-cyan-500" />
            协议变更
          </CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground text-sm space-y-2">
          <p>
            我们可能会不时更新本协议。重大变更时，我们会通过应用内通知或邮件方式告知您。
            继续使用服务即表示您接受更新后的协议。
          </p>
        </CardContent>
      </Card>

      <!-- 联系我们 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Mail class="h-5 w-5 text-green-500" />
            联系我们
          </CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground text-sm space-y-2">
          <p>如果您对本协议有任何疑问，请通过以下方式联系我们：</p>
          <p>邮箱：1336495069@qq.com</p>
        </CardContent>
      </Card>

      <!-- 底部说明 -->
      <div class="text-center text-muted-foreground text-xs py-4">
        <p>© 2026 玉珍健身 版权所有</p>
        <p class="mt-1">陕ICP备2026000942号-1</p>
      </div>

      <!-- 同意按钮（从路由守卫跳转过来时显示） -->
      <div class="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
        <Button class="w-full" size="lg" @click="agreeAndContinue">
          同意协议并继续
        </Button>
      </div>
    </main>
  </div>
</template>
