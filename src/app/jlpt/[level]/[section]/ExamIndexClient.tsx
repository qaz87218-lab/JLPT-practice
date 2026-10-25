'use client'
import {useRouter} from 'next/navigation'
import {N2_2018_07_READING} from '@/lib/reading-exams'
import {recordKey,useLocalStudy} from '@/lib/local-store'
import language from '@/data/n2-2018-07-language.json'
import archived from '@/data/n2-archive-exams.json'

export default function ExamIndexClient(){
 const router=useRouter(),state=useLocalStudy()
 const julyQuestions=[...language.questions,...N2_2018_07_READING.questions]
 const count=(ids:string[])=>ids.filter(id=>Boolean(state.readingAnswers[recordKey('N2','reading',id)])).length
 const julyDone=count(julyQuestions.map(q=>q.id))
 const readingDone=count(N2_2018_07_READING.questions.map(q=>q.id))
 const totalQuestions=julyQuestions.length+archived.exams.reduce((sum,e)=>sum+e.questions.length,0)
 const done=julyDone+archived.exams.reduce((sum,e)=>sum+count(e.questions.map(q=>q.id)),0)
 return <main className="app-shell">
  <header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt/n2')}>←</button><div><p className="eyebrow">N2 / 歷年試題</p><h1>歷年試題與模擬練習</h1><p className="muted small">全部使用本機儲存，無 API</p></div></div><span className="content-count">{done} / {totalQuestions}</span></header>
  <section className="study-container"><div className="reading-overview"><div><h2>歷年書面試題 · 3 回</h2><p>目前有 2017 年 12 月、2018 年 7 月和 2018 年 12 月共 {totalQuestions} 道言語知識與讀解題。可逐題作答、立即判分、記錄錯題、收藏並寫筆記。</p><p className="reading-source-alert">2018/07 為文字化的 75 題題庫；2017/12 和 2018/12 為原卷掃描圖＋電子作答與答案判分，尚未逐題完成文字轉錄及獨立解析。三回都未附可使用的聽力音檔；聽解資料僅供閱讀。</p></div><div className="reading-stats"><div><strong>{done}<small> / {totalQuestions}</small></strong><span>書面題進度</span></div></div></div>
   <div className="content-list">
    <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">2018 年 7 月 · 文字化題庫</span><h2>言語知識＋読解</h2><p>75 題 · 文字語彙 32 題＋文法 22 題＋讀解 21 題 · 數位題文、逐題判分、繁中解析草稿</p><p className="muted small">已作答 {julyDone}/75</p></div><button className="primary-button" onClick={()=>router.push('/jlpt/n2/mock/2018-07')}>開始／繼續 →</button></article>
    {archived.exams.map(exam=>{const id=`${exam.year}-${String(exam.month).padStart(2,'0')}`;const finished=count(exam.questions.map(q=>q.id));return <article className="content-card reading-exam-index-card" key={exam.exam_id}><div><span className="reading-eyebrow">{exam.title} · 掃描原卷作答版</span><h2>言語知識＋読解</h2><p>{exam.questions.length} 題 · 原卷掃描圖 · 四選一作答 · 來源答案判分 · 原 PDF 解析掃描頁</p><p className="muted small">已作答 {finished}/{exam.questions.length} · 尚無完整文字化題幹或逐選項中文解析</p></div><button className="primary-button" onClick={()=>router.push(`/jlpt/n2/mock/${id}`)}>開始／繼續 →</button></article>})}
    <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">2018 年 7 月 · 專項練習</span><h2>読解：問題 10～14</h2><p>既有讀解 21 題、原卷頁面與繁體中文解說；與該回完整書面題組共用作答紀錄</p><p className="muted small">已作答 {readingDone}/21</p></div><button className="ghost-button bordered" onClick={()=>router.push('/jlpt/n2/reading')}>只練讀解 →</button></article>
    <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">聽解 · 參考資料</span><h2>逐字稿及答案</h2><p>無音檔，僅供閱讀；2017/12、2018/12 各回考卷頁面亦提供聽解資料連結。</p></div><button className="ghost-button bordered" onClick={()=>router.push('/jlpt/n2/mock/2018-07/listening')}>查看 2018/07 聽解資料 →</button></article>
   </div>
  </section>
 </main>
}
