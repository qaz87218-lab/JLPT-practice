'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { isJlptLevel } from '@/data/jlpt'
import { getCourseLesson, getCourseLessons, getCourseUnit } from '@/lib/grammar-courses'
import { courseRecordKey, markCourseRead, recordCourseAttempt, useLocalStudy } from '@/lib/local-store'

export default function CourseLessonClient() {
  const {level:rawLevel,lesson:lessonId}=useParams<{level:string;lesson:string}>()
  const router=useRouter(),study=useLocalStudy(),level=isJlptLevel((rawLevel??'').toUpperCase())?(rawLevel??'').toUpperCase() as 'N5'|'N4'|'N3'|'N2'|'N1':null
  const lesson=level?getCourseLesson(level,lessonId):undefined
  const [choice,setChoice]=useState<number|null>(null),[feedback,setFeedback]=useState<string>(''),[error,setError]=useState('')
  useEffect(()=>{setChoice(null);setFeedback('');setError('')},[lessonId])
  if(!level||!lesson) return <main className="app-shell"><div className="empty-module"><h2>找不到課堂</h2><button className="primary-button" onClick={()=>router.push('/jlpt')}>返回總覽</button></div></main>
  const unit=getCourseUnit(level,lesson.unitId)
  const list=getCourseLessons(level)
  const idx=list.findIndex(l=>l.id===lesson.id), next=list[idx+1], previous=list[idx-1]
  const progress=study.courses[courseRecordKey(level,lesson.id)]
  const completed=!!(progress?.readCompleted&&progress?.quizPassed)
  const question=lesson.questions[0]
  function markRead(){ try { markCourseRead(level!,lesson!.id,!progress?.readCompleted) }catch(e){setError(e instanceof Error?e.message:'無法寫入紀錄') } }
  function check(){ if(choice===null) return;try { const correct=recordCourseAttempt(level!,lesson!.id,choice,question.answerIndex);setFeedback(correct?'正確。':'此題尚未答對，可以重新作答。') }catch(e){setError(e instanceof Error?e.message:'無法寫入紀錄') }}
  return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses`)}>←</button><div><p className="eyebrow">{level} / 系統課程 / {unit?.title}</p><h1>{lesson.title}</h1><p className="muted small">{completed?'✓ 本堂已完成':'完成條件：已閱讀＋自測答對'}</p></div></div></header>
  <div className="course-lesson-layout"><article className="course-lesson-article">
     <section className="course-content-block"><span className="eyebrow">本課目標</span><p>{lesson.objective}</p></section>
     <section className="course-content-block"><span className="eyebrow">重點句型</span><h2>{lesson.pattern}</h2><p>{lesson.explanation}</p></section>
     <section className="course-content-block"><span className="eyebrow">語感與辨析</span><p>{lesson.nuance}</p></section>
     <section className="course-example-block"><span className="eyebrow">示範例句</span><p className="course-example-ja">{lesson.example.ja}</p><p className="course-example-reading">{lesson.example.reading}</p><p>{lesson.example.zh}</p><small>{lesson.example.provenance}</small></section>
     <section className="course-content-block"><span className="eyebrow">容易混淆之處</span><p>{lesson.caution}</p></section>
     <div className="course-source-line"><strong>資料依據：</strong>{lesson.source.filename}，{lesson.source.section}{lesson.source.pdfPage?`（PDF 第 ${lesson.source.pdfPage} 頁起）`:''}。<span>{lesson.source.note}</span><p>教學內容已作編輯校訂，尚待日語教師終審；原文件的延伸語言文化評論不視為已驗證的普遍規律。</p></div>
     <section className="course-quiz"><span className="eyebrow">課後自我檢測 · 1 題</span><h2>{question.prompt}</h2><div className="course-answer-grid">{question.choices.map((opt,i)=><button key={i} className={`course-answer ${choice===i?'selected':''}`} onClick={()=>{setChoice(i);setFeedback('')}}><span>{i+1}</span>{opt}</button>)}</div>
       <button className="primary-button" disabled={choice===null} onClick={check}>提交答案</button>
       {feedback&&<div className="course-feedback" role="status"><strong>{feedback}</strong><p>正確答案：{question.answerIndex+1}. {question.choices[question.answerIndex]}</p><p>{question.explanation}</p></div>}
       {progress&&<p className="muted small">累計作答 {progress.attempts} 次，答對 {progress.correctCount} 次。{progress.quizPassed?'已通過本課自測。':'尚未通過自測。'}</p>}
     </section>
     {error&&<p className="form-message" role="alert">{error}</p>}
     <div className="course-lesson-footer"><button className="ghost-button bordered" onClick={markRead}>{progress?.readCompleted?'✓ 已讀（點擊取消）':'□ 標記已閱讀'}</button><span className="muted small">{completed?'✓ 本課完成':'閱讀與自測都完成後才計入進度'}</span></div>
     <nav className="course-lesson-navigation">{previous?<button className="ghost-button bordered" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses/${previous.id}`)}>← 上一課</button>:<span/>}{next?<button className="primary-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses/${next.id}`)}>下一課 →</button>:<button className="primary-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}/courses`)}>完成本級課程列表 →</button>}</nav>
   </article></div></main>
}
