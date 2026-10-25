'use client'

import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {useParams,useRouter} from 'next/navigation'
import type {JlptLevel} from '@/lib/types'
import {isJlptLevel} from '@/data/jlpt'
import {getCatalogMeta,getVocabulary,importOpenJlptFiles,importOpenJlptOnline,type CatalogMeta} from '@/lib/vocab-db'
import type {VocabEntry} from '@/lib/vocab-catalog'
import {getNihongoLevel,getWordMasterN2,importWordMasterJson,type NihongoLoad} from '@/lib/nihongo-vocab'
import VocabArena from './VocabArena'
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
 <span className="grammar-meta">{item.meaningZh??'繁體中文：待校訂'}{item.meaningsEn.length ? ` · 原始英文：${item.meaningsEn.join('；')}` : ''}</span>
 <span className="grammar-source">{item.levels.join(' / ')} ｜ {item.pos.join('、')||'詞性待補'} ｜ {item.source}（待審校）</span>
 <span className="small muted">{status==='mastered'?'✓ 已掌握':status==='learning'?'• 學習中':bookmarked?'★ 已收藏':''}</span></summary>
 <div className="grammar-body">
 <p><b>假名：</b>{item.reading}　<b>羅馬字：</b>{item.romaji||'未提供'}</p>
 {item.meaningsEn.length>0&&<p><b>來源英文原文（非繁中譯文）：</b>{item.meaningsEn.join('；')}</p>}
 <p><b>中文詞義：</b>{item.meaningZh??'待翻譯／待校訂（不以英文冒充中文）'}</p>
 {item.otherForms.length>0&&<p><b>其他寫法：</b>{item.otherForms.join('、')}</p>}
 {item.examples.length?item.examples.map((ex,i)=><div className="grammar-example" key={ex.tatoebaId??i}>
 <div className="grammar-japanese">{i+1}. <RubySentence plain={ex.ja} text={ex.furigana}/></div>
 {ex.meaningEn&&<div className="grammar-reading">英文原始譯文：{ex.meaningEn}</div>}
 <div className="small muted">繁體中文例句：{ex.meaningZh??'待補'}{ex.tatoebaId?<>　｜　<a target="_blank" rel="noopener noreferrer" href={`https://tatoeba.org/sentences/show/${ex.tatoebaId}`}>Tatoeba #{ex.tatoebaId}</a></>:null}</div></div>):<p>原始資料尚無例句，不另行杜撰。</p>}
 <div className="study-actions"><button className="ghost-button bordered" onClick={()=>act(()=>toggleLocalBookmark(level,'vocabulary',item.id))}>{bookmarked?'★ 取消收藏':'☆ 收藏'}</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'learning'))}>學習中</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'mastered'))}>✓ 已掌握</button>
 <button className="ghost-button bordered" onClick={()=>act(()=>setLocalStatus(level,'vocabulary',item.id,'new'))}>重置</button>
 <button className="ghost-button bordered" onClick={()=>{setNoteDraft(note);setNoteOpen(x=>!x)}}>{note?'編輯筆記':'新增筆記'}</button></div>
 {noteOpen&&<div className="note-editor"><label htmlFor={`vocab-note-${item.id}`}>我的本機筆記</label><textarea id={`vocab-note-${item.id}`} rows={3} maxLength={20000} value={noteDraft} onChange={e=>setNoteDraft(e.target.value)}/><div><button className="primary-button" onClick={()=>act(()=>{setLocalNote(level,'vocabulary',item.id,noteDraft);setNoteOpen(false)})}>儲存</button></div></div>}
 {!noteOpen&&note&&<p className="saved-note"><b>筆記：</b>{note}</p>}
 <p className="muted small">{item.source==='OpenJLPT'?'來源：OpenJLPT / JMdict / Jonathan Waller / Tatoeba（CC BY-SA 4.0）':item.source==='WordMaster'?'來源：WordMaster Word Lists（請確認來源授權）；部分詞義為英文或簡體中文，尚待繁中校訂。':'來源：Nihongo Quest 整理詞庫；中文詞義尚未完成教師終審。'} JLPT 詞彙分級非官方公告。</p>
 </div></details></article>
}
export default function VocabularyClient(){
 const params=useParams<{level:string}>(),router=useRouter();const raw=(params.level??'').toUpperCase();const level=isJlptLevel(raw)?raw:null
 const study=useLocalStudy(),picker=useRef<HTMLInputElement>(null)
 const [source,setSource]=useState<'nihongo'|'wordmaster-n2'|'openjlpt'>('nihongo')
 const [questRows,setQuestRows]=useState<VocabEntry[]>([]),[questInfo,setQuestInfo]=useState<NihongoLoad|null>(null),[questMessage,setQuestMessage]=useState(''),[questLoading,setQuestLoading]=useState(false)
 const [wordmasterRows,setWordmasterRows]=useState<VocabEntry[]>([]),[wordmasterInfo,setWordmasterInfo]=useState<NihongoLoad|null>(null),[wordmasterMessage,setWordmasterMessage]=useState(''),[wordmasterLoading,setWordmasterLoading]=useState(false)
 const [rows,setRows]=useState<VocabEntry[]>([]),[meta,setMeta]=useState<CatalogMeta|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<Filter>('all'),[page,setPage]=useState(0)
 const refresh=async()=>{const [r,m]=await Promise.all([getVocabulary(),getCatalogMeta()]);setRows(r);setMeta(m);setPage(0)}
 useEffect(()=>{void refresh().catch(e=>setMessage(e instanceof Error?e.message:'本機資料庫無法讀取'))},[])
 useEffect(()=>{
  let active=true
  if(!level)return
  setQuestRows([]);setQuestInfo(null);setQuestMessage('');setQuestLoading(true);setPage(0)
  void getNihongoLevel(level).then(result=>{if(active){setQuestRows(result.entries);setQuestInfo(result);setQuestLoading(false)}}).catch(e=>{if(active){setQuestMessage(e instanceof Error?e.message:String(e));setQuestLoading(false)}})
  return ()=>{active=false}
 },[level])
 useEffect(()=>{
  if(source!=='wordmaster-n2'||level!=='N2'||wordmasterInfo)return
  let active=true;setWordmasterLoading(true);setWordmasterMessage('')
  void getWordMasterN2().then(result=>{if(active){setWordmasterRows(result.entries);setWordmasterInfo(result);setWordmasterLoading(false)}}).catch(e=>{if(active){setWordmasterMessage(e instanceof Error?e.message:String(e));setWordmasterLoading(false)}})
  return ()=>{active=false}
 },[source,level,wordmasterInfo])
 const filtered=useMemo(()=>(source==='nihongo'?questRows:source==='wordmaster-n2'?wordmasterRows:rows).filter(w=>level&&w.levels.includes(level)).filter(w=>{
  const q=query.trim().toLocaleLowerCase()
  if(q&&!([w.word,w.reading,w.romaji,...w.meaningsEn,w.meaningZh??'',...w.pos,...w.otherForms].join(' ').toLocaleLowerCase().includes(q)))return false
  const key=recordKey(level!,'vocabulary',w.id)
  if(filter==='bookmarked')return !!study.bookmarks[key]
  if(filter==='learning')return study.progress[key]?.status==='learning'
  if(filter==='mastered')return study.progress[key]?.status==='mastered'
  return true
 }),[rows,questRows,wordmasterRows,source,level,query,filter,study])
 const PAGE_SIZE=36,pageCount=Math.ceil(filtered.length/PAGE_SIZE),display=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)
 async function runImport(action:()=>Promise<CatalogMeta>){setBusy(true);setMessage('');try{const r=await action();await refresh();setMessage(`成功儲存 ${r.uniqueTotal} 個不同詞彙，跨級重複合併 ${r.duplicatesMerged} 筆。資料保存在本機 IndexedDB。`)}catch(e){setMessage(`匯入失敗：${e instanceof Error?e.message:String(e)}。原有資料不會刪除。`)}finally{setBusy(false);if(picker.current)picker.current.value=''}}
 if(!level)return <main className="center-screen"><button className="primary-button" onClick={()=>router.push('/jlpt')}>回總覽</button></main>
 return <main className="app-shell"><header className="topbar wide-topbar"><div className="breadcrumb-title"><button className="back-button" onClick={()=>router.push(`/jlpt/${level.toLowerCase()}`)}>←</button><div><p className="eyebrow">JLPT {level} / vocabulary</p><h1>單字資料庫</h1><p className="muted small">離線瀏覽 · 來源可追溯 · 無 Supabase</p></div></div><span className="content-count">{source==='nihongo'?(questInfo?`${questRows.length} 項`:(questLoading?'載入中':'未載入')):source==='wordmaster-n2'?(wordmasterInfo?`${wordmasterRows.length} 項`:(wordmasterLoading?'載入中':'未載入')):(meta?`${meta.perLevel[level]} 項`:'尚未匯入')}</span></header>
 <section className="study-container">
 <div className="vocab-import-panel">
 <h2>單字來源</h2>
 <div className="local-tools-actions">
 <button className={source==='nihongo'?'primary-button':'ghost-button bordered'} onClick={()=>{setSource('nihongo');setPage(0)}}>Nihongo Quest 單字</button>
 {level==='N2'&&<button className={source==='wordmaster-n2'?'primary-button':'ghost-button bordered'} onClick={()=>{setSource('wordmaster-n2');setPage(0)}}>WordMaster N2（原版）</button>}
 <button className={source==='openjlpt'?'primary-button':'ghost-button bordered'} onClick={()=>{setSource('openjlpt');setPage(0)}}>原有 OpenJLPT 資料</button>
 </div>
 <p className="muted small">N5（520）、N2（1,430）內建日中單字；N2 原版 WordMaster 單字另設入口，不與個人校訂版互相覆蓋；N4、N3、N1 由 WordMaster 公開靜態資料載入，尚未完成逐筆繁中校訂。兩種來源分開顯示，收藏、筆記和學習進度都使用原 JLPT 的本機儲存，不覆蓋原有紀錄。</p>
 {source==='nihongo'&&<>
 {questLoading&&<p role="status">正在載入 {level} 單字…</p>}
 {questInfo&&<p className="small muted">實際載入 {questRows.length} 筆；英文原文待翻譯 {questInfo.englishCount} 筆、空白詞義 {questInfo.missingCount} 筆、同級重複合併 {questInfo.duplicateCount} 筆。{questInfo.origin==='remote'?'已從公開來源載入並嘗試保存離線快取。':questInfo.origin==='cached'?'已從本機快取載入。':'這個等級的單字隨 App 一起提供。'} 已對照中文詞庫 {questInfo.reviewedCount} 筆；簡體自動轉換 {questInfo.automaticCount} 筆（未經人工審校）。</p>}
 {questMessage&&<p className="form-message" role="alert">{questMessage}（原有 OpenJLPT 與學習紀錄不受影響）</p>}
 {level!=='N5'&&level!=='N2'&&<label className="small muted">或直接匯入本等級 WordMaster JSON（本機保存，無須部署）：<input type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];if(!f||!level)return;try{const r=await importWordMasterJson(level,f);setQuestRows(r.entries);setQuestInfo(r);setQuestMessage('本機匯入成功');setPage(0)}catch(err){setQuestMessage(err instanceof Error?err.message:String(err))}finally{e.target.value=''}}}/></label>}
 </>}
 </div>
 {source==='wordmaster-n2'&&<>
 {wordmasterLoading&&<p role="status">正在讀取 WordMaster N2 原版單字…</p>}
 {wordmasterInfo&&<p className="small muted">載入 {wordmasterRows.length} 筆；英文詞義待翻譯 {wordmasterInfo.englishCount} 筆、空白詞義 {wordmasterInfo.missingCount} 筆、同級相同字形與讀音合併 {wordmasterInfo.duplicateCount} 筆。可使用本機快取或預先封裝資料；仍有部分詞義未完成繁中校訂。</p>}
 {wordmasterMessage&&<p className="form-message" role="alert">{wordmasterMessage}；N2 1,430 筆內建版仍可使用。</p>}
 <label className="small muted">從檔案匯入 WordMaster N2 JSON：<input type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];if(!f||!level)return;try{const r=await importWordMasterJson('N2',f);setWordmasterRows(r.entries);setWordmasterInfo(r);setWordmasterMessage('N2 WordMaster 已保存到本機')}catch(err){setWordmasterMessage(err instanceof Error?err.message:String(err))}finally{e.target.value=''}}}/></label>
 </>}
 {source==='openjlpt'&&<div className="vocab-import-panel"><h2>OpenJLPT 單字資料</h2><p className="muted small">首次匯入需要網路；完成後單字與例句儲存在本機 IndexedDB，可離線查看。這是下載靜態資料檔，不使用既有 Supabase API。</p>
 <div className="local-tools-actions"><button disabled={busy} className="primary-button" onClick={()=>void runImport(()=>importOpenJlptOnline(setMessage))}>{busy?'匯入中…':meta?'重新下載／更新單字':'一次匯入 N5～N1 單字'}</button><button disabled={busy} className="ghost-button bordered" onClick={()=>picker.current?.click()}>從 JSON 匯入</button><input hidden multiple type="file" accept=".json,application/json" ref={picker} onChange={e=>{const f=e.target.files;if(f)void runImport(()=>importOpenJlptFiles(f,setMessage))}}/></div>
 {meta&&<p className="small muted">已保存 {meta.uniqueTotal} 個不同詞彙，原始筆數 {meta.rawTotal}，跨級合併 {meta.duplicatesMerged}；更新時間：{new Date(meta.importedAt).toLocaleString('zh-TW')}。</p>}
 {message&&<p className="form-message" role="status">{message}</p>}
 <p className="small muted">詞義目前保留 OpenJLPT 的英文原文；繁體中文釋義／譯句尚待授權來源與人工審校，不會自動偽造。<a href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noopener noreferrer">OpenJLPT</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p></div>}
 {(source==='nihongo'?Boolean(questInfo):source==='wordmaster-n2'?Boolean(wordmasterInfo):Boolean(meta))&&<><VocabArena key={`${level}-${source}`} level={level} source={source} words={source==='nihongo'?questRows:source==='wordmaster-n2'?wordmasterRows:rows}/><div className="study-toolbar"><input className="search-input" placeholder="搜尋日文、假名、中文、詞性或英文原文" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/><div className="filter-pills">{([['all','全部'],['bookmarked','收藏'],['learning','學習中'],['mastered','已掌握']] as const).map(([key,label])=><button key={key} className={`filter-pill ${filter===key?'active':''}`} onClick={()=>{setFilter(key);setPage(0)}}>{label}</button>)}</div></div>
 <p className="muted small">{level}：符合條件 {filtered.length} 筆（頁次 {pageCount?Math.min(page+1,pageCount):0}/{pageCount}）</p>
 {display.length?<div className="content-list">{display.map(item=><WordCard key={item.id} item={item} level={level} bookmarked={!!study.bookmarks[recordKey(level,'vocabulary',item.id)]} status={study.progress[recordKey(level,'vocabulary',item.id)]?.status??'new'} note={study.notes[recordKey(level,'vocabulary',item.id)]??''} onError={setMessage}/>)}</div>:<div className="empty-module"><h2>沒有符合條件的單字</h2><p>可變更搜尋條件與篩選設定。</p></div>}
 {pageCount>1&&<div className="vocab-pagination"><button disabled={page===0} className="ghost-button bordered" onClick={()=>{setPage(v=>Math.max(0,v-1));window.scrollTo(0,0)}}>上一頁</button><span>{page+1} / {pageCount}</span><button disabled={page+1>=pageCount} className="ghost-button bordered" onClick={()=>{setPage(v=>v+1);window.scrollTo(0,0)}}>下一頁</button></div>}</>}
 {source==='openjlpt'&&!meta&&<div className="empty-module"><h2>單字尚未匯入</h2><p>點選「一次匯入 N5～N1 單字」，或上傳五份 OpenJLPT JSON。此時 App 不會顯示虛構的單字數量。</p></div>}
 </section></main>
}
