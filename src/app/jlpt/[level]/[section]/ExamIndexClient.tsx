'use client'
import {useRouter} from 'next/navigation'
import {N2_2018_07_READING} from '@/lib/reading-exams'
import {recordKey,useLocalStudy} from '@/lib/local-store'
import language from '@/data/n2-2018-07-language.json'
export default function ExamIndexClient(){
 const router=useRouter(),state=useLocalStudy()
 const questions=[...language.questions,...N2_2018_07_READING.questions]
 const completed=questions.filter(q=>state.readingAnswers[recordKey('N2','reading',q.id)]).length
 const readingCount=N2_2018_07_READING.questions.filter(q=>state.readingAnswers[recordKey('N2','reading',q.id)]).length
 return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt/n2')}>←</button><div><p className="eyebrow">N2 / 2018 年 7 月</p><h1>歷年試題與模擬練習</h1><p className="muted small">無 API · 作答進度自動保存在本機</p></div></div></header>
 <section className="study-container"><div className="reading-overview"><div><h2>2018 年 7 月 · N2 言語知識＋読解</h2><p>已收錄書面題號 1～75：文字・語彙 32 題、文法 22 題、讀解 21 題。來源是你上傳的掃描考卷，題文與解答可以逐頁核對。</p><p className="reading-source-alert">注意：這是 75 題書面題組，不是包含聽解的完整一回測驗。聽解只有原卷逐字稿與參考答案，沒有可用音檔；中文詳解仍待專業審校。</p></div><div className="reading-stats"><div><strong>{completed}<small> / 75</small></strong><span>累積進度</span></div></div></div>
 <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">N2 · 2018/07 · 全部書面考題</span><h2>文字・語彙＋文法＋読解</h2><p>75 題 · 問題 1～14 · 日文原卷圖片 · 逐題判分與繁中解析草稿</p><p className="muted small">已作答 {completed}/75 題</p></div><button className="primary-button" onClick={()=>router.push('/jlpt/n2/mock/2018-07')}>開始／繼續完整書面題組 →</button></article>
 <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">讀解專項</span><h2>読解：問題 10～14</h2><p>原有讀解 21 題、11 組文章索引及原卷頁面，學習紀錄與上面的書面題組共用</p><p className="muted small">已作答 {readingCount}/21 題</p></div><button className="ghost-button bordered" onClick={()=>router.push('/jlpt/n2/reading')}>只練讀解 →</button></article>
 <article className="content-card reading-exam-index-card"><div><span className="reading-eyebrow">聽解參考資料（未計分）</span><h2>聴解：逐字稿與參考答案</h2><p>原檔附逐字稿、答題用紙與參考答案，但未附音檔，僅提供文件閱讀。</p></div><button className="ghost-button bordered" onClick={()=>router.push('/jlpt/n2/mock/2018-07/listening')}>查看聽解文字資料 →</button></article>
 </section></main>
}
