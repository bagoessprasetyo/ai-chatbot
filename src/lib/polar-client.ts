/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/polar-client.ts
interface PolarConfig {
  accessToken: string
  baseUrl?: string
}

interface PolarProduct {
  id: string
  name: string
  description?: string
  is_recurring: boolean
  is_archived: boolean
  organization_id: string
  prices: PolarPrice[]
  benefits: PolarBenefit[]
  created_at: string
  modified_at: string
}

interface PolarPrice {
  id: string
  product_id: string
  price_amount: number
  price_currency: string
  type: 'one_time' | 'recurring'
  recurring_interval?: 'month' | 'year'
  is_archived: boolean
  created_at: string
  modified_at: string
}

interface PolarBenefit {
  id: string
  type: string
  description: string
  selectable: boolean
  deletable: boolean
  organization_id: string
  created_at: string
  modified_at: string
}

interface PolarSubscription {
  id: string
  customer_id: string
  product_id: string
  price_id: string
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string
  created_at: string
  modified_at: string
  started_at?: string
  ended_at?: string
  customer: PolarCustomer
  product: PolarProduct
  price: PolarPrice
}

interface PolarCustomer {
  id: string
  email: string
  name?: string
  avatar_url?: string
  billing_address?: {
    country: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
  }
  tax_id?: string[]
  organization_id: string
  created_at: string
  modified_at: string
}

interface PolarCheckoutSession {
  id: string
  url: string
  customer_id?: string
  product_id: string
  price_id?: string
  success_url: string
  cancel_url?: string
  customer_email?: string
  customer_name?: string
  metadata?: Record<string, string>
  expires_at: string
  created_at: string
  status: 'open' | 'complete' | 'expired'
}

interface CreateCheckoutRequest {
  product_id: string
  price_id?: string
  success_url: string
  cancel_url?: string
  customer_email?: string
  customer_name?: string
  metadata?: Record<string, string>
}

class PolarAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'PolarAPIError'
  }
}

export class PolarClient {
  private config: PolarConfig
  private baseUrl: string

