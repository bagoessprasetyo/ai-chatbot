/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/scraping-service.ts - Updated to use Supabase Edge Function with proper authentication
import { createClient } from './supabase'

export interface ScrapeWebsiteOptions {
  websiteId: string
  url: string
  onStatusUpdate?: (status: 'pending' | 'scraping' | 'processing' | 'ready' | 'error') => void
}

export interface ScrapeResult {
  success: boolean
  websiteId: string
  pagesScraped?: number
  chatbotId?: string
  error?: string
  method?: string
}

class ScrapingService {
  private supabase = createClient()
  private edgeFunctionUrl = 'https://dxepbnoagmdqlxeyybla.supabase.co/functions/v1/scrape-website'
  // Add your Supabase anon key here
  private supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  /**
   * Triggers the complete scraping workflow for a website using Supabase Edge Function
   */
  async scrapeWebsite(options: ScrapeWebsiteOptions): Promise<ScrapeResult> {
    const { websiteId, url, onStatusUpdate } = options

    try {
      // Step 1: Trigger scraping using Supabase Edge Function
      onStatusUpdate?.('scraping')
      console.log('Scraping status update: scraping')
      
      const scrapeResponse = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add the authorization header - this fixes the 401 error!
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          // Alternative: you can also use apikey header instead
          // 'apikey': this.supabaseAnonKey
        },
        body: JSON.stringify({ websiteId, url })
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        
        // Provide more specific error messages based on status codes
        if (scrapeResponse.status === 429) {
          throw new Error('Firecrawl API rate limit exceeded. Please try again in a few minutes.')
        } else if (scrapeResponse.status === 401) {
          throw new Error('Supabase authentication failed. Please check your API key configuration.')
        } else if (scrapeResponse.status === 403) {
          throw new Error('Firecrawl API access forbidden. Please check your subscription plan.')
        } else if (scrapeResponse.status === 500) {
          throw new Error(errorData.error || 'Internal server error during scraping.')
        } else if (scrapeResponse.status === 502) {
          throw new Error('Service temporarily unavailable. Please try again in a moment.')
        }
        
        throw new Error(errorData.error || 'Failed to scrape website')
      }

      const scrapeData = await scrapeResponse.json()
      console.log('Scraping completed:', scrapeData)

      // Step 2: Generate AI prompt using local API
      onStatusUpdate?.('processing')
      console.log('Scraping status update: processing')
      
