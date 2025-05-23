/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: website, error } = await supabase
      .from('websites')
      .select('status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ 
      status: website.status 
    })

  } catch (error: any) {
    console.error('Error checking website status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}