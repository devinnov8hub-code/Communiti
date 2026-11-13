/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Supabase project URL (https://<ref>.supabase.co), used for realtime. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon / publishable key (public — never the secret / service-role key). */
  readonly VITE_SUPABASE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
