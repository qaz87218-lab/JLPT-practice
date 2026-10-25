'use client'

import {useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import archive from '@/data/n2-archive-exams.json'
import {recordKey,recordLocalReadingAnswer,setLocalNote,toggleLocalBookmark,useLocalStudy} from '@/lib/local-store'

export type ScanExamId='2017-12'|'2018-12'
type Filter='all'|'unanswered'|'wrong'|'bookmarked'
const marks=['①','②','③','④']
const pageUrl=(examId:ScanExamId,n:number)=>`/reading/n2-${examId}/page${String(n).padStart(2,'0')}.jpg`
const sourceTitles:{[K in ScanExamId]:string}={'2017-12':'2017 年 12 月','2018-12':'2018 年 12 月'}

export default function ScanExamPracticeClient({examId}:{examId:ScanExamId}){
 const router=useRouter(),state=useLocalStudy()
 const exam=archive.exams.find(item=>item.exam_id===`N2_${examId.replace('-','_')}`)
 if(!exam)throw new Error(`Unknown archive exam: ${examId}`)
 const questions=exam.questions,total=questions.length
 const [active,setActive]=useState(1),[filter,setFilter]=useState<Filter>('all')
 const [draft,setDraft]=useState<Record<string,number>>({}),[redo,setRedo]=useState<Record<string,boolean>>({})
 const [selectedPage,setSelectedPage]=useState<number|null>(null)
 const [notesOpen,setNotesOpen]=useState(false),[notesDraft,setNotesDraft]=useState(''),[error,setError]=useState('')
 const q=questions[active-1]??questions[0]
 const key=recordKey('N2','reading',q.id)
 const prev=state.readingAnswers[key]
 const answered=Boolean(prev&&!redo[q.id])
 const answerChoice=answered?prev?.choiceIndex:draft[q.id]
 const sourcePage=selectedPage!==null&&q.source_pdf_pages.includes(selectedPage)?selectedPage:q.source_pdf_pages[0]
 const completed=questions.filter(item=>Boolean(state.readingAnswers[recordKey('N2','reading',item.id)]))
 const correct=completed.filter(item=>state.readingAnswers[recordKey('N2','reading',item.id)]?.correct).length
 const visible=useMemo(()=>questions.filter(item=>{
  const k=recordKey('N2','reading',item.id),saved=state.readingAnswers[k]
  return filter==='unanswered'?!saved:filter==='wrong'?Boolean(saved&&!saved.correct):filter==='bookmarked'?Boolean(state.bookmarks[k]):true
 }),[questions,state.readingAnswers,state.bookmarks,filter])
 useEffect(()=>{setSelectedPage(null);setNotesOpen(false);setNotesDraft(state.notes[recordKey('N2','reading',q.id)]??'')},[q.id,state.notes])
 function move(n:number){setActive(Math.min(total,Math.max(1,n)));setSelectedPage(null);setError('')}
 function submit(){const choice=draft[q.id];if(choice===undefined||answered)return
  try{recordLocalReadingAnswer('N2',q.id,choice,q.answer_index);setRedo(old=>({...old,[q.id]:false}));setError('')}
  catch(err){setError(err instanceof Error?err.message:'答案儲存失敗')}
 }
 function run(action:()=>void){try{action();setError('')}catch(err){setError(err instanceof Error?err.message:'本機儲存失敗')}}
 const partNums=Array.from({length:14},(_,i)=>`問題${i+1}`)
 return <main className="app-shell">
  <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt/n2/mock')}>←</button><div>
   <p className="eyebrow">JLPT N2 / {sourceTitles[examId]} / 掃描原卷練習</p>
   <h1>{sourceTitles[examId]} N2</h1><p className="muted small">書面試題 {total} 題 · 無 API · 逐題作答判分</p>
  </div></div><span className="content-count">{completed.length} / {total}</span></header>
  <section className="study-container reading-container">
   <div className="reading-overview"><div><h2>言語知識・読解 · {total} 題</h2>
    <p>本回使用原卷掃描呈現完整題目與選項。選擇下方 ①～④ 作答，提交後依 PDF 所附答案判分；也可跳題、收藏、重做和寫筆記。</p>
    <p className="reading-source-alert">重要：本題組尚未逐題完成日文文字轉錄與獨立繁中詳解。提交後可查看 PDF 原有的參考解析掃描頁。來源為使用者提供的第三方整理卷，未確認為官方公開試題。聽解無音檔，不納入書面分數。</p>
   </div><div className="reading-stats"><div><strong>{completed.length}<small> / {total}</small></strong><span>已作答</span></div><div><strong>{completed.length?Math.round(100*correct/completed.length):0}%</strong><span>正確率</span></div><div><strong>{completed.length-correct}</strong><span>答錯</span></div></div></div>
   <div className="reading-toolbar"><div className="filter-pills" role="group" aria-label="試題篩選">
    {([['all',`全部${total}題`],['unanswered','未作答'],['wrong','錯題'],['bookmarked','收藏']] as const).map(([value,name])=><button type="button" key={value} className={`filter-pill ${filter===value?'active':''}`} onClick={()=>setFilter(value)}>{name}</button>)}
   </div><div className="reading-progress-bar"><span style={{width:`${100*completed.length/total}%`}}/></div></div>
   <div className="reading-workspace"><aside className="reading-sidebar"><div className="reading-sidebar-head"><strong>試題導覽</strong><span>{visible.length} 題</span></div>
    {partNums.map(part=>{const items=visible.filter(item=>item.test_part===part);return items.length?<div key={part} className="reading-part-group"><h3>{part}　{items[0].section}</h3><div className="reading-number-grid">
     {items.map(item=>{const saved=state.readingAnswers[recordKey('N2','reading',item.id)];return <button type="button" key={item.id} aria-current={item.number===active?'true':undefined} title={saved?.correct?'上次答對':saved?'上次答錯':'尚未作答'} className={`reading-q-number ${item.number===active?'active':''} ${saved?.correct?'correct':saved?'wrong':''}`} onClick={()=>move(item.number)}>{item.number}</button>})}
    </div></div>:null})}
    {!visible.length&&<p className="muted small">目前沒有符合篩選的題目。</p>}
    <div className="reading-sidebar-note"><b>題目來源</b><p>{exam.source_name}</p><p>掃描考卷內含原始解答及解說；目前不提供獨立文字版試題。</p></div>
   </aside><div className="reading-main">
    <section className="reading-passage-card"><div className="reading-section-heading"><div><span className="reading-eyebrow">{q.test_part} · 第 {q.number} 題</span><h2>{q.section}｜請看原卷題目</h2></div><span className="content-count">PDF 第 {sourcePage} 頁</span></div>
     <p className="muted small">完整日文題幹和四個選項都在下方掃描圖內。可開新分頁放大；若跨頁，請切換原卷頁面。</p>
     {q.source_pdf_pages.length>1&&<div className="filter-pills">{q.source_pdf_pages.map(n=><button type="button" key={n} className={`filter-pill ${sourcePage===n?'active':''}`} onClick={()=>setSelectedPage(n)}>第 {n} 頁</button>)}</div>}
     <a className="reading-image-link" href={pageUrl(examId,sourcePage)} target="_blank" rel="noreferrer"><img src={pageUrl(examId,sourcePage)} alt={`${sourceTitles[examId]} N2 原卷第 ${sourcePage} 頁`} loading="lazy"/></a>
     <a className="reading-open-original" href={pageUrl(examId,sourcePage)} target="_blank" rel="noreferrer">開啟原卷圖片並放大 ↗</a>
    </section>
    <section className="reading-question-card"><div className="reading-section-heading"><div><span className="reading-eyebrow">QUESTION {q.number} / {total}</span><h2>根據上方原卷選出正確答案</h2></div><span className={`reading-result-indicator ${answered?(prev?.correct?'correct':'wrong'):''}`}>{answered?(prev?.correct?'✓ 上次答對':'✕ 上次答錯'):'尚未提交'}</span></div>
     <fieldset className="reading-choice-list" disabled={answered}><legend className="small muted">四選一 · 題目與選項文字請對照原卷圖</legend>{marks.map((mark,i)=><label key={i} className={`reading-choice ${answerChoice===i?'chosen':''} ${answered&&i===q.answer_index-1?'answer-correct':''} ${answered&&i===answerChoice&&!prev?.correct?'answer-wrong':''}`}><input type="radio" name={`scanexam-${q.id}`} checked={answerChoice===i} disabled={answered} onChange={()=>setDraft(d=>({...d,[q.id]:i}))}/><span className="reading-choice-label">{mark}</span><span>選項 {i+1}（以原卷圖中選項內容為準）</span></label>)}</fieldset>
     {error&&<p className="form-message" role="alert">{error}</p>}
     <div className="reading-answer-actions">{answered?<button className="ghost-button bordered" onClick={()=>{setRedo(r=>({...r,[q.id]:true}));setDraft(d=>{const out={...d};delete out[q.id];return out})}}>重新練習本題</button>:<button className="primary-button" disabled={answerChoice===undefined} onClick={submit}>提交並判分</button>}
      <button className="ghost-button bordered" onClick={()=>run(()=>toggleLocalBookmark('N2','reading',q.id))}>{state.bookmarks[key]?'★ 取消收藏':'☆ 收藏'}</button>
      <button className="ghost-button bordered" onClick={()=>setNotesOpen(v=>!v)}>{state.notes[key]?'編輯筆記':'新增筆記'}</button></div>
     {notesOpen&&<div className="note-editor"><label htmlFor="scan-exam-note">個人筆記（本機儲存）</label><textarea id="scan-exam-note" value={notesDraft} rows={3} maxLength={20000} onChange={e=>setNotesDraft(e.target.value)}/><button className="primary-button" onClick={()=>run(()=>{setLocalNote('N2','reading',q.id,notesDraft);setNotesOpen(false)})}>儲存筆記</button></div>}
     {answered&&<div className="reading-explanation"><div className="reading-explanation-head"><strong>{prev?.correct?'答對了':'這題答錯了'}</strong><span>正解 {marks[q.answer_index-1]}</span></div>
       <h3>原始來源解析</h3><p>下方是 PDF 所附解說的掃描圖，並非本 App 自行編寫的逐選項解析。答案來源：PDF 第 {q.answer_pdf_page} 頁。</p>
       {examId==='2018-12'?<><a className="reading-image-link" href={pageUrl(examId,q.explanation_pdf_page)} target="_blank" rel="noreferrer"><img src={pageUrl(examId,q.explanation_pdf_page)} alt={`2018 年 12 月 N2 參考解析第 ${q.explanation_pdf_page} 頁`} loading="lazy"/></a><p className="muted small">本題的中文參考解析位於上方頁面，請按題號 {q.number} 尋找。</p></>:<><p className="muted small">2017 年整理卷的中文詳解分布於 PDF 第 22～29 頁。下方已定位到本題的解析頁；必要時可切換相鄰頁核對。</p><a className="reading-image-link" href={pageUrl(examId,q.explanation_pdf_page)} target="_blank" rel="noreferrer"><img src={pageUrl(examId,q.explanation_pdf_page)} alt={`2017 年 12 月 N2 參考解析第 ${q.explanation_pdf_page} 頁`} loading="lazy"/></a><details className="reading-notes"><summary>切換原整理者解析頁</summary><div className="filter-pills">{Array.from({length:8},(_,i)=>i+22).map(n=><a className="filter-pill" key={n} href={pageUrl(examId,n)} target="_blank" rel="noreferrer">第 {n} 頁 ↗</a>)}</div></details></>}
     </div>}
     <details className="reading-notes"><summary>聽解參考資料（無音檔；不計分）</summary><p>本次上傳的 PDF 有聽解題目、逐字稿、解答，沒有聲音檔，僅供閱讀。</p><div className="filter-pills">{(examId==='2018-12'?[16,17,18,32,33,34,35,36]:[14,15,16,17,18,19,20,21]).map(n=><a key={n} className="filter-pill" href={pageUrl(examId,n)} target="_blank" rel="noreferrer">PDF 第 {n} 頁 ↗</a>)}</div></details>
     <div className="reading-next-prev"><button className="ghost-button bordered" disabled={active===1} onClick={()=>move(active-1)}>← 上一題</button><button className="primary-button" disabled={active===total} onClick={()=>move(active+1)}>下一題 →</button></div>
    </section>
   </div></div>
  </section>
 </main>
}
