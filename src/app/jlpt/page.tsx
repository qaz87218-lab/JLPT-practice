'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { JLPT_DATA, JLPT_LEVELS } from '@/data/jlpt'
import { exportLocalBackup, importLocalBackup, useLocalStudy } from '@/lib/local-store'
import type { JlptLevel } from '@/lib/types'
import { getCatalogMeta,type CatalogMeta } from '@/lib/vocab-db'

function totalItems(level: JlptLevel) {
  const d = JLPT_DATA[level]
  return d.vocabulary.length+d.grammar.length+d.reading.length+d.listening.length+d.speaking.length+d.mockTests.length
}
export default function JlptHomePage() {
  const router=useRouter()
  const state=useLocalStudy()
  const picker=useRef<HTMLInputElement>(null)
  const [message,setMessage]=useState('')
  const [vocabMeta,setVocabMeta]=useState<CatalogMeta|null>(null)
  useEffect(()=>{void getCatalogMeta().then(setVocabMeta).catch(()=>{})},[])
  const summary=useMemo(() => Object.fromEntries(JLPT_LEVELS.map(level=>{
    const rows=Object.values(state.progress).filter(row=>row.level===level)
    return [level,{learning:rows.filter(row=>row.status==='learning').length,mastered:rows.filter(row=>row.status==='mastered').length}]
  })) as Record<JlptLevel,{learning:number;mastered:number}>,[state.progress])
  async function upload(files: FileList | null) {
    const file=files?.[0]
    if (!file) return
    try {
      if (!window.confirm('匯入將取代目前此瀏覽器的學習紀錄。建議先匯出備份。確定繼續？')) return
      await importLocalBackup(file)
      setMessage('已成功還原本機學習紀錄。')
    } catch(err) { setMessage(err instanceof Error?err.message:'匯入失敗。') }
    finally { if(picker.current) picker.current.value='' }
  }
  return <main className="app-shell">
    <header className="topbar wide-topbar"><div><p className="eyebrow">JLPT DEEP PRACTICE</p><h1>學習總覽</h1><p className="muted small">免登入 · 資料只存這個瀏覽器</p></div></header>
    <section className="dashboard-container">
      <div className="hero-panel"><div><span className="hero-kicker">N5 → N1</span><h2>選擇學習級別</h2><p>已內建 TRY！N5～N1 共 551 個文法項目。單字模組可一次匯入 OpenJLPT，資料儲存在本機；尚無教材的其他模組顯示「尚未建置」。</p></div><div className="sync-badge"><span className="sync-dot" /> 本機儲存 · 無需 API</div></div>
      <section className="local-tools"><div><strong>學習資料備份</strong><p className="muted small">學習進度、收藏、筆記僅儲存在目前瀏覽器。換手機、清除網站資料前請匯出 JSON。</p></div>
        <div className="local-tools-actions"><button className="ghost-button bordered" onClick={exportLocalBackup}>匯出 JSON</button><button className="ghost-button bordered" onClick={()=>picker.current?.click()}>匯入 JSON</button><input ref={picker} type="file" accept=".json,application/json" hidden onChange={e=>void upload(e.target.files)} /></div>
      </section>
      {message && <p className="form-message" role="status">{message}</p>}
      <div className="level-grid">{JLPT_LEVELS.map(level=>{
        const total=totalItems(level)+(vocabMeta?.perLevel[level]??0),stat=summary[level],pct=total?Math.round(stat.mastered/total*100):0
        return <button key={level} className={`level-card level-${level.toLowerCase()}`} onClick={()=>router.push(`/jlpt/${level.toLowerCase()}`)}>
          <div className="level-card-top"><span className="level-code">{level}</span><span className="level-arrow">→</span></div>
          <div className="level-card-copy"><strong>{level} 學習區</strong><span>單字・文法・文章・聽力・口說・模擬試題</span></div>
          <div className="progress-track"><span style={{width:`${pct}%`}} /></div>
          <div className="level-stats"><span>教材 {total}</span><span>學習中 {stat.learning}</span><span>已掌握 {stat.mastered}</span></div>
        </button>
      })}</div>
    </section>
  </main>
}
