import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      vue(),
      // gzip压缩插件
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10KB以上的文件才压缩
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // brotli压缩插件（更高压缩率）
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 9000,
      host: true,
    },
    build: {
      // 代码分割配置
      rollupOptions: {
        output: {
          // 手动分割代码块
          manualChunks: {
            // Vue核心库
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            // UI组件库
            'ui-vendor': ['reka-ui', 'radix-vue', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            // 工具库
            'utils-vendor': ['axios', 'date-fns', 'zod', 'dompurify', 'marked'],
            // 表单验证
            'form-vendor': ['vee-validate', '@vee-validate/zod'],
            // 图标库
            'icons-vendor': ['lucide-vue-next'],
          },
          // 优化chunk文件名
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.vue', '').replace('.ts', '')
              : 'chunk'
            return `assets/js/${facadeModuleId}-[hash].js`
          },
          // 入口文件名
          entryFileNames: 'assets/js/[name]-[hash].js',
          // 静态资源文件名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || []
            const ext = info[info.length - 1]
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
        },
      },
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 设置chunk大小警告阈值（500KB）
      chunkSizeWarningLimit: 500,
      // 压缩配置
      minify: 'esbuild',
      // 生成source map用于生产环境调试（仅在需要时启用）
      sourcemap: mode === 'production' ? 'hidden' : true,
      // 目标浏览器
      target: 'es2020',
      // 移除console和debugger（生产环境）
      esbuild: mode === 'production' ? {
        drop: ['console', 'debugger'],
      } : {},
      // 优化构建性能
      reportCompressedSize: false, // 禁用压缩大小报告以加快构建
      // 设置输出目录
      outDir: 'dist',
      // 清空输出目录
      emptyOutDir: true,
      // 资源内联阈值（4KB以下的资源会被内联为base64）
      assetsInlineLimit: 4096,
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        '@vueuse/core',
        'date-fns',
        'zod',
      ],
      exclude: [
        // 排除不需要预构建的依赖
      ],
    },
    // 定义全局常量
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_ENV__: JSON.stringify(mode),
    },
  }
})
