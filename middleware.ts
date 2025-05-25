// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (req.nextUrl.pathname.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight reqs
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    // return response
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}