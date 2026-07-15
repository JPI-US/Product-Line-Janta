/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NREL_API_KEY?: string;
  readonly VITE_NREL_API_BASE?: string;
  readonly VITE_CALENDLY_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
