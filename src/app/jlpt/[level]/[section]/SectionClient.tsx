'use client'

import { useMemo,useState } from 'react'
import { useParams,useRouter } from 'next/navigation'
import { JLPT_DATA,JLPT_SECTION_META,isJlptLevel,isJlptSection } from '@/data/jlpt'
import { recordKey,setLocalNote,setLocalStatus,toggleLocalBookmark,useLocalStudy } from '@/lib/local-store'
import type { GrammarItem,JlptLevel,JlptSection } from '@/lib/types'
import VocabularyClient from './VocabularyClient'

type FilterMode='all'|'bookmarked'|'wrong'|'mastered'
function getItems(level:JlptLevel,section:JlptSection) {
 const data=JLPT_DATA[level];return section==='mock'?data.mockTests:data[section]
}
function GrammarCard({item,level,stateStatus,isBookmarked,note,onError}:{item:GrammarItem;level:JlptLevel;stateStatus:'new'|'learning'|'mastered';isBookmarked:boolean;note:string;onError:(msg:string)=>void}) {
 const [noteOpen,setNoteOpen]=useState(false),[draft,setDraft]=useState(note)
 function run(action:()=>void) {try {action()}catch(err){onError(err instanceof Error?err.message:'儲存失敗')}}
 return <article className="content-card"><details className="grammar-details"><summary><span className="grammar-title">{item.pattern}</span><span className="grammar-meta">{item.meaningZh}</span><span className="grammar-source">{item.sourceTitle ?? ''}{item.sourceBookPage?` ｜ 書頁 ${item.sourceBookPage}`:''}</span><span className="small muted">{stateStatus==='mastered'?'✓ 已掌握':stateStatus==='learning'?'• 學習中':isBookmarked?'★ 已收藏':''}</span></summary>
   <div className="grammar-body"><p><b>接續：</b>{item.connection??'尚待建置'}</p><p><b>詳細解說：</b>{item.explanation??'尚待建置'}</p>{item.nuance&&<p><b>語感：</b>{item.nuance}</p>}{item.usageCautions&&<p><b>注意：</b>{item.usageCautions}</p>}{item.similarGrammar&&<p><b>相似文法：</b>{item.similarGrammar}</p>}
     {(item.examples??[]).map((ex,index)=><div key={index} className="grammar-example"><div className="grammar-japanese">{index+1}. {ex.ja}</div>{ex.reading&&<div className="grammar-reading">{ex.reading}</div>}<div>{ex.zh}</div></div>)}
     {item.provenance&&<p className="grammar-provenance">{item.provenance}</p>}
     <div className="study-actions"><button className="ghost-button bordered" onClick={()=>run(()=>toggleLocalBookmark(level,'grammar',item.id))}>{isBookmarked?'★ 取消收藏':'☆ 收藏'}</button><button className="ghost-button bordered" onClick={()=>run(()=>setLocalStatus(level,'grammar',item.id,'learning'))}>學習中</button><button className="ghost-button bordered" onClick={()=>run(()=>setLocalStatus(level,'grammar',item.id,'mastered'))}>✓ 已掌握</button><button className="ghost-button bordered" onClick={()=>run(()=>setLocalStatus(level,'grammar',item.id,'new'))}>重置狀態</button><button className="ghost-button bordered" onClick={()=>{setNoteOpen(!noteOpen);setDraft(note)}}>{note?'編輯筆記':'新增筆記'}</button></div>
     {noteOpen&&<div className="note-editor"><label htmlFor={`note-${item.id}`}>我的筆記（只存本機）</label><textarea id={`note-${item.id}`} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={20000} rows={4}/><div><button className="primary-button" onClick={()=>run(()=>{setLocalNote(level,'grammar',item.id,draft);setNoteOpen(false)})}>儲存筆記</button></div></div>}
     {!noteOpen&&note&&<p className="saved-note"><b>我的筆記：</b>{note}</p>}
     <p className="muted small">「已掌握」為手動標記，並非通過測驗；本版尚未建立自動判分題庫。</p>
   </div>
 </details></article>
}
function OtherSectionClient() {
 const params=useParams<{level:string;section:string}>(),router=useRouter()
 const rawLevel=(params.level??'').toUpperCase(),level=isJlptLevel(rawLevel)?rawLevel:null
 const section=isJlptSection(params.section??'')?params.section as JlptSection:null
 const state=useLocalStudy(),[query,setQuery]=useState(''),[filter,setFilter]=useState<FilterMode>('all'),[error,setError]=useState('')
 const items=useMemo(()=>level&&section?getItems(level,section):[],[level,section])
 const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return items.filter(item=>{
      if(q&&!JSON.stringify(item).toLowerCase().includes(q))return false
      const key=level&&section?recordKey(level,section,item.id):''
      if(filter==='bookmarked')return Boolean(state.bookmarks[key])
      if(filter==='mastered')return state.progress[key]?.status==='mastered'
      if(filter==='wrong')return (state.progress[key]?.wrong_count??0)>0
      return true
    })
 },[items,query,filter,state,level,section])
 if(!level||!section)return <main className="center-screen"><button onClick={()=>router.push('/jlpt')} className="primary-button">回總覽</button></main>
 const meta=JLPT_SECTION_META[section]
 return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}`)}>←</button><div><p className="eyebrow">JLPT {level} / {meta.title}</p><h1>{meta.title}</h1><p className="muted small">只讀取本機教材</p></div></div><span className="content-count">{items.length} {section==='mock'?'回':'項'}</span></header>
 <section className="study-container"><div className="study-toolbar"><input className="search-input" placeholder={`搜尋${meta.title}…`} value={query} onChange={e=>setQuery(e.target.value)}/><div className="filter-pills">{([['all','全部'],['bookmarked','收藏'],['wrong','錯題'],['mastered','已掌握']] as const).map(([id,name])=><button key={id} className={`filter-pill ${filter===id?'active':''}`} onClick={()=>setFilter(id)}>{name}</button>)}</div></div>
 {error&&<p className="form-message" role="alert">{error}</p>}
 {filtered.length===0?<div className="empty-module"><div className="empty-module-icon">{meta.icon}</div><h2>{items.length===0?`${level} ${meta.title}尚未建置`:query?'找不到符合的內容':filter==='wrong'?'目前沒有錯題紀錄':filter==='bookmarked'?'沒有收藏項目':filter==='mastered'?'尚無已掌握項目':'尚無內容'}</h2><p>{items.length===0?'這一模組尚未有教材；未虛構任何內容。':filter==='wrong'?'目前尚未建置自動判分題目，因此不會產生新的錯題紀錄。':'請調整篩選條件。'}</p></div>:<div className="content-list">{filtered.map(item=>section==='grammar'&&'pattern' in item?<GrammarCard key={item.id} item={item as GrammarItem} level={level} stateStatus={state.progress[recordKey(level,section,item.id)]?.status??'new'} isBookmarked={Boolean(state.bookmarks[recordKey(level,section,item.id)])} note={state.notes[recordKey(level,section,item.id)]??''} onError={setError}/>:<article className="content-card" key={item.id}><pre>{JSON.stringify(item,null,2)}</pre></article>)}</div>}
 </section></main>
}

export default function SectionClient() {
 const params=useParams<{level:string;section:string}>()
 return params.section==='vocabulary'?<VocabularyClient/>:<OtherSectionClient/>
}
