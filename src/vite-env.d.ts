/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WECHAT_APP_ID: string
  readonly VITE_QQ_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
