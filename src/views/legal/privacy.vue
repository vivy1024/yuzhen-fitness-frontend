<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div class="flex items-center h-14 px-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="ml-2 text-lg font-semibold">隐私政策</h1>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <!-- 概述 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5 text-primary" />
            隐私保护承诺
          </CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground space-y-3">
          <p>
            玉珍健身（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规要求，
            采取相应安全保护措施，尽力保护您的个人信息安全可控。
          </p>
          <p class="text-sm">
            更新日期：2026年1月1日 | 生效日期：2026年1月1日
          </p>
        </CardContent>
      </Card>

      <!-- 信息收集 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Database class="h-5 w-5 text-blue-500" />
            我们收集的信息
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <h4 class="font-medium mb-2">1. 账号信息</h4>
            <p class="text-muted-foreground text-sm">
              注册时您提供的邮箱地址、昵称、密码（加密存储）。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">2. 健身档案</h4>
            <p class="text-muted-foreground text-sm">
              您主动填写的身高、体重、年龄、健身目标、健康状况等信息，用于提供个性化健身建议。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">3. 训练数据</h4>
            <p class="text-muted-foreground text-sm">
              您的训练计划、训练记录、进度数据，用于追踪健身进展。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">4. AI对话记录</h4>
            <p class="text-muted-foreground text-sm">
              您与AI健身顾问的对话内容，用于提供连续性的健身指导服务。
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- 信息使用 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Eye class="h-5 w-5 text-green-500" />
            信息使用方式
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li>提供、维护和改进我们的服务</li>
            <li>根据您的健身档案提供个性化的训练和营养建议</li>
            <li>分析服务使用情况，优化用户体验</li>
            <li>发送服务相关通知（如训练提醒、会员到期提醒）</li>
            <li>保障账号安全，防止欺诈行为</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 信息保护 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Lock class="h-5 w-5 text-orange-500" />
            信息安全保护
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li>使用HTTPS加密传输所有数据</li>
            <li>密码采用bcrypt算法加密存储</li>
            <li>敏感数据存储在安全的云服务器</li>
            <li>定期进行安全审计和漏洞扫描</li>
            <li>严格限制员工访问用户数据的权限</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 用户权利 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <UserCheck class="h-5 w-5 text-purple-500" />
            您的权利
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="list-disc list-inside text-muted-foreground text-sm space-y-2">
            <li><strong>访问权：</strong>您可以随时查看和导出您的个人数据</li>
            <li><strong>更正权：</strong>您可以随时修改您的个人信息</li>
            <li><strong>删除权：</strong>您可以申请删除您的账号和相关数据</li>
            <li><strong>撤回同意：</strong>您可以随时撤回对数据处理的同意</li>
          </ul>
        </CardContent>
      </Card>

      <!-- 联系我们 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Mail class="h-5 w-5 text-cyan-500" />
            联系我们
          </CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground text-sm space-y-2">
          <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
          <p>邮箱：1336495069@qq.com</p>
          <p>我们将在15个工作日内回复您的请求。</p>
        </CardContent>
      </Card>

      <!-- 底部说明 -->
      <div class="text-center text-muted-foreground text-xs py-4">
        <p>© 2026 玉珍健身 版权所有</p>
        <p class="mt-1">陕ICP备2026000942号-1</p>
      </div>
    </main>
  </div>
</template>