      const promptResponse = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteId })
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json()
        throw new Error(errorData.error || 'Failed to generate AI prompt')
      }

      const promptData = await promptResponse.json()

      onStatusUpdate?.('ready')
      console.log('Scraping status update: ready')

      return {
        success: true,
        websiteId,
        pagesScraped: scrapeData?.pagesScraped,
        chatbotId: promptData?.chatbotId,
        method: scrapeData?.method || 'firecrawl-edge-function'
      }

    } catch (error: any) {
      console.error('Scraping workflow error:', error)
      
      // Update website status to error
      await this.supabase
        .from('websites')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)

      onStatusUpdate?.('error')
      console.log('Scraping status update: error')

      return {
        success: false,
        websiteId,
        error: error.message
      }
    }
  }

  /**
   * Retry scraping for a website with enhanced error handling
   */
  async retryScraping(websiteId: string, url: string): Promise<ScrapeResult> {
    console.log(`Retrying scraping for website: ${websiteId}`)
    
    // Reset status to pending and clear previous data
    await this.supabase
      .from('websites')
      .update({ 
        status: 'pending',
        scraped_content: null,
        system_prompt: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    return this.scrapeWebsite({ websiteId, url })
  }

  /**
   * Get scraping status for a website
   */
  async getScrapingStatus(websiteId: string) {
    const { data, error } = await this.supabase
      .from('websites')
      .select('status, scraped_content, system_prompt, updated_at')
      .eq('id', websiteId)
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Subscribe to real-time status updates for a website
   */
  subscribeToStatusUpdates(
    websiteId: string, 
    callback: (status: string) => void
  ) {
    return this.supabase
      .channel(`website-${websiteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'websites',
          filter: `id=eq.${websiteId}`
        },
        (payload) => {
          callback(payload.new.status)
        }
      )
      .subscribe()
  }

  /**
   * Test Supabase Edge Function connection
   */
  async testScrapingConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing Supabase Edge Function connection...')
      
      // Test with a simple URL to verify the edge function is working
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`
        },
        body: JSON.stringify({
          websiteId: 'test-connection',
          url: 'https://example.com'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Connection test successful:', data)
        return { success: true }
      } else {
        const errorData = await response.json()
        console.error('Connection test failed:', errorData)
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        }
      }
    } catch (error: any) {
      console.error('Connection test error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get scraping service status and health check
   */
  async getServiceStatus(): Promise<{ 
    success: boolean; 
    edgeFunctionUrl: string;
    timestamp: string;
    error?: string 
  }> {
    try {
      const testResult = await this.testScrapingConnection()
      
      return {
        success: testResult.success,
        edgeFunctionUrl: this.edgeFunctionUrl,
        timestamp: new Date().toISOString(),
        error: testResult.error
      }
    } catch (error: any) {
      return {
        success: false,
        edgeFunctionUrl: this.edgeFunctionUrl,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  /**
   * Poll for scraping completion (useful for long-running processes)
   */
  async pollScrapingStatus(
    websiteId: string, 
    maxAttempts: number = 20,
    intervalMs: number = 6000
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    let attempt = 0
    
    while (attempt < maxAttempts) {
      try {
        const statusData = await this.getScrapingStatus(websiteId)
        
        if (statusData.status === 'ready') {
          console.log('Polling: Scraping completed successfully')
          return { success: true, status: 'ready' }
        } else if (statusData.status === 'error') {
          console.log('Polling: Scraping failed')
          return { success: false, status: 'error', error: 'Scraping failed' }
        }
        
        // Still processing, wait and try again
        console.log(`Polling attempt ${attempt + 1}: Status is ${statusData.status}`)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        attempt++
        
      } catch (error: any) {
        console.error('Error polling status:', error)
        return { success: false, error: error.message }
      }
    }
    
    return { 
      success: false, 
      error: `Timeout: Scraping did not complete within ${maxAttempts * intervalMs / 1000} seconds` 
    }
  }

  /**
   * Batch scrape multiple websites
   */
  async batchScrapeWebsites(
    websites: Array<{ websiteId: string; url: string }>,
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<Array<ScrapeResult>> {
    const results: ScrapeResult[] = []
    
    for (let i = 0; i < websites.length; i++) {
      const { websiteId, url } = websites[i]
      
      onProgress?.(i, websites.length, url)
      
      try {
        const result = await this.scrapeWebsite({ websiteId, url })
        results.push(result)
        
        // Add delay between requests to avoid rate limiting
        if (i < websites.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error: any) {
        results.push({
          success: false,
          websiteId,
          error: error.message
        })
      }
    }
    
    onProgress?.(websites.length, websites.length, 'Completed')
    return results
  }

  /**
   * Alternative method using createClient's built-in auth
   */
  async scrapeWebsiteWithSupabaseClient(options: ScrapeWebsiteOptions): Promise<ScrapeResult> {
    const { websiteId, url, onStatusUpdate } = options

    try {
      onStatusUpdate?.('scraping')
      
      // Use Supabase client's built-in function invocation (automatically handles auth)
      const { data, error } = await this.supabase.functions.invoke('scrape-website', {
        body: { websiteId, url }
      })

      if (error) {
        throw new Error(error.message)
      }

      onStatusUpdate?.('processing')
      
      // Continue with prompt generation...
      const promptResponse = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId })
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json()
        throw new Error(errorData.error || 'Failed to generate AI prompt')
      }

      const promptData = await promptResponse.json()
      onStatusUpdate?.('ready')

      return {
        success: true,
        websiteId,
        pagesScraped: data?.pagesScraped,
        chatbotId: promptData?.chatbotId,
        method: data?.method || 'firecrawl-edge-function'
      }

    } catch (error: any) {
      console.error('Scraping workflow error:', error)
      
      await this.supabase
        .from('websites')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)

      onStatusUpdate?.('error')

      return {
        success: false,
        websiteId,
        error: error.message
      }
    }
  }
}

export const scrapingService = new ScrapingService()