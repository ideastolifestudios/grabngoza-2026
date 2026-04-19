// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add other VITE_ variables you use here, e.g.:
  // readonly VITE_SOME_FLAG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
