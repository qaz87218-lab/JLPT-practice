'use client'
import { useRouter } from 'next/navigation'
import { N2_2018_07_READING } from '@/lib/reading-exams'
import { recordKey, useLocalStudy } from '@/lib/local-store'
export default function ExamIndexClient(){
  const router=useRouter(), state=useLocalStudy()
  const count=N2_2018_07_READING.questions.filter(q=>state.readingAnswers[recordKey('N2','reading',q.id)]).length
  return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" aria-label="回 N2 學習區" onClick={()=>router.push('/jlpt/n2')}>←</button><div><p className="eyebrow">N2 / 歷年試題</p><h1>模擬試題與歷年真題</h1><p className="muted small">僅顯示實際已建置的題庫</p></div></div></header>
    <section className="study-container"><div className="reading-overview"><div><h2>已收錄考試分項</h2><p>目前有 2018 年 7 月 N2 的讀解部分，其他文字語彙、文法、聽力及整回模擬考尚未匯入，不會虛構內容。</p></div></div>
    <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">2018 · 07 · N2</span><h2>読解：問題 10～14</h2><p>21 題 · 11 組閱讀資料 · 掃描原文及答案詳解 · 本機紀錄</p><p className="muted small">答題進度：{count} / 21 題</p></div><button className="primary-button" onClick={()=>router.push('/jlpt/n2/reading')}>開始／繼續練習 →</button></article></section>
  </main>
}
