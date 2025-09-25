/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_WS_URL: string
  readonly VITE_BACKEND_WS_URL_GUEST: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
