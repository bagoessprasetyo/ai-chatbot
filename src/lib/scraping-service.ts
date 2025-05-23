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
}

class ScrapingService {
  private supabase = createClient()

  /**
   * Triggers the complete scraping workflow for a website
   */
  async scrapeWebsite(options: ScrapeWebsiteOptions): Promise<ScrapeResult> {
    const { websiteId, url, onStatusUpdate } = options

    try {
      // Step 1: Trigger scraping using local API
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
        chatbotId: promptData?.chatbotId
      }

    } catch (error: any) {
      console.error('Scraping workflow error:', error)
      
      // Update website status to error
      await this.supabase
        .from('websites')
        .update({ status: 'error' })
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
   * Retry scraping for a website
   */
  async retryScraping(websiteId: string, url: string): Promise<ScrapeResult> {
    // Reset status to pending
    await this.supabase
      .from('websites')
      .update({ 
        status: 'pending',
        scraped_content: null,
        system_prompt: null
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
}

export const scrapingService = new ScrapingService()