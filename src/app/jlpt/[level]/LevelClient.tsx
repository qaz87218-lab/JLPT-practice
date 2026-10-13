'use client'

import { useEffect,useMemo,useState } from 'react'
import { useParams,useRouter } from 'next/navigation'
import { JLPT_SECTION_META,getSectionCount,isJlptLevel } from '@/data/jlpt'
import { useLocalStudy } from '@/lib/local-store'
import type { JlptSection } from '@/lib/types'
import { getCatalogMeta,type CatalogMeta } from '@/lib/vocab-db'
import {getCourseLessons,getCourseUnits} from '@/lib/grammar-courses'
import {courseRecordKey} from '@/lib/local-store'
const SECTIONS: JlptSection[]=['vocabulary','grammar','reading','listening','speaking','mock']
export default function LevelClient() {
 const params=useParams<{level:string}>(),router=useRouter(),state=useLocalStudy()
 const [vocabMeta,setVocabMeta]=useState<CatalogMeta|null>(null)
 useEffect(()=>{void getCatalogMeta().then(setVocabMeta).catch(()=>{})},[])
 const rawLevel=(params.level??'').toUpperCase(), level=isJlptLevel(rawLevel)?rawLevel:null
 const stats=useMemo(()=>Object.fromEntries(SECTIONS.map(section=>{
   const rows=Object.values(state.progress).filter(row=>row.level===level&&row.section===section)
   return [section,{learning:rows.filter(row=>row.status==='learning').length,mastered:rows.filter(row=>row.status==='mastered').length}]
 })) as Record<JlptSection,{learning:number;mastered:number}>,[level,state.progress])
 if(!level) return <main className="center-screen"><button className="primary-button" onClick={()=>router.push('/jlpt')}>回總覽</button></main>
 return <main className="app-shell">
   <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt')}>←</button><div><p className="eyebrow">JLPT {level}</p><h1>{level} 學習區</h1><p className="muted small">本機版 · 無需帳號</p></div></div></header>
   <section className="dashboard-container"><div className="level-hero"><span className="level-hero-code">{level}</span><div><h2>五大學習模組＋模擬試題</h2><p>文法可閱讀、收藏及筆記；單字可匯入後離線查閱。N2 已新增 2018 年 7 月書面試題 75 題（語彙、文法、讀解），可作答、看原卷與詳解。</p></div></div>
   <button className="course-entry" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses`)}>
      <div className="section-icon">課</div><div className="section-card-body"><div className="section-card-heading"><h3>系統課程（新）</h3><span>{getCourseUnits(level).length} 單元 · {getCourseLessons(level).length} 堂</span></div>
      <p>依你的 N5～N2 總整理改寫：依主題學習、例句、辨析及課後自測。</p><div className="section-mini-stats"><span>已完成 {getCourseLessons(level).filter(l=>{const p=state.courses[courseRecordKey(level,l.id)];return p?.readCompleted&&p?.quizPassed}).length} 堂</span><span>進度存本機</span></div></div><span className="level-arrow">→</span>
   </button>
   <div className="section-grid">{SECTIONS.map(section=>{const meta=JLPT_SECTION_META[section],count=section==='vocabulary'?(vocabMeta?.perLevel[level]??0):getSectionCount(level,section),stat=stats[section]
     return <button className="section-card" key={section} onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/${section}`)}><div className="section-icon">{meta.icon}</div><div className="section-card-body"><div className="section-card-heading"><h3>{meta.title}</h3><span>{section==='vocabulary'&&!vocabMeta?'待匯入':`${count} ${section==='mock'?'份':section==='reading'?'題':'項'}`}</span></div><p>{meta.description}</p><div className="section-mini-stats"><span>學習中 {stat.learning}</span><span>已掌握 {stat.mastered}</span></div></div><span className="level-arrow">→</span></button>
   })}</div></section>
 </main>
}
