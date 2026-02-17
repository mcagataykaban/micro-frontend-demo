/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BILLING_REMOTE_URL: string;
  readonly VITE_SUPPORT_REMOTE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
