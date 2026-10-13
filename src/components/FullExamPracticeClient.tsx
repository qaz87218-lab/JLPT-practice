'use client'

import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import source from '@/data/n2-2018-07-language.json'
import {N2_2018_07_READING,readingAssetPath} from '@/lib/reading-exams'
import {recordKey,recordLocalReadingAnswer,setLocalNote,toggleLocalBookmark,useLocalStudy} from '@/lib/local-store'

type Question={
 id:string;number:number;test_part:string;section:string;source_pdf_page:number;
 question_jp:string;question_zh:string;options_jp:string[];answer_index:number;
 explanation_zh:string;choices_explanation_zh:string[];kind:'language'|'reading';
 passage_id?:string; evidence_jp?:string; reading_skill?:string; correct_order?:number[]
}
const questions:Question[]=[
 ...source.questions.map((q):Question=>({...q,kind:'language', correct_order:'correct_order' in q?(q.correct_order as number[]):undefined})),
 ...N2_2018_07_READING.questions.map((q):Question=>({...q,kind:'reading',section:'読解'})),
].sort((a,b)=>a.number-b.number)
const grouped=Array.from({length:14},(_,i)=>`問題${i+1}`)
const marks=['①','②','③','④']
const pdfPage=(n:number)=>`/reading/n2-2018-07/page${String(n).padStart(2,'0')}.jpg`
type Mode='all'|'unanswered'|'wrong'|'bookmarked'

