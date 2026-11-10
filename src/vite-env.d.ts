/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Supabase project ref (the `<ref>` in https://<ref>.supabase.co), used for realtime. */
  readonly VITE_SUPABASE_ID?: string
  /** Full Supabase URL; overrides VITE_SUPABASE_ID when set. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon / publishable key (public — never the secret / service-role key). */
  readonly VITE_SUPABASE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
