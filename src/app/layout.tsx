import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JLPT Deep Practice（本機版）',
  description: '不用帳號、不用雲端 API 的 N5～N1 日語學習系統；學習紀錄只儲存在本機瀏覽器。',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>
}
