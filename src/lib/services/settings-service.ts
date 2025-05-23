/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/services/settings-service.ts
import { 
  UserSettings, 
  ApiKey, 
  Subscription, 
  SecuritySettings,
  CreateApiKeyRequest,
  UpdateUserSettingsRequest,
  UpdateSecuritySettingsRequest 
} from '@/lib/types/settings'

class SettingsService {
  private baseUrl = '/api/user'

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/settings`)
    if (!response.ok) {
      throw new Error('Failed to fetch user settings')
    }
    return response.json()
  }

  async updateUserSettings(updates: UpdateUserSettingsRequest): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) {
      throw new Error('Failed to update user settings')
    }
    return response.json()
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    const response = await fetch(`${this.baseUrl}/api-keys`)
    if (!response.ok) {
      throw new Error('Failed to fetch API keys')
    }
    return response.json()
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKey & { key: string }> {
    const response = await fetch(`${this.baseUrl}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    if (!response.ok) {
      throw new Error('Failed to create API key')
    }
    return response.json()
  }

  async updateApiKey(id: string, updates: Partial<Pick<ApiKey, 'name' | 'is_active' | 'expires_at' | 'permissions'>>): Promise<ApiKey> {
    const response = await fetch(`${this.baseUrl}/api-keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) {
      throw new Error('Failed to update API key')
    }
    return response.json()
  }

  async deleteApiKey(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api-keys/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('Failed to delete API key')
    }
  }

  // Subscription
  async getSubscription(): Promise<Subscription> {
    const response = await fetch(`${this.baseUrl}/subscription`)
    if (!response.ok) {
      throw new Error('Failed to fetch subscription')
    }
    return response.json()
  }

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await fetch(`${this.baseUrl}/security`)
    if (!response.ok) {
      throw new Error('Failed to fetch security settings')
    }
    return response.json()
  }

  async updateSecuritySettings(updates: UpdateSecuritySettingsRequest): Promise<SecuritySettings> {
    const response = await fetch(`${this.baseUrl}/security`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) {
      throw new Error('Failed to update security settings')
    }
    return response.json()
  }

  // Usage Analytics
  async getUsageData(params?: {
    start_date?: string
    end_date?: string
    website_id?: string
    chatbot_id?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.website_id) queryParams.append('website_id', params.website_id)
    if (params?.chatbot_id) queryParams.append('chatbot_id', params.chatbot_id)

    const response = await fetch(`${this.baseUrl}/usage?${queryParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch usage data')
    }
    return response.json()
  }

  // Dashboard Stats
  async getDashboardStats() {
    const response = await fetch(`${this.baseUrl}/dashboard-stats`)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  }

  // Billing History
  async getBillingHistory(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(`${this.baseUrl}/billing-history?${queryParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch billing history')
    }
    return response.json()
  }

  // Usage Tracking
  async trackUsage(data: {
    user_id: string
    website_id?: string
    chatbot_id?: string
    metric_type?: string
    metric_value?: number
    metadata?: Record<string, any>
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error('Failed to track usage')
    }
  }
}

export const settingsService = new SettingsService()

// src/hooks/useSettings.ts
