'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { N2_2018_07_READING, readingAssetPath } from '@/lib/reading-exams'
import { recordKey, recordLocalReadingAnswer, setLocalNote, toggleLocalBookmark, useLocalStudy } from '@/lib/local-store'

const exam = N2_2018_07_READING
const parts = ['問題10', '問題11', '問題12', '問題13', '問題14']
type Filter = 'all' | 'unanswered' | 'wrong' | 'bookmarked'
const letter = (index: number) => ['①', '②', '③', '④'][index] || `${index + 1}`

export default function ReadingPracticeClient() {
  const router = useRouter()
  const study = useLocalStudy()
  const [activeId, setActiveId] = useState(exam.questions[0].id)
  const [filter, setFilter] = useState<Filter>('all')
  const [draftChoices, setDraftChoices] = useState<Record<string, number>>({})
  const [retries, setRetries] = useState<Record<string, boolean>>({})
  const [imageOverride, setImageOverride] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const [error, setError] = useState('')

  const q = exam.questions.find(item => item.id === activeId) ?? exam.questions[0]
  const passage = exam.passages.find(item => item.id === q.passage_id)
  const key = recordKey('N2', 'reading', q.id)
  const previous = study.readingAnswers[key]
  const isRetry = Boolean(retries[q.id])
  const isAnswered = Boolean(previous && !isRetry)
  const selected = isAnswered ? previous?.choiceIndex : draftChoices[q.id]
  const bookmarked = Boolean(study.bookmarks[key])
  const page = imageOverride !== null && passage?.pages.includes(imageOverride) ? imageOverride : passage?.pages[0] ?? q.source_pdf_page

  useEffect(() => {
    setNotesOpen(false)
    setImageOverride(null)
    setNoteDraft(study.notes[recordKey('N2', 'reading', activeId)] ?? '')
    // Load a new question on navigation without erasing its saved note.
  }, [activeId, study.notes])

  const filtered = useMemo(() => exam.questions.filter(item => {
    const itemKey = recordKey('N2', 'reading', item.id)
    if (filter === 'unanswered') return !study.readingAnswers[itemKey]
    if (filter === 'wrong') return study.readingAnswers[itemKey]?.correct === false
    if (filter === 'bookmarked') return Boolean(study.bookmarks[itemKey])
    return true
  }), [filter, study.readingAnswers, study.bookmarks])
  const answered = exam.questions.filter(item => Boolean(study.readingAnswers[recordKey('N2', 'reading', item.id)]))
  const correct = answered.filter(item => study.readingAnswers[recordKey('N2', 'reading', item.id)]?.correct).length
  const incorrect = answered.length - correct
  const accuracy = answered.length ? Math.round(correct / answered.length * 100) : 0
  const currentIndex = exam.questions.findIndex(item => item.id === q.id)

  function navigate(id: string) { setActiveId(id); setError('') }
  function choose(index: number) {
    if (isAnswered) return
    setDraftChoices(old => ({ ...old, [q.id]: index }))
  }
  function submit() {
    if (selected === undefined || isAnswered) return
    try {
      recordLocalReadingAnswer('N2', q.id, selected, q.answer_index)
      setRetries(old => ({ ...old, [q.id]: false }))
      setError('')
    } catch (err) { setError(err instanceof Error ? err.message : '無法儲存作答') }
  }
  function retry() {
    setRetries(old => ({ ...old, [q.id]: true }))
    setDraftChoices(old => { const next = { ...old }; delete next[q.id]; return next })
  }
  function run(action: () => void) { try { action(); setError('') } catch (err) { setError(err instanceof Error ? err.message : '本機儲存失敗') } }

  return <main className="app-shell">
    <header className="topbar wide-topbar"><div className="breadcrumb-title">
      <button className="back-button" onClick={() => router.push('/jlpt/n2')} aria-label="回 N2 學習區">←</button>
      <div><p className="eyebrow">N2 / 読解 / 2018 年 7 月</p><h1>歷年讀解練習</h1><p className="muted small">21 題 · 原卷頁圖與繁體中文詳解 · 本機作答</p></div>
    </div><span className="content-count">{answered.length} / {exam.questions.length} 已完成</span></header>

    <section className="study-container reading-container">
      <div className="reading-overview">
        <div><h2>2018 年 7 月 JLPT N2 · 読解</h2>
          <p>涵蓋問題 10～14，題號 55～75。保留掃描原卷頁面，點選選項後才判分；答錯可重答，作答結果存在本機。</p>
          <p className="reading-source-alert">來源：使用者提供的第三方整理試卷，尚未驗證為官方公開版本。答案已與原檔答案表對照；中文詳解為編寫草稿，尚未經日語教師逐題審校。原卷若與電子轉錄有差異，請以頁圖為準。</p>
        </div>
        <div className="reading-stats" aria-label="答題統計">
          <div><strong>{answered.length}<small> / 21</small></strong><span>已作答</span></div>
          <div><strong>{accuracy}%</strong><span>目前正確率</span></div>
          <div><strong>{incorrect}</strong><span>上次答錯</span></div>
        </div>
      </div>

      <div className="reading-toolbar">
        <div className="filter-pills" role="group" aria-label="篩選題目">
          {([['all','全部 21 題'],['unanswered','未作答'],['wrong','上次答錯'],['bookmarked','收藏']] as const).map(([value,label]) => <button key={value} type="button" className={`filter-pill ${filter===value?'active':''}`} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className="reading-progress-bar"><span style={{width:`${answered.length / exam.questions.length * 100}%`}}/></div>
      </div>

      <div className="reading-workspace">
        <aside className="reading-sidebar" aria-label="題目導覽">
          <div className="reading-sidebar-head"><strong>題目導覽</strong><span>{filtered.length} 題</span></div>
          {parts.map(part => {
            const list = filtered.filter(item => item.test_part === part)
            if (!list.length) return null
            return <div className="reading-part-group" key={part}><h3>{part}</h3><div className="reading-number-grid">
              {list.map(item => {
                const saved = study.readingAnswers[recordKey('N2','reading',item.id)]
                return <button type="button" key={item.id} title={saved ? saved.correct ? '上次答對' : '上次答錯' : '尚未作答'} aria-current={q.id===item.id?'true':undefined} className={`reading-q-number ${q.id===item.id?'active':''} ${saved?.correct?'correct':saved?'wrong':''}`} onClick={() => navigate(item.id)}>{item.number}</button>
              })}
            </div></div>
          })}
          {!filtered.length && <p className="muted small">目前沒有符合篩選的題目。可切回「全部 21 題」。</p>}
          <div className="reading-sidebar-note"><b>進度說明</b><p>答題後可返回查看詳解。本機備份將保留每題最新答案與累計答對／答錯次數。</p></div>
        </aside>

        <div className="reading-main">
          <section className="reading-passage-card">
            <div className="reading-section-heading"><div><span className="reading-eyebrow">{q.test_part} · {passage?.sub ?? ''}</span><h2>{passage?.title ?? '讀解文章'}</h2></div><span className="content-count">PDF 第 {page} 頁</span></div>
            <p className="muted small">完整文章保留於原卷掃描頁圖，沒有冒充已完成全文文字轉錄。</p>
            {passage && passage.pages.length > 1 && <div className="filter-pills" role="group" aria-label="閱讀文章所在頁面">{passage.pages.map(p => <button key={p} className={`filter-pill ${p===page?'active':''}`} type="button" onClick={() => setImageOverride(p)}>原卷第 {p} 頁</button>)}</div>}
            <a className="reading-image-link" href={readingAssetPath(page)} target="_blank" rel="noreferrer" title="在新分頁開啟原卷頁圖查看細節"><img alt={`${q.test_part} 原卷 PDF 第 ${page} 頁，可點開放大`} src={readingAssetPath(page)}/></a>
            <a className="reading-open-original" href={readingAssetPath(page)} target="_blank" rel="noreferrer">放大查看這頁原卷 ↗</a>
            <details className="reading-notes"><summary>閱讀輔助：文章摘要與關鍵詞（可能提示答案）</summary>
              <p>{passage?.summary}</p><p><b>閱讀焦點：</b>{passage?.focus}</p>
              <div className="reading-vocab-list">{passage?.vocab.map(([word,kana,zh])=><span key={word}><b>{word}</b>（{kana}） {zh}</span>)}</div>
            </details>
          </section>

          <section className="reading-question-card" aria-labelledby="reading-question-title">
            <div className="reading-section-heading"><div><span className="reading-eyebrow">QUESTION {q.number} / {exam.questions.length} 題中第 {currentIndex+1} 題</span><h2 id="reading-question-title">{q.question_jp}</h2></div><span className={`reading-result-indicator ${isAnswered?(previous?.correct?'correct':'wrong'):''}`}>{isAnswered ? previous?.correct?'✓ 上次答對':'✕ 上次答錯':'尚未提交'}</span></div>
            <p className="reading-question-zh">{q.question_zh}</p>
            <fieldset className="reading-choice-list" disabled={isAnswered}><legend className="small muted">選擇最合適的答案（僅一個正確選項）</legend>
              {q.options_jp.map((choice, idx) => <label key={idx} className={`reading-choice ${selected === idx?'chosen':''} ${isAnswered&&idx===q.answer_index-1?'answer-correct':''} ${isAnswered&&selected===idx&&!previous?.correct?'answer-wrong':''}`}>
                <input type="radio" name={`answer-${q.id}`} checked={selected===idx} onChange={()=>choose(idx)} disabled={isAnswered}/><span className="reading-choice-label">{letter(idx)}</span><span>{choice}</span>
              </label>)}
            </fieldset>
            {error && <p className="form-message" role="alert">{error}</p>}
            <div className="reading-answer-actions">
              {isAnswered ? <button className="ghost-button bordered" onClick={retry}>重新練習本題</button> : <button className="primary-button" disabled={selected===undefined} onClick={submit}>提交本題並判分</button>}
              <button className="ghost-button bordered" onClick={()=>run(()=>toggleLocalBookmark('N2','reading',q.id))}>{bookmarked?'★ 取消收藏':'☆ 收藏題目'}</button>
              <button className="ghost-button bordered" onClick={()=>{setNotesOpen(!notesOpen);setNoteDraft(study.notes[key]??'')}}>{study.notes[key]?'編輯筆記':'新增筆記'}</button>
            </div>
            {notesOpen && <div className="note-editor"><label htmlFor="reading-note">個人筆記（僅儲存於本機）</label><textarea id="reading-note" rows={3} maxLength={20000} value={noteDraft} onChange={e=>setNoteDraft(e.target.value)}/><div><button className="primary-button" onClick={()=>run(()=>{setLocalNote('N2','reading',q.id,noteDraft);setNotesOpen(false)})}>儲存筆記</button></div></div>}
            {!notesOpen && study.notes[key] && <p className="saved-note"><b>我的筆記：</b>{study.notes[key]}</p>}

            {isAnswered && <div className="reading-explanation">
              <div className="reading-explanation-head"><strong>{previous?.correct?'答對了':'這題答錯了'}</strong><span>正解 {letter(q.answer_index-1)}</span></div>
              <h3>答案依據</h3><blockquote lang="ja">{q.evidence_jp}</blockquote>
              <h3>繁體中文詳細解析</h3><p>{q.explanation_zh}</p>
              <h3>逐選項辨析</h3><ol>{q.choices_explanation_zh.map((desc,i)=><li key={i}><b>{letter(i)}</b> {desc}</li>)}</ol>
              <p><b>閱讀技巧：</b>{q.reading_skill}</p>
              {!!q.related_vocabulary.length && <p><b>關聯詞彙：</b>{q.related_vocabulary.join('、')}</p>}
              <p className="muted small">答案依據：上傳試卷的參考答案（PDF 第 {q.answer_key_pdf_page} 頁）。以上解析是獨立編寫、待專業審校，不代表原試卷出版者的解說。</p>
            </div>}
            {!isAnswered && <p className="muted small">為避免提前透露答案，詳解需完成本題提交後才顯示。亦可先閱讀左方的原卷頁圖。</p>}
            <div className="reading-next-prev"><button className="ghost-button bordered" disabled={currentIndex===0} onClick={()=>navigate(exam.questions[currentIndex-1].id)}>← 上一題</button><button className="primary-button" disabled={currentIndex===exam.questions.length-1} onClick={()=>navigate(exam.questions[currentIndex+1].id)}>下一題 →</button></div>
          </section>
        </div>
      </div>
    </section>
  </main>
}
