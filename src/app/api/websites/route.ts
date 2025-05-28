import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { scrapingQueue } from '@/lib/scrapping-queue'
// import { scrapingQueue } from '@/lib/scraping-queue'

export async function POST(request: NextRequest) {
  try {
    const { url, title, description } = await request.json()
    
    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can create more websites
    const { data: canCreate, error: limitError } = await supabase.rpc('can_create_website', { 
      user_uuid: user.id 
    })

    if (limitError || !canCreate) {
      return NextResponse.json(
        { error: 'Website creation limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Create the website
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: user.id,
        url: url.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        status: 'pending'
      })
      .select()
      .single()

    if (websiteError) {
      throw websiteError
    }

    // ✨ NEW: Automatically enqueue for scraping
    try {
      await scrapingQueue.enqueue(website.id, url.trim(), 'normal')
      console.log(`🚀 Website ${website.id} queued for automatic scraping`)
    } catch (queueError) {
      console.error('Failed to queue scraping job:', queueError)
      // Don't fail the website creation if queuing fails
      // The user can manually trigger scraping later
    }

    return NextResponse.json({
      success: true,
      website: website,
      message: 'Website created successfully and queued for processing'
    })

  } catch (error: any) {
    console.error('Error creating website:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create website' },
      { status: 500 }
    )
  }
}