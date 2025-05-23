/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/scrape-website/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import * as cheerio from 'cheerio'

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

// Clean and extract main content from HTML
function extractMainContent(html: string, url: string): ScrapedPage {
  const $ = cheerio.load(html)
  
  // Remove script, style, nav, footer, and other non-content elements
  const elementsToRemove = [
    'script', 'style', 'nav', 'footer', 'header', 
    '.navigation', '.nav', '.footer', '.header',
    '.sidebar', '.menu', '.advertisement', '.ads'
  ]
  
  elementsToRemove.forEach(selector => {
    $(selector).remove()
  })

  // Extract title
  const title = $('title').text().trim() || 'Untitled Page'

  // Extract meta description
  const description = $('meta[name="description"]').attr('content')?.trim()

  // Extract keywords
  const keywordsContent = $('meta[name="keywords"]').attr('content')
  const keywords = keywordsContent?.split(',').map(k => k.trim())

  // Try to find main content area
  let mainContent = ''
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '.content',
    'article',
    '.post-content',
    '.entry-content',
    '#content',
    '#main'
  ]

  for (const selector of contentSelectors) {
    const contentEl = $(selector)
    if (contentEl.length && contentEl.text().trim().length > 100) {
      mainContent = contentEl.text().trim()
      break
    }
  }

  // Fallback: extract from body if no main content found
  if (!mainContent) {
    mainContent = $('body').text().trim()
  }

  // Clean up whitespace and normalize
  mainContent = mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  return {
    url,
    title,
    content: mainContent,
    description,
    keywords
  }
}

// Discover pages from sitemap (simplified version)
async function discoverPages(baseUrl: string): Promise<string[]> {
  const urls = new Set<string>([baseUrl])
  
  try {
    // Try to fetch sitemap.xml
    const sitemapUrl = `${baseUrl}/sitemap.xml`
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'WebBot-AI-Scraper/1.0'
      }
    })
    
    if (response.ok) {
      const content = await response.text()
      // Simple XML parsing for URLs
      const urlMatches = content.match(/<loc>(.*?)<\/loc>/g)
      if (urlMatches) {
        urlMatches.forEach(match => {
          const url = match.replace(/<\/?loc>/g, '')
          if (url.startsWith('http')) {
            urls.add(url)
          }
        })
      }
    }
  } catch (error) {
    console.log('No sitemap found, using base URL only')
  }

  // Limit to reasonable number of pages
  return Array.from(urls).slice(0, 10)
}

// Main scraping function
async function scrapeWebsite(url: string): Promise<ScrapedPage[]> {
  console.log('Starting to scrape:', url)
  
  try {
    // Discover pages to scrape
    const pagesToScrape = await discoverPages(url)
    console.log(`Found ${pagesToScrape.length} pages to scrape`)
    
    const scrapedPages: ScrapedPage[] = []
    
    // Scrape each page
    for (const pageUrl of pagesToScrape) {
      try {
        console.log('Scraping page:', pageUrl)
        
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'WebBot-AI-Scraper/1.0 (+https://webbot-ai.com)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!response.ok) {
          console.log(`Failed to fetch ${pageUrl}: ${response.status}`)
          continue
        }
        
        const html = await response.text()
        const scrapedPage = extractMainContent(html, pageUrl)
        
        // Only include pages with substantial content
        if (scrapedPage.content.length > 100) {
          scrapedPages.push(scrapedPage)
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`Error scraping ${pageUrl}:`, error)
        continue
      }
    }
    
    console.log(`Successfully scraped ${scrapedPages.length} pages`)
    return scrapedPages
    
  } catch (error) {
    console.error('Error in scrapeWebsite:', error)
    throw error
  }
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

    console.log(`Starting scrape job for website ${websiteId}: ${url}`)

    const supabase = createServerClient()

    // Update status to scraping
    await supabase
      .from('websites')
      .update({ 
        status: 'scraping',
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    // Perform the scraping
    const scrapedPages = await scrapeWebsite(url)
    
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
        // title: scrapedPages[0]?.title || 'Untitled Website',
        description: scrapedPages[0]?.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    if (updateError) {
      throw updateError
    }

    console.log(`Scraping completed for website ${websiteId}`)

    return NextResponse.json({ 
      success: true, 
      pagesScraped: scrapedPages.length,
      websiteId 
    })

  } catch (error: any) {
    console.error('Scraping error:', error)

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
      { error: error.message },
      { status: 500 }
    )
  }
}