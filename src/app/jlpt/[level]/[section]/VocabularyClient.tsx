'use client'

import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {useParams,useRouter} from 'next/navigation'
import type {JlptLevel} from '@/lib/types'
import {isJlptLevel} from '@/data/jlpt'
import {getCatalogMeta,getVocabulary,importOpenJlptFiles,importOpenJlptOnline,type CatalogMeta} from '@/lib/vocab-db'
import type {VocabEntry} from '@/lib/vocab-catalog'
import {recordKey,setLocalNote,setLocalStatus,toggleLocalBookmark,useLocalStudy} from '@/lib/local-store'

type Filter='all'|'bookmarked'|'learning'|'mastered'
function RubySentence({text,plain}:{text?:string;plain:string}){
 if(!text)return <>{plain}</>
 const regex=/\{([^{}|]+)\|([^{}|]+)\}/g
 const children:ReactNode[]=[];let last=0,m:RegExpExecArray|null,index=0
 while((m=regex.exec(text))!==null){
  if(m.index>last)children.push(text.slice(last,m.index))
  if(/^[#0-9]/.test(m[2]))children.push(m[1]);else children.push(<ruby key={index++}>{m[1]}<rt>{m[2]}</rt></ruby>)
  last=regex.lastIndex
 }
 children.push(text.slice(last));return <>{children}</>
}
function WordCard({item,level,bookmarked,status,note,onError}:{item:VocabEntry;level:JlptLevel;bookmarked:boolean;status:'new'|'learning'|'mastered';note:string;onError:(e:string)=>void}){
 const [noteOpen,setNoteOpen]=useState(false),[noteDraft,setNoteDraft]=useState('')
 const act=(f:()=>unknown)=>{try{f()}catch(e){onError(e instanceof Error?e.message:'無法儲存')}}
 return <article className="content-card"><details className="grammar-details"><summary>
 <span className="vocab-title">{item.word}<span className="vocab-reading-inline">{item.reading!==item.word?`（${item.reading}）`:''}</span></span>
 <span className="grammar-meta">{item.meaningZh??'繁體中文釋義：待補'} · {item.meaningsEn.join('；')||'英文釋義未提供'}</span>
 <span className="grammar-source">{item.levels.join(' / ')} ｜ {item.pos.join('、')||'詞性待補'} ｜ OpenJLPT（待審校）</span>
 <span className="small muted">{status==='mastered'?'✓ 已掌握':status==='learning'?'• 學習中':bookmarked?'★ 已收藏':''}</span></summary>
 <div className="grammar-body">
 <p><b>假名：</b>{item.reading}　<b>羅馬字：</b>{item.romaji||'未提供'}</p>
 <p><b>英文原始釋義：</b>{item.meaningsEn.join('；')||'未提供'}</p>
 <p><b>繁體中文：</b>{item.meaningZh??'尚待翻譯與校對（不以英文直接冒充中文）'}</p>
 {item.otherForms.length>0&&<p><b>其他寫法：</b>{item.otherForms.join('、')}</p>}
 {item.examples.length?item.examples.map((ex,i)=><div className="grammar-example" key={ex.tatoebaId??i}>
 <div className="grammar-japanese">{i+1}. <RubySentence plain={ex.ja} text={ex.furigana}/></div>
 {ex.meaningEn&&<div className="grammar-reading">英文原始譯文：{ex.meaningEn}</div>}
 <div className="small muted">繁體中文例句翻譯：待補{ex.tatoebaId?<>　｜　<a target="_blank" rel="noopener noreferrer" href={`https://tatoeba.org/sentences/show/${ex.tatoebaId}`}>Tatoeba #{ex.tatoebaId}</a></>:null}</div></div>):<p>原始資料尚無例句，不另行杜撰。</p>}
 <div className="study-actions"><button className="ghost-button bordered" onClick={()=>act(()=>toggleLocalBookmark(level,'vocabulary',item.id))}>{bookmarked?'★ 取消收藏':'☆ 收藏'}</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'learning'))}>學習中</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'mastered'))}>✓ 已掌握</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'new'))}>重置</button>
 <button className="ghost-button bordered" onClick={()=>{setNoteDraft(note);setNoteOpen(x=>!x)}}>{note?'編輯筆記':'新增筆記'}</button></div>
 {noteOpen&&<div className="note-editor"><label htmlFor={`vocab-note-${item.id}`}>我的本機筆記</label><textarea id={`vocab-note-${item.id}`} rows={3} maxLength={20000} value={noteDraft} onChange={e=>setNoteDraft(e.target.value)}/><div><button className="primary-button" onClick={()=>act(()=>{setLocalNote(level,'vocabulary',item.id,noteDraft);setNoteOpen(false)})}>儲存</button></div></div>}
 {!noteOpen&&note&&<p className="saved-note"><b>筆記：</b>{note}</p>}
 <p className="muted small">來源：OpenJLPT / JMdict / Jonathan Waller / Tatoeba，原始資料屬 CC BY-SA 4.0；JLPT 等級為非官方近似分級。</p>
 </div></details></article>
}
export default function VocabularyClient(){
 const params=useParams<{level:string}>(),router=useRouter();const raw=(params.level??'').toUpperCase();const level=isJlptLevel(raw)?raw:null
 const study=useLocalStudy(),picker=useRef<HTMLInputElement>(null)
 const [rows,setRows]=useState<VocabEntry[]>([]),[meta,setMeta]=useState<CatalogMeta|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<Filter>('all'),[page,setPage]=useState(0)
 const refresh=async()=>{const [r,m]=await Promise.all([getVocabulary(),getCatalogMeta()]);setRows(r);setMeta(m);setPage(0)}
 useEffect(()=>{void refresh().catch(e=>setMessage(e instanceof Error?e.message:'本機資料庫無法讀取'))},[])
 const filtered=useMemo(()=>rows.filter(w=>level&&w.levels.includes(level)).filter(w=>{
  const q=query.trim().toLocaleLowerCase()
  if(q&&!([w.word,w.reading,w.romaji,...w.meaningsEn,...w.otherForms].join(' ').toLocaleLowerCase().includes(q)))return false
  const key=recordKey(level!,'vocabulary',w.id)
  if(filter==='bookmarked')return !!study.bookmarks[key]
  if(filter==='learning')return study.progress[key]?.status==='learning'
  if(filter==='mastered')return study.progress[key]?.status==='mastered'
  return true
 }),[rows,level,query,filter,study])
 const PAGE_SIZE=36,pageCount=Math.ceil(filtered.length/PAGE_SIZE),display=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)
 async function runImport(action:()=>Promise<CatalogMeta>){setBusy(true);setMessage('');try{const r=await action();await refresh();setMessage(`成功儲存 ${r.uniqueTotal} 個不同詞彙，跨級重複合併 ${r.duplicatesMerged} 筆。資料保存在本機 IndexedDB。`)}catch(e){setMessage(`匯入失敗：${e instanceof Error?e.message:String(e)}。原有資料不會刪除。`)}finally{setBusy(false);if(picker.current)picker.current.value=''}}
 if(!level)return <main className="center-screen"><button className="primary-button" onClick={()=>router.push('/jlpt')}>回總覽</button></main>
 return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}`)}>←</button><div><p className="eyebrow">JLPT {level} / vocabulary</p><h1>單字資料庫</h1><p className="muted small">離線瀏覽 · 來源可追溯 · 無 Supabase</p></div></div><span className="content-count">{meta?`${meta.perLevel[level]} 項`:'尚未匯入'}</span></header>
 <section className="study-container"><div className="vocab-import-panel"><h2>OpenJLPT 單字資料</h2><p className="muted small">首次匯入需要網路；完成後單字與例句儲存在本機 IndexedDB，可離線查看。這是下載靜態資料檔，不使用既有 Supabase API。</p>
 <div className="local-tools-actions"><button disabled={busy} className="primary-button" onClick={()=>void runImport(()=>importOpenJlptOnline(setMessage))}>{busy?'匯入中…':meta?'重新下載／更新單字':'一次匯入 N5～N1 單字'}</button><button disabled={busy} className="ghost-button bordered" onClick={()=>picker.current?.click()}>從 JSON 匯入</button><input hidden multiple type="file" accept=".json,application/json" ref={picker} onChange={e=>{const f=e.target.files;if(f)void runImport(()=>importOpenJlptFiles(f,setMessage))}}/></div>
 {meta&&<p className="small muted">已保存 {meta.uniqueTotal} 個不同詞彙，原始筆數 {meta.rawTotal}，跨級合併 {meta.duplicatesMerged}；更新時間：{new Date(meta.importedAt).toLocaleString('zh-TW')}。</p>}
 {message&&<p className="form-message" role="status">{message}</p>}
 <p className="small muted">詞義目前保留 OpenJLPT 的英文原文；繁體中文釋義／譯句尚待授權來源與人工審校，不會自動偽造。<a href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noopener noreferrer">OpenJLPT</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p></div>
 {meta&&<><div className="study-toolbar"><input className="search-input" placeholder="日文、假名、羅馬字、英文釋義搜尋" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/><div className="filter-pills">{([['all','全部'],['bookmarked','收藏'],['learning','學習中'],['mastered','已掌握']] as const).map(([key,label])=><button key={key} className={`filter-pill ${filter===key?'active':''}`} onClick={()=>{setFilter(key);setPage(0)}}>{label}</button>)}</div></div>
 <p className="muted small">{level}：符合條件 {filtered.length} 筆（頁次 {pageCount?Math.min(page+1,pageCount):0}/{pageCount}）</p>
 {display.length?<div className="content-list">{display.map(item=><WordCard key={item.id} item={item} level={level} bookmarked={!!study.bookmarks[recordKey(level,'vocabulary',item.id)]} status={study.progress[recordKey(level,'vocabulary',item.id)]?.status??'new'} note={study.notes[recordKey(level,'vocabulary',item.id)]??''} onError={setMessage}/>)}</div>:<div className="empty-module"><h2>沒有符合條件的單字</h2><p>可變更搜尋條件與篩選設定。</p></div>}
 {pageCount>1&&<div className="vocab-pagination"><button disabled={page===0} className="ghost-button bordered" onClick={()=>{setPage(v=>Math.max(0,v-1));window.scrollTo(0,0)}}>上一頁</button><span>{page+1} / {pageCount}</span><button disabled={page+1>=pageCount} className="ghost-button bordered" onClick={()=>{setPage(v=>v+1);window.scrollTo(0,0)}}>下一頁</button></div>}</>}
 {!meta&&<div className="empty-module"><h2>單字尚未匯入</h2><p>點選「一次匯入 N5～N1 單字」，或上傳五份 OpenJLPT JSON。此時 App 不會顯示虛構的單字數量。</p></div>}
 </section></main>
}
