import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { scrapingQueue } from '@/lib/scrapping-queue'
// import { scrapingQueue } from '@/lib/scraping-queue'

// Get queue statistics
export async function GET() {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stats = await scrapingQueue.getQueueStats()

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error: any) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue statistics' },
      { status: 500 }
    )
  }
}

// Manually enqueue a website for scraping
export async function POST(request: NextRequest) {
  try {
    const { websiteId, priority = 'normal' } = await request.json()
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get website details
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, url, user_id')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single()

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Enqueue for scraping
    const job = await scrapingQueue.enqueue(website.id, website.url, priority)

    return NextResponse.json({
      success: true,
      job,
      message: 'Website queued for scraping'
    })

  } catch (error: any) {
    console.error('Error queuing website:', error)
    return NextResponse.json(
      { error: 'Failed to queue website for scraping' },
      { status: 500 }
    )
  }
}