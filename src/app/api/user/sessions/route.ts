/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('id, ip_address, user_agent, location, is_current, last_accessed_at, created_at')
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(sessions)

  } catch (error: any) {
    console.error('Error fetching user sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}