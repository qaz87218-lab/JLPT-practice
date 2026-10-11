'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/jlpt') }, [router])
  return <main className="center-screen"><a href="/jlpt/">前往 JLPT 學習總覽 →</a></main>
}
