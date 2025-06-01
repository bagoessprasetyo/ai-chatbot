// src/app/api/scrape-website/route.ts - FIXED VERSION
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

// Enhanced error logging function
async function logError(websiteId: string, error: any, supabase: any) {
  const errorMessage = error.message || 'Unknown error'
  const errorStack = error.stack || ''
  
  console.error(`Scraping error for website ${websiteId}:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString()
  })
  
  // Update website with error details
  await supabase
    .from('websites')
    .update({ 
      status: 'error',
      scraped_content: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', websiteId)
}

// Function to scrape using Firecrawl API
async function scrapeWithFirecrawl(url: string): Promise<ScrapedPage[]> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  
  // Remove hardcoded fallback - force proper env configuration
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is required. Please configure it properly.')
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
      console.error('Firecrawl crawl request failed:', {
        status: crawlResponse.status,
        statusText: crawlResponse.statusText,
        error: errorText,
        url: url
      })
      
      // Try single page as fallback immediately
      console.log('Trying single page scrape as fallback')
      return await scrapePageWithFirecrawl(url)
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
          console.error(`Failed to check crawl status: ${statusResponse.status}`)
          // Try single page fallback
          return await scrapePageWithFirecrawl(url)
        }

        const statusResult = await statusResponse.json()
        console.log(`Crawl status check ${attempt + 1}:`, statusResult.status)

        if (statusResult.status === 'completed') {
          return processFirecrawlData(statusResult.data || [])
        } else if (statusResult.status === 'failed') {
          console.error('Firecrawl job failed:', statusResult.error)
          // Try single page fallback
          return await scrapePageWithFirecrawl(url)
        }

        attempt++
      }
      
      console.log('Crawl timed out, trying single page fallback')
      return await scrapePageWithFirecrawl(url)
    }

    // If we get immediate results
    if (crawlResult.success && crawlResult.data) {
      return processFirecrawlData(crawlResult.data)
    }

    // If no jobId and no immediate results, try single page
    return await scrapePageWithFirecrawl(url)

  } catch (error) {
    console.error('Firecrawl crawl error:', error)
    
    // Fallback: try single page scrape
    console.log('Falling back to single page scrape due to error')
    return await scrapePageWithFirecrawl(url)
  }
}

// Function to scrape a single page with Firecrawl
async function scrapePageWithFirecrawl(url: string): Promise<ScrapedPage[]> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is required for single page scrape.')
  }

  console.log('Attempting single page scrape for:', url)

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
    console.error('Firecrawl single page scrape failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: url
    })
    throw new Error(`Firecrawl single page scrape failed: ${response.status} - ${errorText}`)
  }

  const result: FirecrawlResponse = await response.json()
  console.log('Single page scrape result:', { success: result.success, hasData: !!result.data })

  if (!result.success || !result.data) {
    throw new Error('Failed to scrape page: ' + (result.error || 'No data returned'))
  }

  return processFirecrawlData([result.data] as any)
}

// Process Firecrawl response data into our format
function processFirecrawlData(data: any[]): ScrapedPage[] {
  console.log(`Processing ${data.length} pages from Firecrawl`)
  const scrapedPages: ScrapedPage[] = []

  for (const page of data) {
    // Extract content - prefer markdown, fallback to content
    const content = page.markdown || page.content || ''
    
    // Skip pages with very little content (but lower threshold)
    if (content.length < 50) {
      console.log(`Skipping page with minimal content: ${page.metadata?.sourceURL || page.url}`)
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

  console.log(`Successfully processed ${scrapedPages.length} pages`)
  return scrapedPages
}

export async function POST(request: NextRequest) {
  let websiteId: string | undefined
  let supabase: any

  try {
    const { websiteId: reqWebsiteId, url }: ScrapeRequest = await request.json()
    websiteId = reqWebsiteId
    
    if (!websiteId || !url) {
      return NextResponse.json(
        { error: 'Missing websiteId or url' },
        { status: 400 }
      )
    }

    console.log(`Starting scrape job for website ${websiteId}: ${url}`)

    supabase = createServerClient()

    // Update status to scraping
    const { error: updateError } = await supabase
      .from('websites')
      .update({ 
        status: 'scraping',
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    if (updateError) {
      console.error('Failed to update status to scraping:', updateError)
      // Don't fail the request, just log it
    }

    // Perform the scraping with Firecrawl
    console.log('Starting Firecrawl scraping...')
    const scrapedPages = await scrapeWithFirecrawl(url)
    
    if (scrapedPages.length === 0) {
      throw new Error('No content could be extracted from the website. The site may be blocking scrapers or have no accessible content.')
    }
    
    console.log(`Successfully scraped ${scrapedPages.length} pages`)
    
    // Process and combine content
    const combinedContent = {
      pages: scrapedPages,
      totalPages: scrapedPages.length,
      mainContent: scrapedPages.map(page => page.content).join('\n\n'),
      titles: scrapedPages.map(page => page.title),
      descriptions: scrapedPages.filter(page => page.description).map(page => page.description),
      keywords: Array.from(new Set(scrapedPages.flatMap(page => page.keywords || []))),
      scrapedAt: new Date().toISOString(),
      method: 'firecrawl'
    }

    // Store the scraped content
    console.log('Updating database with scraped content...')
    const { error: contentUpdateError } = await supabase
      .from('websites')
      .update({
        status: 'ready',
        scraped_content: combinedContent,
        title: scrapedPages[0]?.title || null,
        description: scrapedPages[0]?.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    if (contentUpdateError) {
      console.error('Failed to update website with scraped content:', contentUpdateError)
      throw new Error(`Database update failed: ${contentUpdateError.message}`)
    }

    console.log(`Scraping completed successfully for website ${websiteId}`)

    return NextResponse.json({ 
      success: true, 
      pagesScraped: scrapedPages.length,
      websiteId,
      method: 'firecrawl',
      totalCharacters: combinedContent.mainContent.length,
      message: `Successfully scraped ${scrapedPages.length} pages`
    })

  } catch (error: any) {
    console.error('Scraping error:', error)

    // Enhanced error handling
    if (websiteId && supabase) {
      await logError(websiteId, error, supabase)
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to scrape website',
        websiteId,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name
        } : undefined
      },
      { status: 500 }
    )
  }
}