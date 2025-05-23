/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client (for use in client components)
export const createClient = () => createClientComponentClient()

// Types for our database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      websites: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string | null
          description: string | null
          status: 'pending' | 'scraping' | 'ready' | 'error'
          scraped_content: any | null
          system_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title?: string | null
          description?: string | null
          status?: 'pending' | 'scraping' | 'ready' | 'error'
          scraped_content?: any | null
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string | null
          description?: string | null
          status?: 'pending' | 'scraping' | 'ready' | 'error'
          scraped_content?: any | null
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chatbots: {
        Row: {
          id: string
          website_id: string
          name: string
          config: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          name: string
          config?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          name?: string
          config?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}