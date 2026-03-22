/**
 * Supabase database types
 * This is a placeholder - generate actual types with:
 * npx supabase gen types typescript --project-id cjmtcxfpwjbpbctjseex > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
    }
  }
}