export default function FullExamPracticeClient(){
 const router=useRouter(),state=useLocalStudy()
 const [active,setActive]=useState(1),[filter,setFilter]=useState<Mode>('all')
 const [draft,setDraft]=useState<Record<string,number>>({}),[redo,setRedo]=useState<Record<string,boolean>>({})
 const [imagePage,setImagePage]=useState<number|null>(null),[showSource,setShowSource]=useState(false)
 const [showNotes,setShowNotes]=useState(false),[note,setNote]=useState(''),[error,setError]=useState('')
 const q=questions[active-1]??questions[0]
 const passage=N2_2018_07_READING.passages.find(p=>p.id===q.passage_id)
 const pages=q.kind==='reading'?(passage?.pages??[q.source_pdf_page]):[q.source_pdf_page]
 const page=imagePage!==null&&pages.includes(imagePage)?imagePage:pages[0]
 const key=recordKey('N2','reading',q.id)
 const previous=state.readingAnswers[key],isAnswered=Boolean(previous&&!redo[q.id])
 const selected=isAnswered?previous?.choiceIndex:draft[q.id]
 const bookmarked=Boolean(state.bookmarks[key])
 useEffect(()=>{setImagePage(null);setShowSource(false);setShowNotes(false);setNote(state.notes[recordKey('N2','reading',q.id)]??'')},[q.id,state.notes])
 const completed=questions.filter(item=>Boolean(state.readingAnswers[recordKey('N2','reading',item.id)]))
 const correct=completed.filter(item=>state.readingAnswers[recordKey('N2','reading',item.id)]?.correct).length
 const visible=useMemo(()=>questions.filter(item=>{
  const k=recordKey('N2','reading',item.id),saved=state.readingAnswers[k]
  if(filter==='unanswered')return !saved
  if(filter==='wrong')return Boolean(saved&&!saved.correct)
  if(filter==='bookmarked')return Boolean(state.bookmarks[k])
  return true
 }),[state.readingAnswers,state.bookmarks,filter])
 function move(n:number){setActive(Math.min(75,Math.max(1,n)));setError('')}
 function submit(){
  const choice=draft[q.id];if(choice===undefined||isAnswered)return
  try{recordLocalReadingAnswer('N2',q.id,choice,q.answer_index);setRedo(v=>({...v,[q.id]:false}));setError('')}
  catch(e){setError(e instanceof Error?e.message:'儲存答案失敗')}
 }
 function save(action:()=>void){try{action();setError('')}catch(e){setError(e instanceof Error?e.message:'本機儲存失敗')}}
 return <main className="app-shell">
  <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt/n2/mock')}>←</button><div>
   <p className="eyebrow">JLPT N2 / 2018 年 7 月 / 言語知識・読解</p>
   <h1>2018 年 7 月 N2 歷年試題</h1>
   <p className="muted small">題號 1～75：文字語彙 32 題＋文法 22 題＋讀解 21 題 · 不需要 API</p>
  </div></div><span className="content-count">{completed.length} / 75</span></header>
  <section className="study-container reading-container">
   <div className="reading-overview"><div><h2>言語知識＋読解 · 75 題</h2>
    <p>本題組保留原卷掃描、逐題選項及本機判分。可依問題 1～14 練習、跳題、收藏、記筆記、重做錯題。讀解 21 題沿用上一版資料，不會刪除舊紀錄。</p>
    <p className="reading-source-alert">來源為使用者提供的第三方整理掃描版，不等於已證實的官方公開試卷。正解依所附答案表第 34～35 頁核對。新增中文詳解屬待審校草稿，請以原卷頁圖為準。聽解需要音檔，暫未列入 75 題分數。</p>
   </div><div className="reading-stats"><div><strong>{completed.length}<small> / 75</small></strong><span>已作答</span></div><div><strong>{completed.length?Math.round(100*correct/completed.length):0}%</strong><span>正確率</span></div><div><strong>{completed.length-correct}</strong><span>上次答錯</span></div></div></div>
   <div className="reading-toolbar"><div className="filter-pills" role="group" aria-label="篩選題目">
    {([['all','全部75題'],['unanswered','未作答'],['wrong','錯題'],['bookmarked','收藏']] as const).map(([v,label])=><button key={v} className={`filter-pill ${filter===v?'active':''}`} onClick={()=>setFilter(v)}>{label}</button>)}
   </div><div className="reading-progress-bar"><span style={{width:`${100*completed.length/75}%`}}/></div></div>
   <div className="reading-workspace"><aside className="reading-sidebar"><div className="reading-sidebar-head"><strong>試題導覽</strong><span>{visible.length} 題</span></div>
    {grouped.map(group=>{const list=visible.filter(item=>item.test_part===group);if(!list.length)return null;return <div className="reading-part-group" key={group}><h3>{group}　{list[0].section}</h3><div className="reading-number-grid">
     {list.map(item=>{const saved=state.readingAnswers[recordKey('N2','reading',item.id)];return <button key={item.id} type="button" title={saved?.correct?'上次答對':saved?'上次答錯':'尚未作答'} aria-current={item.number===active?'true':undefined} className={`reading-q-number ${item.number===active?'active':''} ${saved?.correct?'correct':saved?'wrong':''}`} onClick={()=>move(item.number)}>{item.number}</button>})}
    </div></div>})}
    {visible.length===0&&<p className="muted small">本篩選沒有題目，請切回「全部75題」。</p>}
    <div className="reading-sidebar-note"><b>考試範圍說明</b><p>本次涵蓋言語知識與讀解，不包含缺少音檔的聽解正式作答。原卷聽解文字與答案可以從題庫首頁查閱。</p></div>
   </aside><div className="reading-main">
    <section className="reading-passage-card"><div className="reading-section-heading"><div><span className="reading-eyebrow">{q.test_part} · 第 {q.number} 題</span><h2>{q.kind==='reading'?(passage?.title??'読解文章'):q.number>=50?'道のひみつ':q.section}</h2></div><span className="content-count">原卷 PDF 第 {page} 頁</span></div>
     <p className="muted small">電子題文如有排版或文字差異，以掃描原卷為準。可點圖放大核對原文、文章及選項。</p>
     {pages.length>1&&<div className="filter-pills">{pages.map(p=><button type="button" key={p} className={`filter-pill ${p===page?'active':''}`} onClick={()=>setImagePage(p)}>第 {p} 頁</button>)}</div>}
     <a className="reading-image-link" href={pdfPage(page)} target="_blank" rel="noreferrer"><img src={pdfPage(page)} alt={`2018/07 N2 原卷第 ${page} 頁（點擊放大）`}/></a>
     <a className="reading-open-original" href={pdfPage(page)} target="_blank" rel="noreferrer">在新分頁放大原卷 ↗</a>
     {q.kind==='reading'&&passage&&<details className="reading-notes"><summary>文章摘要與詞彙輔助（可能提示答案）</summary><p>{passage.summary}</p><p><b>閱讀焦點：</b>{passage.focus}</p></details>}
     <details className="reading-notes"><summary>查看原卷答案與整理者解析（可能透露答案）</summary>
      <p>原卷答案表第 34～35 頁：</p><a href={pdfPage(q.number<=54?34:35)} target="_blank" rel="noreferrer">開啟原卷答案表 ↗</a>
      <p>整理者的原始解題參考列於 PDF 第 24～33 頁（本 App 保留掃描版）。</p>
      <button className="ghost-button bordered" onClick={()=>setShowSource(v=>!v)}>{showSource?'隱藏原始解析':'查看原始解析掃描頁'}</button>
      {showSource&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>{Array.from({length:10},(_,i)=>i+24).map(p=><a key={p} className="filter-pill" href={`/reading/n2-2018-07/reference/explanation-${p}.jpg`} target="_blank" rel="noreferrer">原解析第 {p} 頁 ↗</a>)}</div>}
     </details>
    </section>
    <section className="reading-question-card"><div className="reading-section-heading"><div><span className="reading-eyebrow">QUESTION {q.number} / 75</span><h2>{q.question_jp}</h2></div><span className={`reading-result-indicator ${isAnswered?(previous?.correct?'correct':'wrong'):''}`}>{isAnswered?(previous?.correct?'✓ 上次答對':'✕ 上次答錯'):'尚未提交'}</span></div>
     {!!q.question_zh&&<p className="reading-question-zh">{q.question_zh}</p>}
     {!!q.correct_order&&<p className="muted small">★排序題：請將四個片段按正確順序排列，再選擇 ★ 所在位置對應的選項（不是選整句）。</p>}
     <fieldset className="reading-choice-list" disabled={isAnswered}><legend className="small muted">四選一（提交後顯示答案與解析）</legend>{q.options_jp.map((choice,i)=><label key={i} className={`reading-choice ${selected===i?'chosen':''} ${isAnswered&&i===q.answer_index-1?'answer-correct':''} ${isAnswered&&i===selected&&!previous?.correct?'answer-wrong':''}`}><input type="radio" name={`exam-${q.id}`} checked={selected===i} disabled={isAnswered} onChange={()=>setDraft(v=>({...v,[q.id]:i}))}/><span className="reading-choice-label">{marks[i]}</span><span>{choice}</span></label>)}</fieldset>
     {error&&<p className="form-message" role="alert">{error}</p>}
     <div className="reading-answer-actions">{isAnswered?<button className="ghost-button bordered" onClick={()=>{setRedo(v=>({...v,[q.id]:true}));setDraft(v=>{const next={...v};delete next[q.id];return next})}}>重新練習本題</button>:<button className="primary-button" disabled={selected===undefined} onClick={submit}>提交本題並判分</button>}
      <button className="ghost-button bordered" onClick={()=>save(()=>toggleLocalBookmark('N2','reading',q.id))}>{bookmarked?'★ 取消收藏':'☆ 收藏'}</button>
      <button className="ghost-button bordered" onClick={()=>setShowNotes(v=>!v)}>{state.notes[key]?'編輯筆記':'新增筆記'}</button></div>
     {showNotes&&<div className="note-editor"><label htmlFor="full-exam-note">個人筆記（瀏覽器本機儲存）</label><textarea id="full-exam-note" rows={3} maxLength={20000} value={note} onChange={(e:{target:{value:string}})=>setNote(e.target.value)}/><button className="primary-button" onClick={()=>save(()=>{setLocalNote('N2','reading',q.id,note);setShowNotes(false)})}>儲存筆記</button></div>}
     {isAnswered&&<div className="reading-explanation"><div className="reading-explanation-head"><strong>{previous?.correct?'答對了':'這題答錯了'}</strong><span>正解 {marks[q.answer_index-1]}</span></div><h3>正解理由</h3><p>{q.explanation_zh}</p>
      {q.correct_order&&<p><b>完整片段順序：</b>{q.correct_order.map(idx=>`${marks[idx-1]}${q.options_jp[idx-1]}`).join(' → ')}</p>}
      {q.evidence_jp&&<><h3>原文依據</h3><blockquote lang="ja">{q.evidence_jp}</blockquote></>}
      <h3>四選項辨析</h3><ol>{q.choices_explanation_zh.map((exp,i)=><li key={i}><b>{marks[i]}</b> {exp}</li>)}</ol>
      {q.reading_skill&&<p><b>閱讀技巧：</b>{q.reading_skill}</p>}
      <p className="muted small">答案表核對：PDF 第 {q.number<=54?34:35} 頁。解析是助理依提供材料另行編寫，尚待人工語言審校。</p>
     </div>}
     <div className="reading-next-prev"><button className="ghost-button bordered" disabled={active===1} onClick={()=>move(active-1)}>← 上一題</button><button className="primary-button" disabled={active===75} onClick={()=>move(active+1)}>下一題 →</button></div>
    </section>
   </div></div>
  </section>
 </main>
}
