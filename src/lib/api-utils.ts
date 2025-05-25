// src/lib/api-utils.ts
import { createClient } from '@/lib/supabase'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new APIError(
      data.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data.code
    )
  }
  return response.json()
}

// Get auth headers for API requests
async function getAuthHeaders() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  return headers
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const authHeaders = await getAuthHeaders()
    
    const response = await fetch(url, {
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    })
    
    return await handleAPIResponse(response)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network errors or other issues
    throw new APIError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    )
  }
}

// Toast error handler
export function handleError(error: unknown, defaultMessage = 'An error occurred') {
  const message = error instanceof APIError 
    ? error.message 
    : error instanceof Error 
      ? error.message 
      : defaultMessage

  console.error('Error:', error)
  
  // You can add additional error reporting here
  // e.g., send to error tracking service
  
  return message
}

// Chatbot API client class