  constructor(config: PolarConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.polar.sh'
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/v1${endpoint}`
    
    console.log(`Making Polar API request to: ${url}`)
    console.log(`Request method: ${options.method || 'GET'}`)
    if (options.body) {
      console.log(`Request body:`, JSON.parse(options.body as string))
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Polar API Error Response:', errorData)
      
      throw new PolarAPIError(
        errorData.error || errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    const data = await response.json()
    console.log('Polar API Success Response keys:', Object.keys(data))
    return data
  }

  // Products
  async listProducts(organizationId?: string): Promise<{ items: PolarProduct[] }> {
    const params = new URLSearchParams()
    if (organizationId) {
      params.append('organization_id', organizationId)
    }
    
    return this.request(`/products?${params}`)
  }

  async getProduct(id: string): Promise<PolarProduct> {
    return this.request(`/products/${id}`)
  }

  // Customers
  async listCustomers(organizationId?: string): Promise<{ items: PolarCustomer[] }> {
    const params = new URLSearchParams()
    if (organizationId) {
      params.append('organization_id', organizationId)
    }
    
    return this.request(`/customers?${params}`)
  }

  async createCustomer(data: {
    email: string
    name?: string
    organization_id?: string // Made optional since org tokens don't need this
    billing_address?: PolarCustomer['billing_address']
    tax_id?: string[]
  }): Promise<PolarCustomer> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCustomer(id: string): Promise<PolarCustomer> {
    return this.request(`/customers/${id}`)
  }

  async updateCustomer(id: string, data: {
    email?: string
    name?: string
    billing_address?: PolarCustomer['billing_address']
    tax_id?: string[]
  }): Promise<PolarCustomer> {
    return this.request(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Subscriptions
  async listSubscriptions(customerId?: string, organizationId?: string): Promise<{ items: PolarSubscription[] }> {
    const params = new URLSearchParams()
    if (customerId) {
      params.append('customer_id', customerId)
    }
    if (organizationId) {
      params.append('organization_id', organizationId)
    }
    
    return this.request(`/subscriptions?${params}`)
  }

  async getSubscription(id: string): Promise<PolarSubscription> {
    return this.request(`/subscriptions/${id}`)
  }

  async updateSubscription(id: string, data: {
    product_id?: string
    price_id?: string
    cancel_at_period_end?: boolean
  }): Promise<PolarSubscription> {
    return this.request(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async cancelSubscription(id: string): Promise<PolarSubscription> {
    return this.request(`/subscriptions/${id}`, {
      method: 'DELETE',
    })
  }

  // Checkout Sessions
  async createCheckoutSession(data: CreateCheckoutRequest): Promise<PolarCheckoutSession> {
    console.log('Creating checkout session with data:', data)
    
    // Try different possible endpoints - Polar.sh API might use different paths
    const possiblePaths = [
      '/checkout/sessions',
      '/checkouts',
      '/checkout',
      '/subscriptions/checkout'
    ]
    
    let lastError = null
    
    for (const path of possiblePaths) {
      try {
        console.log(`Trying checkout endpoint: ${path}`)
        const result = await this.request<PolarCheckoutSession>(path, {
          method: 'POST',
          body: JSON.stringify(data),
        })
        console.log(`Success with endpoint: ${path}`)
        return result
      } catch (error: any) {
        console.log(`Failed with endpoint: ${path} - Status: ${error.status}`)
        lastError = error
        if (error.status !== 404) {
          // If it's not a 404, this might be the right endpoint with a different error
          throw error
        }
      }
    }
    
    // If all endpoints failed with 404, throw the last error
    throw lastError
  }

  async getCheckoutSession(id: string): Promise<PolarCheckoutSession> {
    return this.request(`/checkout/sessions/${id}`)
  }

  // Orders
  async listOrders(customerId?: string, organizationId?: string): Promise<{ items: any[] }> {
    const params = new URLSearchParams()
    if (customerId) {
      params.append('customer_id', customerId)
    }
    if (organizationId) {
      params.append('organization_id', organizationId)
    }
    
    return this.request(`/orders?${params}`)
  }

  async getOrder(id: string): Promise<any> {
    return this.request(`/orders/${id}`)
  }
}

// Singleton instance
let polarClient: PolarClient | null = null

export function getPolarClient(): PolarClient {
  if (!polarClient) {
    const accessToken = process.env.POLAR_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('POLAR_ACCESS_TOKEN environment variable is required')
    }
    
    polarClient = new PolarClient({ accessToken })
  }
  
  return polarClient
}

// Plan mapping utilities with correct price IDs from your Polar.sh account
export const POLAR_PLAN_MAPPING = {
  free: {
    name: 'Free Trial',
    price_amount: 0,
    conversations_limit: 100,
    websites_limit: 1,
    chatbots_limit: 1,
    product_id: null,
    price_id: null,
  },
  starter: {
    name: 'Starter',
    price_amount: 2900, // $29.00
    conversations_limit: 500,
    websites_limit: 1,
    chatbots_limit: 2,
    product_id: process.env.POLAR_STARTER_PRODUCT_ID,
    price_id: '403ec3fe-2ddd-4140-ba02-9500f76dba18', // From your test results
  },
  professional: {
    name: 'Professional',
    price_amount: 7900, // $79.00
    conversations_limit: 2000,
    websites_limit: 3,
    chatbots_limit: 5,
    product_id: process.env.POLAR_PROFESSIONAL_PRODUCT_ID,
    price_id: '805a1f7d-eac1-4d02-a8c1-29003500fded', // From your test results
  },
} as const

export function mapPolarSubscriptionToLocal(polarSub: PolarSubscription): {
  polar_subscription_id: string
  polar_customer_id: string
  polar_product_id: string
  plan_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
} {
  // Map Polar.sh product to local plan ID based on product ID
  let planId = 'free'
  for (const [key, plan] of Object.entries(POLAR_PLAN_MAPPING)) {
    if (plan.product_id === polarSub.product_id) {
      planId = key
      break
    }
  }

  return {
    polar_subscription_id: polarSub.id,
    polar_customer_id: polarSub.customer_id,
    polar_product_id: polarSub.product_id,
    plan_id: planId,
    status: polarSub.status,
    current_period_start: polarSub.current_period_start,
    current_period_end: polarSub.current_period_end,
    cancel_at_period_end: polarSub.cancel_at_period_end,
    canceled_at: polarSub.canceled_at || null,
  }
}

export function getPlanLimits(planId: string) {
  const plan = POLAR_PLAN_MAPPING[planId as keyof typeof POLAR_PLAN_MAPPING]
  if (!plan) {
    return {
      monthly_conversations_limit: 100,
      websites_limit: 1,
      chatbots_limit: 1
    }
  }

  return {
    monthly_conversations_limit: plan.conversations_limit,
    websites_limit: plan.websites_limit,
    chatbots_limit: plan.chatbots_limit
  }
}

// Utility functions for plan management
export function getPlanByProductId(productId: string): keyof typeof POLAR_PLAN_MAPPING | null {
  for (const [planKey, plan] of Object.entries(POLAR_PLAN_MAPPING)) {
    if (plan.product_id === productId) {
      return planKey as keyof typeof POLAR_PLAN_MAPPING
    }
  }
  return null
}

export function getPlanByPriceId(priceId: string): keyof typeof POLAR_PLAN_MAPPING | null {
  for (const [planKey, plan] of Object.entries(POLAR_PLAN_MAPPING)) {
    if (plan.price_id === priceId) {
      return planKey as keyof typeof POLAR_PLAN_MAPPING
    }
  }
  return null
}

export function formatPrice(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2)
}

export function getPlanDisplayName(planId: string): string {
  const plan = POLAR_PLAN_MAPPING[planId as keyof typeof POLAR_PLAN_MAPPING]
  return plan ? plan.name : 'Unknown Plan'
}

// Export types for use in other files
export type {
  PolarProduct,
  PolarPrice,
  PolarCustomer,
  PolarSubscription,
  PolarCheckoutSession,
  CreateCheckoutRequest
}