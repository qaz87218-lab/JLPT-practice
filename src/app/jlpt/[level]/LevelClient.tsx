'use client'

import { useMemo } from 'react'
import { useParams,useRouter } from 'next/navigation'
import { JLPT_SECTION_META,getSectionCount,isJlptLevel } from '@/data/jlpt'
import { useLocalStudy } from '@/lib/local-store'
import type { JlptSection } from '@/lib/types'
const SECTIONS: JlptSection[]=['vocabulary','grammar','reading','listening','speaking','mock']
export default function LevelClient() {
 const params=useParams<{level:string}>(),router=useRouter(),state=useLocalStudy()
 const rawLevel=(params.level??'').toUpperCase(), level=isJlptLevel(rawLevel)?rawLevel:null
 const stats=useMemo(()=>Object.fromEntries(SECTIONS.map(section=>{
   const rows=Object.values(state.progress).filter(row=>row.level===level&&row.section===section)
   return [section,{learning:rows.filter(row=>row.status==='learning').length,mastered:rows.filter(row=>row.status==='mastered').length}]
 })) as Record<JlptSection,{learning:number;mastered:number}>,[level,state.progress])
 if(!level) return <main className="center-screen"><button className="primary-button" onClick={()=>router.push('/jlpt')}>回總覽</button></main>
 return <main className="app-shell">
   <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt')}>←</button><div><p className="eyebrow">JLPT {level}</p><h1>{level} 學習區</h1><p className="muted small">本機版 · 無需帳號</p></div></div></header>
   <section className="dashboard-container"><div className="level-hero"><span className="level-hero-code">{level}</span><div><h2>五大學習模組＋模擬試題</h2><p>文法可檢視、收藏、做筆記並手動標記學習進度。尚未匯入的教材顯示空白，不產生虛構內容。</p></div></div>
   <div className="section-grid">{SECTIONS.map(section=>{const meta=JLPT_SECTION_META[section],count=getSectionCount(level,section),stat=stats[section]
     return <button className="section-card" key={section} onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/${section}`)}><div className="section-icon">{meta.icon}</div><div className="section-card-body"><div className="section-card-heading"><h3>{meta.title}</h3><span>{count} {section==='mock'?'回':'項'}</span></div><p>{meta.description}</p><div className="section-mini-stats"><span>學習中 {stat.learning}</span><span>已掌握 {stat.mastered}</span></div></div><span className="level-arrow">→</span></button>
   })}</div></section>
 </main>
}
