/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/types/settings.ts
export interface UserSettings {
  id: string
  user_id: string
  // Notification preferences
  email_notifications: boolean
  conversation_alerts: boolean
  weekly_reports: boolean
  security_alerts: boolean
  marketing_emails: boolean
  // General preferences
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_prefix: string // For display purposes (e.g., "wb_sk_12345678...")
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  permissions: string[] // Array of permissions/scopes
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: 'free' | 'starter' | 'professional' | 'business'
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  // Usage limits based on plan
  monthly_conversations_limit: number
  monthly_conversations_used: number
  websites_limit: number
  chatbots_limit: number
  created_at: string
  updated_at: string
}

export interface BillingHistory {
  id: string
  user_id: string
  subscription_id: string | null
  stripe_invoice_id: string | null
  amount_paid: number // Amount in cents
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  invoice_pdf_url: string | null
  billing_period_start: string | null
  billing_period_end: string | null
  paid_at: string | null
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  location: {
    country?: string
    city?: string
    region?: string
  } | null
  is_current: boolean
  last_accessed_at: string
  expires_at: string | null
  created_at: string
}

export interface SecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  two_factor_method: 'totp' | 'sms' | 'email' | null
  backup_codes_generated_at: string | null
  password_changed_at: string | null
  login_alerts_enabled: boolean
  suspicious_activity_alerts: boolean
  created_at: string
  updated_at: string
}

export interface UsageAnalytics {
  id: string
  user_id: string
  website_id: string | null
  chatbot_id: string | null
  metric_type: 'conversation' | 'api_call' | 'message_sent' | 'message_received'
  metric_value: number
  metadata: Record<string, any>
  date: string
  hour: number | null
  created_at: string
}

// Dashboard views
export interface UserDashboardStats {
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

export interface UsageSummary {
  user_id: string
  website_id: string | null
  chatbot_id: string | null
  date: string
  conversations: number
  messages_sent: number
  messages_received: number
  api_calls: number
}

// Plan definitions
export interface PlanFeatures {
  id: string
  name: string
  price: number // Price per month in cents
  yearlyPrice?: number // Yearly price in cents
  currency: string
  conversations_limit: number
  websites_limit: number
  chatbots_limit: number
  features: string[]
  popular?: boolean
}

export const PLANS: PlanFeatures[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    currency: 'usd',
    conversations_limit: 100,
    websites_limit: 1,
    chatbots_limit: 1,
    features: [
      '100 conversations/month',
      '1 website',
      '1 chatbot',
      'Email support',
      '14-day trial'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 2900, // $29.00
    yearlyPrice: 29000, // $290.00 (save ~17%)
    currency: 'usd',
    conversations_limit: 500,
    websites_limit: 1,
    chatbots_limit: 2,
    features: [
      '500 conversations/month',
      '1 website',
      '2 chatbots',
      'Email support',
      'Custom branding'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 7900, // $79.00
    yearlyPrice: 79000, // $790.00 (save ~17%)
    currency: 'usd',
    conversations_limit: 2000,
    websites_limit: 3,
    chatbots_limit: 5,
    popular: true,
    features: [
      '2,000 conversations/month',
      '3 websites',
      '5 chatbots',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom integrations'
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 19900, // $199.00
    yearlyPrice: 199000, // $1,990.00 (save ~17%)
    currency: 'usd',
    conversations_limit: 10000,
    websites_limit: 10,
    chatbots_limit: 20,
    features: [
      '10,000 conversations/month',
      '10 websites',
      '20 chatbots',
      'Dedicated support',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'White-label option',
      'Priority training'
    ]
  }
] as const

// API Key creation request
export interface CreateApiKeyRequest {
  name: string
  permissions?: string[]
  expires_at?: string
}

export interface CreateApiKeyResponse {
  id: string
  name: string
  key: string // Full key returned only once
  key_prefix: string
  permissions: string[]
  expires_at: string | null
  created_at: string
}

// Settings update requests
export interface UpdateUserSettingsRequest {
  email_notifications?: boolean
  conversation_alerts?: boolean
  weekly_reports?: boolean
  security_alerts?: boolean
  marketing_emails?: boolean
  timezone?: string
  language?: string
  theme?: 'light' | 'dark' | 'system'
}

export interface UpdateSecuritySettingsRequest {
  two_factor_enabled?: boolean
  two_factor_method?: 'totp' | 'sms' | 'email' | null
  login_alerts_enabled?: boolean
  suspicious_activity_alerts?: boolean
}

// Usage tracking
export interface UsageTrackingRequest {
  user_id: string
  website_id?: string
  chatbot_id?: string
  metric_type: 'conversation' | 'api_call' | 'message_sent' | 'message_received'
  metric_value?: number
  metadata?: Record<string, any>
}