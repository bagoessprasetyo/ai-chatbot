/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (insertError) throw insertError
      
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(settings)

  } catch (error: any) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Update user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(settings)

  } catch (error: any) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// src/app/api/user/api-keys/route.ts


// src/app/api/user/api-keys/[id]/route.ts


// src/app/api/user/subscription/route.ts


// src/app/api/user/billing-history/route.ts


// src/app/api/user/security/route.ts


// src/app/api/user/sessions/route.ts


// src/app/api/user/usage/route.ts


// src/app/api/user/dashboard-stats/route.ts
