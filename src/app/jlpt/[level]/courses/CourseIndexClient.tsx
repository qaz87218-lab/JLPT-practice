'use client'
import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { isJlptLevel } from '@/data/jlpt'
import { getCourseUnits, getCourseLessons } from '@/lib/grammar-courses'
import { courseRecordKey, useLocalStudy } from '@/lib/local-store'

export default function CourseIndexClient() {
  const params=useParams<{level:string}>(),router=useRouter(),study=useLocalStudy()
  const [search,setSearch]=useState('')
  const label=(params.level??'').toUpperCase(),level=isJlptLevel(label)?label:null
  const units=useMemo(()=>level?getCourseUnits(level):[],[level]), lessons=useMemo(()=>level?getCourseLessons(level):[],[level])
  if(!level) return <main className="app-shell"><p>無效的 JLPT 等級。</p></main>
  const passed=lessons.filter(l=>{const p=study.courses[courseRecordKey(level,l.id)];return p?.quizPassed&&p?.readCompleted}).length
  const read=lessons.filter(l=>study.courses[courseRecordKey(level,l.id)]?.readCompleted).length
  const query=search.trim().toLowerCase()
  return <main className="app-shell">
    <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}`)}>←</button><div><p className="eyebrow">JLPT {level} / COURSE</p><h1>系統課程</h1><p className="muted small">依使用者提供的總整理改寫 · 無 API · 本機儲存</p></div></div></header>
    <section className="study-container course-area">
      <div className="course-intro"><div><span className="hero-kicker">學習路線</span><h2>{level} 文法概念課</h2><p>按原資料主題安排順序：閱讀說明 → 觀察例句 → 課後自測。完成須同時「標記已讀」與「自測答對」，避免只開啟頁面就被當作掌握。</p></div>
      <div className="course-summary"><strong>{passed} / {lessons.length}</strong><span>堂完成</span><small>已閱讀 {read} 堂</small></div></div>
      {lessons.length ? <><div className="progress-track course-track"><span style={{width:`${Math.round(100*passed/lessons.length)}%`}} /></div>
      <label className="course-search-label" htmlFor="course-search">搜尋課程</label><input id="course-search" className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="輸入文法、課名或重點…"/>
      <div className="course-unit-list">{units.map((unit,index)=>{
        const list=lessons.filter(lesson=>lesson.unitId===unit.id&&(!query||`${lesson.title} ${lesson.pattern} ${lesson.explanation}`.toLowerCase().includes(query)))
        if(!list.length) return null
        const completed=list.filter(l=>{const row=study.courses[courseRecordKey(level,l.id)];return row?.readCompleted&&row?.quizPassed}).length
        return <section key={unit.id} className="course-unit"><div className="course-unit-header"><div><span className="eyebrow">單元 {index+1}</span><h2>{unit.title}</h2><p className="muted small">來源：{unit.sourceFile} · {unit.sourceChapter}{unit.sourcePage?` · PDF 第 ${unit.sourcePage} 頁起`:''}</p></div><span className="course-unit-count">{completed}/{list.length}</span></div>
        {list.map((l,i)=>{const row=study.courses[courseRecordKey(level,l.id)];const done=row?.readCompleted&&row?.quizPassed
          return <button className="course-lesson-row" key={l.id} onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses/${l.id}`)}><span className={`course-lesson-status ${done?'complete':''}`}>{done?'✓':i+1}</span><span className="course-lesson-copy"><strong>{l.title}</strong><small>{l.objective}</small></span><span className="course-lesson-info">{done?'已完成':row?.readCompleted?'已閱讀':'開始學習'} →</span></button>})}</section>})}</div></>:
      <div className="empty-module"><div className="empty-module-icon">課</div><h2>{level} 課程尚未建置</h2><p>目前收到的總整理為 N5、N4、N3、N2；N1 尚無總整理來源，不會虛構課程。</p></div>}
    </section>
  </main>
}
