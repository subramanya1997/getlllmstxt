import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// This is a test API endpoint to verify our cookie handling fix
export async function GET() {
  try {
    // Use our patched Supabase client
    const supabase = await createClient()
    
    // Try to get the current user
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error.message)
      return NextResponse.json({ 
        error: error.message,
        success: false
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      message: 'Auth cookie handling works correctly!', 
      user: data.user,
      success: true
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
} 