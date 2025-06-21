/// <reference types="vite/client" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
