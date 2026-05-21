/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OR_URL: string
  readonly VITE_OR_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
