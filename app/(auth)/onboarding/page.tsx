import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()])
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (profile?.full_name) redirect('/dashboard')

  async function save(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const full_name = (formData.get('full_name') as string)?.trim()
    if (!full_name) return

    const gradeRaw = formData.get('child_grade')
    const child_grade = gradeRaw ? Number(gradeRaw) : null

    await supabase
      .from('profiles')
      .update({ full_name, child_grade })
      .eq('id', user.id)

    redirect('/dashboard')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">시작하기</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          서비스를 더 잘 활용하기 위해 간단히 알려주세요.
        </p>

        <form action={save} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoFocus
              placeholder="홍길동"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="child_grade" className="block text-sm font-medium text-gray-700 mb-1">
              자녀 학년
            </label>
            <select
              id="child_grade"
              name="child_grade"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택 안 함</option>
              <option value="1">중학교 1학년</option>
              <option value="2">중학교 2학년</option>
              <option value="3">중학교 3학년</option>
              <option value="4">고등학교 1학년</option>
              <option value="5">고등학교 2학년</option>
              <option value="6">고등학교 3학년</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            대치 플래너 시작하기
          </button>
        </form>
      </div>
    </div>
  )
}
