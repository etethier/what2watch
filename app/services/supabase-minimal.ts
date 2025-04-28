import { createClient } from '@supabase/supabase-js'

// Simplified client creation for testing purposes
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing environment variables: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${
        !supabaseKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
      }`
    )
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Function to test Supabase connection
export async function testConnection() {
  try {
    const start = performance.now()
    const supabase = createSupabaseClient()
    
    // Simple query to test connection - fetch system time from Supabase
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle()
    
    // If the table doesn't exist, that's OK. We'll try another method
    if (error && error.code === '42P01') { // Table doesn't exist error
      // Try a simple RPC call to test connection
      const { data: timeData, error: timeError } = await supabase.rpc('get_current_timestamp')
      
      if (timeError) {
        // Try a simple auth call as a last resort
        const { data: authData, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          return {
            success: false,
            message: 'All connection tests failed',
            errors: [error, timeError, authError],
            duration: performance.now() - start
          }
        }
        
        return {
          success: true,
          message: 'Auth API connection successful',
          data: authData,
          duration: performance.now() - start
        }
      }
      
      return {
        success: true,
        message: 'RPC connection successful',
        data: timeData,
        duration: performance.now() - start
      }
    }
    
    if (error) {
      return {
        success: false,
        message: 'Database query failed',
        error,
        duration: performance.now() - start
      }
    }
    
    return {
      success: true,
      message: 'Database query successful',
      data,
      duration: performance.now() - start
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection setup failed',
      error: (error as Error).message,
    }
  }
} 