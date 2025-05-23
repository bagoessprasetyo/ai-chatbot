/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client (for use in client components)
export const createClient = () => createClientComponentClient()

// Types for our database
// src/lib/supabase.ts - Updated with new types
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      websites: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string | null
          description: string | null
          status: "pending" | "scraping" | "ready" | "error"
          scraped_content: Json | null
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
          status?: "pending" | "scraping" | "ready" | "error"
          scraped_content?: Json | null
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
          status?: "pending" | "scraping" | "ready" | "error"
          scraped_content?: Json | null
          system_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chatbots: {
        Row: {
          id: string
          website_id: string
          name: string
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          name: string
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          name?: string
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          chatbot_id: string
          session_id: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chatbot_id: string
          session_id: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chatbot_id?: string
          session_id?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          conversation_alerts: boolean
          weekly_reports: boolean
          security_alerts: boolean
          marketing_emails: boolean
          timezone: string
          language: string
          theme: "light" | "dark" | "system"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          conversation_alerts?: boolean
          weekly_reports?: boolean
          security_alerts?: boolean
          marketing_emails?: boolean
          timezone?: string
          language?: string
          theme?: "light" | "dark" | "system"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          conversation_alerts?: boolean
          weekly_reports?: boolean
          security_alerts?: boolean
          marketing_emails?: boolean
          timezone?: string
          language?: string
          theme?: "light" | "dark" | "system"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          is_active: boolean
          last_used_at: string | null
          expires_at: string | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: "active" | "cancelled" | "past_due" | "unpaid" | "trialing"
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          monthly_conversations_limit: number
          monthly_conversations_used: number
          websites_limit: number
          chatbots_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: "active" | "cancelled" | "past_due" | "unpaid" | "trialing"
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          monthly_conversations_limit?: number
          monthly_conversations_used?: number
          websites_limit?: number
          chatbots_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: "active" | "cancelled" | "past_due" | "unpaid" | "trialing"
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          monthly_conversations_limit?: number
          monthly_conversations_used?: number
          websites_limit?: number
          chatbots_limit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      billing_history: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          stripe_invoice_id: string | null
          amount_paid: number | null
          currency: string
          status: "paid" | "open" | "void" | "uncollectible"
          invoice_pdf_url: string | null
          billing_period_start: string | null
          billing_period_end: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          stripe_invoice_id?: string | null
          amount_paid?: number | null
          currency?: string
          status: "paid" | "open" | "void" | "uncollectible"
          invoice_pdf_url?: string | null
          billing_period_start?: string | null
          billing_period_end?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          stripe_invoice_id?: string | null
          amount_paid?: number | null
          currency?: string
          status?: "paid" | "open" | "void" | "uncollectible"
          invoice_pdf_url?: string | null
          billing_period_start?: string | null
          billing_period_end?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          location: Json | null
          is_current: boolean
          last_accessed_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          location?: Json | null
          is_current?: boolean
          last_accessed_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          ip_address?: string | null
          user_agent?: string | null
          location?: Json | null
          is_current?: boolean
          last_accessed_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      security_settings: {
        Row: {
          id: string
          user_id: string
          two_factor_enabled: boolean
          two_factor_method: "totp" | "sms" | "email" | null
          backup_codes_generated_at: string | null
          password_changed_at: string | null
          login_alerts_enabled: boolean
          suspicious_activity_alerts: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          two_factor_enabled?: boolean
          two_factor_method?: "totp" | "sms" | "email" | null
          backup_codes_generated_at?: string | null
          password_changed_at?: string | null
          login_alerts_enabled?: boolean
          suspicious_activity_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          two_factor_enabled?: boolean
          two_factor_method?: "totp" | "sms" | "email" | null
          backup_codes_generated_at?: string | null
          password_changed_at?: string | null
          login_alerts_enabled?: boolean
          suspicious_activity_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_analytics: {
        Row: {
          id: string
          user_id: string
          website_id: string | null
          chatbot_id: string | null
          metric_type: "conversation" | "api_call" | "message_sent" | "message_received"
          metric_value: number
          metadata: Json
          date: string
          hour: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          website_id?: string | null
          chatbot_id?: string | null
          metric_type: "conversation" | "api_call" | "message_sent" | "message_received"
          metric_value?: number
          metadata?: Json
          date?: string
          hour?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          website_id?: string | null
          chatbot_id?: string | null
          metric_type?: "conversation" | "api_call" | "message_sent" | "message_received"
          metric_value?: number
          metadata?: Json
          date?: string
          hour?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_analytics_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_analytics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          user_id: string
          email: string
          full_name: string | null
          plan_id: string
          subscription_status: string
          websites_count: number
          chatbots_count: number
          conversations_count: number
          monthly_conversations_used: number
          monthly_conversations_limit: number
        }
        Relationships: []
      }
      usage_summary: {
        Row: {
          user_id: string
          website_id: string | null
          chatbot_id: string | null
          date: string
          conversations: number
          messages_sent: number
          messages_received: number
          api_calls: number
        }
        Relationships: []
      }
    }
    Functions: {
      generate_api_key_hash: {
        Args: {
          key_text: string
        }
        Returns: string
      }
      increment_usage: {
        Args: {
          p_user_id: string
          p_website_id?: string
          p_chatbot_id?: string
          p_metric_type?: string
          p_metric_value?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}