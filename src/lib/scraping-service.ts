/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/scraping-service.ts
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

  /**
   * Triggers the complete scraping workflow for a website using Firecrawl
   */
  async scrapeWebsite(options: ScrapeWebsiteOptions): Promise<ScrapeResult> {
    const { websiteId, url, onStatusUpdate } = options
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || 'fc-048a3afc77d14c789c0922436d3755aa'
  
    // Debug logging
    console.log('Environment check:')
    console.log('FIRECRAWL_API_KEY exists:', !!firecrawlApiKey)
    console.log('FIRECRAWL_API_KEY length:', firecrawlApiKey?.length || 0)

    try {
      // Validate Firecrawl API key
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured. Please add FIRECRAWL_API_KEY to your environment variables.')
      }

      // Step 1: Trigger scraping using Firecrawl API
      onStatusUpdate?.('scraping')
      
      const scrapeResponse = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteId, url })
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        
        // Provide more specific error messages
        if (scrapeResponse.status === 429) {
          throw new Error('Firecrawl API rate limit exceeded. Please try again in a few minutes.')
        } else if (scrapeResponse.status === 401) {
          throw new Error('Firecrawl API authentication failed. Please check your API key.')
        } else if (scrapeResponse.status === 403) {
          throw new Error('Firecrawl API access forbidden. Please check your subscription plan.')
        }
        
        throw new Error(errorData.error || 'Failed to scrape website')
      }

      const scrapeData = await scrapeResponse.json()

      // Step 2: Generate AI prompt using local API
      onStatusUpdate?.('processing')
      
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

      return {
        success: true,
        websiteId,
        pagesScraped: scrapeData?.pagesScraped,
        chatbotId: promptData?.chatbotId,
        method: scrapeData?.method || 'firecrawl'
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
   * Test Firecrawl API connection
   */
  async testFirecrawlConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
      
      if (!firecrawlApiKey) {
        return {
          success: false,
          error: 'Firecrawl API key not configured'
        }
      }

      // Test with a simple scrape of a reliable website
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          pageOptions: {
            onlyMainContent: true,
            includeHtml: false
          }
        })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get Firecrawl usage statistics (if available)
   */
  async getFirecrawlUsage(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
      
      if (!firecrawlApiKey) {
        return {
          success: false,
          error: 'Firecrawl API key not configured'
        }
      }

      // This endpoint might not exist in all Firecrawl plans
      const response = await fetch('https://api.firecrawl.dev/v0/usage', {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}`
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const scrapingService = new ScrapingService()