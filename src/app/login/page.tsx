'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/jlpt') }, [router])
  return <main className="center-screen"><div><p>本機版不需要登入或建立帳號。</p><a href="/jlpt/">直接開始學習 →</a></div></main>
}
