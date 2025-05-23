// src/lib/supabase-server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase client (for use in server components and API routes)
export const createServerClient = () => createServerComponentClient({ cookies })