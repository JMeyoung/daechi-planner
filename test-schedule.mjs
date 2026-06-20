import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const start_at = new Date('2000-01-01T19:00:00').toISOString()
  const end_at = new Date('2000-01-01T22:00:00').toISOString()

  console.log('start_at:', start_at)
  console.log('end_at:', end_at)

  // Get a user
  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users || users.users.length === 0) {
    console.log('No users found')
    return
  }
  const user = users.users[0]

  const payload = {
    user_id: user.id,
    title: 'test schedule',
    category: 'academy',
    start_at,
    end_at,
    is_recurring: false
  }

  const { data, error } = await supabase.from('schedule_events').insert(payload)
  console.log('Result:', { data, error })
}

test()
