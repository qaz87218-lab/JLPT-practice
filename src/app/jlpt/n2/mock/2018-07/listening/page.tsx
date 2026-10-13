'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
export default function ListeningReference(){
 const [page,setPage]=useState(14),router=useRouter()
 const path=(n:number)=>`/reading/n2-2018-07/listening/page${String(n).padStart(2,'0')}.jpg`
 return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push('/jlpt/n2/mock')}>←</button><div><p className="eyebrow">N2 / 2018 年 7 月 / 聴解</p><h1>聽力逐字稿與答案（參考用）</h1></div></div></header><section className="study-container reading-container"><div className="reading-overview"><div><h2>原卷 PDF 第 14～23、35 頁</h2><p>這份來源檔包含聽解題目、逐字稿與參考答案，未提供真正可播放的音訊。此頁不能當成正式聽力測驗，故不列入 75 題成績。</p></div></div>
 <div className="reading-toolbar"><div className="filter-pills">{Array.from({length:10},(_,i)=>14+i).concat(35).map(p=><button key={p} className={`filter-pill ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p===35?'答案':`第${p}頁`}</button>)}</div></div>
 <section className="reading-passage-card"><h2>原檔 PDF 第 {page} 頁</h2><a className="reading-image-link" href={path(page)} target="_blank" rel="noreferrer"><img src={path(page)} alt={`2018年7月N2聽解資料原卷第${page}頁`}/></a><a className="reading-open-original" href={path(page)} target="_blank" rel="noreferrer">開啟原尺寸 ↗</a></section>
 </section></main>
}
