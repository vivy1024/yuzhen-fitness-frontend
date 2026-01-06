<template>
  <div class="container mx-auto p-8 space-y-8">
    <h1 class="text-3xl font-bold mb-8">shadcn-vue 组件测试</h1>

    <!-- Button 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Button 按钮</h2>
      <div class="flex gap-4">
        <Button>默认按钮</Button>
        <Button variant="secondary">次要按钮</Button>
        <Button variant="destructive">危险按钮</Button>
        <Button variant="outline">轮廓按钮</Button>
        <Button variant="ghost">幽灵按钮</Button>
      </div>
    </section>

    <!-- Card 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Card 卡片</h2>
      <Card class="w-96">
        <CardHeader>
          <CardTitle>卡片标题</CardTitle>
          <CardDescription>这是卡片描述</CardDescription>
        </CardHeader>
        <CardContent>
          <p>这是卡片内容区域</p>
        </CardContent>
        <CardFooter>
          <Button>操作按钮</Button>
        </CardFooter>
      </Card>
    </section>

    <!-- Input 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Input 输入框</h2>
      <div class="w-96 space-y-4">
        <div>
          <Label for="email">邮箱</Label>
          <Input id="email" type="email" placeholder="请输入邮箱" />
        </div>
        <div>
          <Label for="password">密码</Label>
          <Input id="password" type="password" placeholder="请输入密码" />
        </div>
      </div>
    </section>

    <!-- Switch 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Switch 开关</h2>
      <div class="flex items-center space-x-2">
        <Switch id="airplane-mode" v-model:checked="switchValue" />
        <Label for="airplane-mode">飞行模式</Label>
      </div>
      <p class="text-sm text-muted-foreground">当前状态: {{ switchValue ? '开启' : '关闭' }}</p>
    </section>

    <!-- Checkbox 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Checkbox 复选框</h2>
      <div class="flex items-center space-x-2">
        <Checkbox id="terms" v-model:checked="checkboxValue" />
        <Label for="terms">同意服务条款</Label>
      </div>
    </section>

    <!-- Badge 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Badge 徽章</h2>
      <div class="flex gap-2">
        <Badge>默认</Badge>
        <Badge variant="secondary">次要</Badge>
        <Badge variant="destructive">危险</Badge>
        <Badge variant="outline">轮廓</Badge>
      </div>
    </section>

    <!-- Alert 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Alert 警告</h2>
      <Alert>
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>这是一条提示信息</AlertDescription>
      </Alert>
    </section>

    <!-- Progress 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Progress 进度条</h2>
      <Progress :model-value="progressValue" class="w-96" />
      <p class="text-sm text-muted-foreground">进度: {{ progressValue }}%</p>
    </section>

    <!-- Dialog 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Dialog 对话框</h2>
      <Dialog>
        <DialogTrigger as-child>
          <Button>打开对话框</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>对话框标题</DialogTitle>
            <DialogDescription>这是对话框描述</DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <p>对话框内容区域</p>
          </div>
          <DialogFooter>
            <Button>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>

    <!-- Tabs 测试 -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Tabs 标签页</h2>
      <Tabs default-value="tab1" class="w-96">
        <TabsList>
          <TabsTrigger value="tab1">标签1</TabsTrigger>
          <TabsTrigger value="tab2">标签2</TabsTrigger>
          <TabsTrigger value="tab3">标签3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <p>标签1的内容</p>
        </TabsContent>
        <TabsContent value="tab2">
          <p>标签2的内容</p>
        </TabsContent>
        <TabsContent value="tab3">
          <p>标签3的内容</p>
        </TabsContent>
      </Tabs>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const switchValue = ref(false)
const checkboxValue = ref(false)
const progressValue = ref(60)
</script>
