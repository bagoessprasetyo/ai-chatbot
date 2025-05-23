/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/scrape-website/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

interface ScrapeRequest {
  websiteId: string
  url: string
}

interface ScrapedPage {
  url: string
  title: string
  content: string
  description?: string
  keywords?: string[]
}

interface FirecrawlResponse {
  success: boolean
  data?: {
    content: string
    markdown: string
    metadata: {
      title: string
      description?: string
      keywords?: string
      [key: string]: any
    }
    [key: string]: any
  }[]
  error?: string
}

// Function to scrape using Firecrawl API
async function scrapeWithFirecrawl(url: string): Promise<ScrapedPage[]> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || 'fc-048a3afc77d14c789c0922436d3755aa'
  
  // Debug logging
  console.log('Environment check:')
  console.log('FIRECRAWL_API_KEY exists:', !!firecrawlApiKey)
  console.log('FIRECRAWL_API_KEY length:', firecrawlApiKey?.length || 0)
  
  if (!firecrawlApiKey) {
    throw new Error('Firecrawl API key not configured. Please add FIRECRAWL_API_KEY to your environment variables 1.')
  }

  console.log('Starting Firecrawl scrape for:', url)

  try {
    // Use Firecrawl's crawl endpoint to get multiple pages
    const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: url,
        crawlerOptions: {
          includes: [`${new URL(url).origin}/*`],
          excludes: [
            '**/blog/**',
            '**/news/**',
            '**/press/**',
            '**/*.pdf',
            '**/*.jpg',
            '**/*.png',
            '**/*.gif'
          ],
          generateImgAltText: false,
          returnOnlyUrls: false,
          maxDepth: 2,
          mode: 'fast',
          limit: 10
        },
        pageOptions: {
          onlyMainContent: true,
          includeHtml: false,
          includeRawHtml: false
        }
      })
    })

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text()
      console.error('Firecrawl crawl request failed:', crawlResponse.status, errorText)
      throw new Error(`Firecrawl API error: ${crawlResponse.status} - ${errorText}`)
    }

    const crawlResult = await crawlResponse.json()
    console.log('Firecrawl crawl initiated:', crawlResult)

    // If we get a jobId, we need to poll for results
    if (crawlResult.jobId) {
      console.log('Polling for crawl results, jobId:', crawlResult.jobId)
      
      // Poll for results with timeout
      const maxAttempts = 30 // 5 minutes max
      let attempt = 0
      
      while (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
        
        const statusResponse = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${crawlResult.jobId}`, {
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`
          }
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to check crawl status: ${statusResponse.status}`)
        }

        const statusResult = await statusResponse.json()
        console.log(`Crawl status check ${attempt + 1}:`, statusResult.status)

        if (statusResult.status === 'completed') {
          return processFirecrawlData(statusResult.data || [])
        } else if (statusResult.status === 'failed') {
          throw new Error('Firecrawl job failed: ' + (statusResult.error || 'Unknown error'))
        }

        attempt++
      }
      
      throw new Error('Crawl timed out after 5 minutes')
    }

    // If we get immediate results
    if (crawlResult.success && crawlResult.data) {
      return processFirecrawlData(crawlResult.data)
    }

    throw new Error('Unexpected response from Firecrawl API')

  } catch (error) {
    console.error('Firecrawl error:', error)
    
    // Fallback: try single page scrape
    console.log('Falling back to single page scrape')
    return await scrapePageWithFirecrawl(url)
  }
}

// Function to scrape a single page with Firecrawl
async function scrapePageWithFirecrawl(url: string): Promise<ScrapedPage[]> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  
  if (!firecrawlApiKey) {
    throw new Error('Firecrawl API key not configured for single page scrape.')
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firecrawlApiKey}`
    },
    body: JSON.stringify({
      url: url,
      pageOptions: {
        onlyMainContent: true,
        includeHtml: false,
        includeRawHtml: false
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Firecrawl single page scrape failed: ${response.status} - ${errorText}`)
  }

  const result: FirecrawlResponse = await response.json()

  if (!result.success || !result.data) {
    throw new Error('Failed to scrape page: ' + (result.error || 'Unknown error'))
  }

  return processFirecrawlData([result.data] as any)
}

// Process Firecrawl response data into our format
function processFirecrawlData(data: any[]): ScrapedPage[] {
  const scrapedPages: ScrapedPage[] = []

  for (const page of data) {
    // Extract content - prefer markdown, fallback to content
    const content = page.markdown || page.content || ''
    
    // Skip pages with very little content
    if (content.length < 100) {
      continue
    }

    const scrapedPage: ScrapedPage = {
      url: page.metadata?.sourceURL || page.url || '',
      title: page.metadata?.title || 'Untitled Page',
      content: content,
      description: page.metadata?.description || undefined,
      keywords: page.metadata?.keywords ? 
        (typeof page.metadata.keywords === 'string' ? 
          page.metadata.keywords.split(',').map((k: string) => k.trim()) : 
          page.metadata.keywords) : 
        undefined
    }

    scrapedPages.push(scrapedPage)
  }

  console.log(`Processed ${scrapedPages.length} pages from Firecrawl data`)
  return scrapedPages
}

export async function POST(request: NextRequest) {
  try {
    const { websiteId, url }: ScrapeRequest = await request.json()
    
    if (!websiteId || !url) {
      return NextResponse.json(
        { error: 'Missing websiteId or url' },
        { status: 400 }
      )
    }

    console.log(`Starting Firecrawl scrape job for website ${websiteId}: ${url}`)

    const supabase = createServerClient()

    // Update status to scraping
    await supabase
      .from('websites')
      .update({ 
        status: 'scraping',
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    // Perform the scraping with Firecrawl
    const scrapedPages = await scrapeWithFirecrawl(url)
    
    if (scrapedPages.length === 0) {
      throw new Error('No content could be extracted from the website')
    }
    
    // Process and combine content
    const combinedContent = {
      pages: scrapedPages,
      totalPages: scrapedPages.length,
      mainContent: scrapedPages.map(page => page.content).join('\n\n'),
      titles: scrapedPages.map(page => page.title),
      descriptions: scrapedPages.filter(page => page.description).map(page => page.description),
      keywords: Array.from(new Set(scrapedPages.flatMap(page => page.keywords || [])))
    }

    // Store the scraped content
    const { error: updateError } = await supabase
      .from('websites')
      .update({
        status: 'ready',
        scraped_content: combinedContent,
        title: scrapedPages[0]?.title || null,
        description: scrapedPages[0]?.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    if (updateError) {
      throw updateError
    }

    console.log(`Firecrawl scraping completed for website ${websiteId}`)

    return NextResponse.json({ 
      success: true, 
      pagesScraped: scrapedPages.length,
      websiteId,
      method: 'firecrawl'
    })

  } catch (error: any) {
    console.error('Firecrawl scraping error:', error)

    // Update website status to error
    try {
      const body = await request.clone().json()
      if (body.websiteId) {
        const supabase = createServerClient()
        
        await supabase
          .from('websites')
          .update({ 
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', body.websiteId)
      }
    } catch (e) {
      console.error('Failed to update error status:', e)
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to scrape website',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}