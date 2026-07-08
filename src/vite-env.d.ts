/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NREL_API_KEY?: string;
  readonly VITE_NREL_API_BASE?: string;
  readonly VITE_CALENDLY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
