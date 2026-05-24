import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual parsing of .env
const envText = fs.readFileSync('.env', 'utf8')
const supabaseUrl = envText.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim()
const supabaseAnonKey = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)?.[1]?.trim()

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Failed to parse Supabase environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runTest() {
  const email = `test_${Date.now()}@test.com`
  const password = 'TestPassword123!'
  const name = 'Test User'

  console.log('\n--- Testing SignUp ---')
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: name
        }
      }
    })

    if (error) {
      console.error('SignUp Error:', error)
    } else {
      console.log('SignUp Success!')
      console.log('User ID:', data.user?.id)
      console.log('Session exists:', !!data.session)
    }
  } catch (err) {
    console.error('SignUp Exception:', err)
  }

  console.log('\n--- Testing SignIn ---')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('SignIn Error:', error)
    } else {
      console.log('SignIn Success!')
      console.log('User ID:', data.user?.id)
      console.log('Session exists:', !!data.session)
    }
  } catch (err) {
    console.error('SignIn Exception:', err)
  }
}

runTest()
