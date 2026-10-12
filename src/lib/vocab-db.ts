import type {JlptLevel} from './types'
import {normalizeOpenJlpt,validateSourceWords,VOCAB_LEVELS,type SourceWord,type VocabEntry,type VocabImportResult} from './vocab-catalog'

const DATABASE='jlpt-deep-vocabulary-v1', STORE='records', META='catalog-meta', VERSION=1
const SOURCES:Record<JlptLevel,string>=Object.fromEntries(VOCAB_LEVELS.map(level=>[level,`https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/${level.toLowerCase()}.json`])) as Record<JlptLevel,string>
export type CatalogMeta={rawTotal:number;uniqueTotal:number;perLevel:Record<JlptLevel,number>;duplicatesMerged:number;importedAt:string;method:'online'|'file'|'bundled';license:'CC BY-SA 4.0'}
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined')return reject(new Error('瀏覽器不支援 IndexedDB。'))
 const req=indexedDB.open(DATABASE,VERSION)
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(META))db.createObjectStore(META)}
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error??new Error('資料庫無法開啟'))
})}
async function readAll<T>(storeName:string):Promise<T[]>{const db=await openDb();try{return await new Promise<T[]>((resolve,reject)=>{const tx=db.transaction(storeName,'readonly'),req=tx.objectStore(storeName).getAll();req.onsuccess=()=>resolve(req.result as T[]);req.onerror=()=>reject(req.error)})}finally{db.close()}}
export async function getVocabulary():Promise<VocabEntry[]>{return readAll<VocabEntry>(STORE)}
export async function getCatalogMeta():Promise<CatalogMeta|null>{const db=await openDb();try{return await new Promise((resolve,reject)=>{const req=db.transaction(META,'readonly').objectStore(META).get('meta');req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error)})}finally{db.close()}}
export async function saveCatalog(result:VocabImportResult,method:CatalogMeta['method']):Promise<CatalogMeta>{
 if(result.entries.length===0)throw new Error('匯入資料為空。')
 const db=await openDb();const meta:CatalogMeta={rawTotal:result.rawTotal,uniqueTotal:result.uniqueTotal,duplicatesMerged:result.duplicatesMerged,perLevel:result.perLevel,importedAt:new Date().toISOString(),method,license:'CC BY-SA 4.0'}
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction([STORE,META],'readwrite');const store=tx.objectStore(STORE);store.clear();for(const item of result.entries)store.put(item);tx.objectStore(META).put(meta,'meta');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('寫入失敗'));tx.onabort=()=>reject(tx.error??new Error('寫入已中斷'))})}finally{db.close()}
 return meta
}
async function getOne(level:JlptLevel,local:boolean):Promise<SourceWord[]>{
 const url=local?`/vocab/${level.toLowerCase()}.json`:SOURCES[level]
 const response=await fetch(url,{cache:'no-store'})
 if(!response.ok)throw new Error(`${level} 原始資料下載失敗（HTTP ${response.status}）`)
 return validateSourceWords(await response.json() as unknown,level)
}
export async function importOpenJlptOnline(onProgress?:(msg:string)=>void):Promise<CatalogMeta>{
 const combined:SourceWord[]=[];let local=true
 // Build-time bundled files (if present) have priority; otherwise download static files from GitHub.
 try{for(const l of VOCAB_LEVELS){onProgress?.(`讀取本機教材 ${l}…`);combined.push(...await getOne(l,true))}}catch{local=false;combined.length=0}
 if(!local)for(const l of VOCAB_LEVELS){onProgress?.(`首次下載 ${l}（需網路）…`);combined.push(...await getOne(l,false))}
 onProgress?.('驗證來源、合併跨級重複詞並寫入本機資料庫…')
 return saveCatalog(normalizeOpenJlpt(combined),local?'bundled':'online')
}
export async function importOpenJlptFiles(files:FileList,onProgress?:(msg:string)=>void):Promise<CatalogMeta>{
 const incoming:SourceWord[]=[]
 if(!files.length||files.length>5)throw new Error('請選擇 1～5 個 OpenJLPT 詞彙 JSON。')
 for(let i=0;i<files.length;i++){
  const file=files[i];if(file.size>8*1024*1024)throw new Error(`檔案過大：${file.name}`)
  onProgress?.(`讀取 ${file.name}…`)
  const json:unknown=JSON.parse(await file.text()) as unknown
  incoming.push(...validateSourceWords(json))
 }
 // Deliberately merge partial imports with existing entries by reconstructing the raw source record shape.
 const existing=await getVocabulary()
 const extra:SourceWord[]=existing.flatMap(w=>w.sourceRefs.map(ref=>({id:ref.id,word:w.word,reading:w.reading,romaji:w.romaji,level:ref.level,meanings:w.meaningsEn,pos:w.pos,jmdict_id:w.jmdictId,other_forms:w.otherForms,examples:w.examples.map(e=>({ja:e.ja,furigana:e.furigana,en:e.meaningEn,tatoeba_id:e.tatoebaId}))})))
 const merged=new Map<string,SourceWord>();for(const row of [...extra,...incoming])merged.set(row.id+':'+row.level,row)
 return saveCatalog(normalizeOpenJlpt([...merged.values()]),'file')
}
