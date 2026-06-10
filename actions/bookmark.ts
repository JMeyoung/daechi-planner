'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(contentId: string, isBookmarked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (isBookmarked) {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('content_id', contentId)
  } else {
    await supabase.from('bookmarks').insert({ user_id: user.id, content_id: contentId })
  }

  revalidatePath(`/briefings/${contentId}`)
  revalidatePath('/bookmarks')
  revalidatePath('/dashboard')
}
