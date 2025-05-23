/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useSettings.ts
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  UserSettings, 
  ApiKey, 
  Subscription, 
  SecuritySettings,
  CreateApiKeyRequest,
  UpdateUserSettingsRequest,
  UpdateSecuritySettingsRequest 
} from '@/lib/types/settings'

// User Settings Hook
export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/user/settings')
        if (!response.ok) {
          throw new Error('Failed to fetch user settings')
        }
        
        const data = await response.json()
        setSettings(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching user settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const updateSettings = async (updates: UpdateUserSettingsRequest) => {
    if (!settings) return

    try {
      setError(null)
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      
      const updated = await response.json()
      setSettings(updated)
      return updated
    } catch (err: any) {
      setError(err.message)
      console.error('Error updating settings:', err)
      throw err
    }
  }

  return {
    settings,
    loading,
    error,
    updateSettings
  }
}

// API Keys Hook
export function useApiKeys() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchApiKeys = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/user/api-keys')
        if (!response.ok) {
          throw new Error('Failed to fetch API keys')
        }
        
        const data = await response.json()
        setApiKeys(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching API keys:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchApiKeys()
  }, [user])

  const createApiKey = async (request: CreateApiKeyRequest) => {
    try {
      setError(null)
      
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create API key')
      }
      
      const newKey = await response.json()
      setApiKeys(prev => [newKey, ...prev])
      return newKey
    } catch (err: any) {
      setError(err.message)
      console.error('Error creating API key:', err)
      throw err
    }
  }

  const updateApiKey = async (id: string, updates: Partial<Pick<ApiKey, 'name' | 'is_active' | 'expires_at' | 'permissions'>>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update API key')
      }
      
      const updated = await response.json()
      setApiKeys(prev => prev.map(key => key.id === id ? updated : key))
      return updated
    } catch (err: any) {
      setError(err.message)
      console.error('Error updating API key:', err)
      throw err
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }
      
      setApiKeys(prev => prev.filter(key => key.id !== id))
    } catch (err: any) {
      setError(err.message)
      console.error('Error deleting API key:', err)
      throw err
    }
  }

  return {
    apiKeys,
    loading,
    error,
    createApiKey,
    updateApiKey,
    deleteApiKey
  }
}

// Subscription Hook
export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/user/subscription')
        if (!response.ok) {
          throw new Error('Failed to fetch subscription')
        }
        
        const data = await response.json()
        setSubscription(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const refresh = () => {
    if (user) {
      setLoading(true)
      fetch('/api/user/subscription')
        .then(res => res.json())
        .then(setSubscription)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  return {
    subscription,
    loading,
    error,
    refresh
  }
}

// Security Settings Hook
export function useSecuritySettings() {
  const { user } = useAuth()
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchSecuritySettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/user/security')
        if (!response.ok) {
          throw new Error('Failed to fetch security settings')
        }
        
        const data = await response.json()
        setSecuritySettings(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching security settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSecuritySettings()
  }, [user])

  const updateSecuritySettings = async (updates: UpdateSecuritySettingsRequest) => {
    if (!securitySettings) return

    try {
      setError(null)
      
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update security settings')
      }
      
      const updated = await response.json()
      setSecuritySettings(updated)
      return updated
    } catch (err: any) {
      setError(err.message)
      console.error('Error updating security settings:', err)
      throw err
    }
  }

  return {
    securitySettings,
    loading,
    error,
    updateSecuritySettings
  }
}

// Dashboard Stats Hook
export function useDashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/user/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const refresh = () => {
    if (user) {
      setLoading(true)
      fetch('/api/user/dashboard-stats')
        .then(res => res.json())
        .then(setStats)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  return {
    stats,
    loading,
    error,
    refresh
  }
}

// Usage Analytics Hook
export function useUsageAnalytics(params?: {
  start_date?: string
  end_date?: string
  website_id?: string
  chatbot_id?: string
}) {
  const { user } = useAuth()
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchUsage = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const queryParams = new URLSearchParams()
        if (params?.start_date) queryParams.append('start_date', params.start_date)
        if (params?.end_date) queryParams.append('end_date', params.end_date)
        if (params?.website_id) queryParams.append('website_id', params.website_id)
        if (params?.chatbot_id) queryParams.append('chatbot_id', params.chatbot_id)

        const response = await fetch(`/api/user/usage?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch usage data')
        }
        
        const data = await response.json()
        setUsage(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching usage data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [user, params?.start_date, params?.end_date, params?.website_id, params?.chatbot_id])

  return {
    usage,
    loading,
    error
  }
}

// Billing History Hook
export function useBillingHistory(params?: { limit?: number; offset?: number }) {
  const { user } = useAuth()
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchBillingHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const queryParams = new URLSearchParams()
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.offset) queryParams.append('offset', params.offset.toString())

        const response = await fetch(`/api/user/billing-history?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch billing history')
        }
        
        const data = await response.json()
        setBillingHistory(data)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching billing history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBillingHistory()
  }, [user, params?.limit, params?.offset])

  return {
    billingHistory,
    loading,
    error
  }
}