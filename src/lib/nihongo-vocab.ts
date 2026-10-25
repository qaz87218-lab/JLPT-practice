import type { JlptLevel } from './types'
import type { VocabEntry } from './vocab-catalog'
import simplified from '../../public/vocab/nihongo/s2t-char-map.json'
import overrides from '../../public/vocab/nihongo/reviewed-overrides.json'
import n5 from '../../public/vocab/nihongo/n5.json'
import n2 from '../../public/vocab/nihongo/n2.json'

type Obj=Record<string,unknown>
const isObj=(x:unknown):x is Obj=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x)
const str=(x:unknown)=>typeof x==='string'?x.trim():''
const remoteRoot='https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/main/japanese/'
const fetched=new Map<string,unknown>()
const hasLatin=(s:string)=>/[a-zA-Z]/.test(s)
const hasCJK=(s:string)=>/[\u3400-\u9fff]/.test(s)
// Unicode-level fallback only: context-sensitive conversion requires human proofreading.
const chars:simpleMap = simplified as simpleMap
type simpleMap=Record<string,string>
const zhTW=(s:string)=>Array.from(s).map(ch=>chars[ch]||ch).join('').replace(/;\s*/g,'；').replace(/,\s*/g,'、')
const reviewed:Record<string,string>=overrides as Record<string,string>
const lookupMap=new Map<string,string>()
for(const row of [...n5,...n2]){
 if(row.word&&row.reading&&row.meaning&&!hasLatin(row.meaning)){
  lookupMap.set(`${row.word}|${row.reading}`,row.meaning)
 }
}
const dbName='jlpt-wordmaster-cache-v1'
async function idbRead(level:string):Promise<unknown|null>{
 if(typeof indexedDB==='undefined')return null
 try{return await new Promise<unknown|null>((resolve,reject)=>{
  const req=indexedDB.open(dbName,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('json'))req.result.createObjectStore('json')}
  req.onerror=()=>reject(req.error)
  req.onsuccess=()=>{const db=req.result;const txn=db.transaction('json','readonly');const get=txn.objectStore('json').get(level)
    get.onsuccess=()=>{resolve(get.result??null);db.close()};get.onerror=()=>{reject(get.error);db.close()}}
 })}catch{return null}
}
async function idbWrite(level:string,json:unknown):Promise<void>{
 if(typeof indexedDB==='undefined')return
 try{await new Promise<void>((resolve,reject)=>{
  const req=indexedDB.open(dbName,1)
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('json'))req.result.createObjectStore('json')}
  req.onerror=()=>reject(req.error)
  req.onsuccess=()=>{const db=req.result;const txn=db.transaction('json','readwrite');txn.objectStore('json').put(json,level)
   txn.oncomplete=()=>{db.close();resolve()};txn.onerror=()=>{db.close();reject(txn.error)}}
 })}catch{/* Cache failures don't corrupt main progress; next load can refetch. */}
}
async function download(level:JlptLevel):Promise<{data:unknown; origin:'bundled'|'cached'|'remote'}>{
 const key=level.toLowerCase()
 if(level==='N5')return {data:n5,origin:'bundled'}
 // Local N2 is the user's own 1,430-item curated list.
 if(level==='N2')return {data:n2,origin:'bundled'}
 const cached=fetched.get(key)||await idbRead(key)
 if(cached)return {data:cached,origin:'cached'}
 // Check bundled file first; if prefetch-wordmaster was run these files work offline.
 const local=await fetch(`/vocab/nihongo/wordmaster-${key}.json`).catch(()=>null)
 if(local?.ok){const data:unknown=await local.json();fetched.set(key,data);void idbWrite(key,data);return {data,origin:'bundled'}}
 try{
  const res=await fetch(`${remoteRoot}jlpt_${key}.json`)
  if(!res.ok)throw new Error(`HTTP ${res.status}`)
  const data:unknown=await res.json();fetched.set(key,data);void idbWrite(key,data);return {data,origin:'remote'}
 }catch{throw new Error(`${level} 詞彙無法取得；請確認網路，或在電腦上執行 npm run prefetch:wordmaster 後重新部署。`)}
}
export type NihongoLoad={entries:VocabEntry[];origin:'bundled'|'cached'|'remote';englishCount:number;missingCount:number;duplicateCount:number;reviewedCount:number;automaticCount:number}
export function normalizeNihongo(raw:unknown,level:JlptLevel,source:'Nihongo Quest'|'WordMaster',origin:NihongoLoad['origin']):NihongoLoad{
 const data=Array.isArray(raw)?raw:isObj(raw)&&Array.isArray(raw.words)?raw.words:null
 if(!data||!data.length||data.length>20000)throw new Error(`不合法的 ${level} 詞庫。`)
 if(source==='WordMaster'&&data.some((x:unknown)=>isObj(x)&&str(x.jlpt_level)&&str(x.jlpt_level).toUpperCase()!==level))throw new Error(`詞庫等級不符：預期 ${level}`)
 let englishCount=0,missingCount=0,duplicateCount=0,reviewedCount=0,automaticCount=0
 const entries:VocabEntry[]=[],seen=new Set<string>()
 data.forEach((v,i)=>{
  if(!isObj(v))return
  const word=str(v.word),reading=str(v.reading)||word
  if(!word||!reading)return
  const key=JSON.stringify([word.normalize('NFC'),reading.normalize('NFC')]);if(seen.has(key)){duplicateCount++;return}seen.add(key)
  const original=source==='WordMaster'?str(v.translation_cn):str(v.meaning)
  const mapped=reviewed[`${word}|${reading}`]||lookupMap.get(`${word}|${reading}`)
  let meaning:string|null=null
  let reviewedWord=false
  if(source==='Nihongo Quest'&&!hasLatin(original)){meaning=original;reviewedWord=true}
  else if(mapped){meaning=mapped;reviewedWord=true}
  else if(original&&!hasLatin(original)&&hasCJK(original)){meaning=zhTW(original);automaticCount++}
  if(reviewedWord)reviewedCount++
  if(!meaning){if(original&&hasLatin(original))englishCount++;else missingCount++}
  const id=`quest:${level.toLowerCase()}:${encodeURIComponent(str(v.id)||`${word}|${reading}`)}`
  const rawExamples=Array.isArray(v.examples)?v.examples:[]
  const examples=rawExamples.filter(isObj).slice(0,4).map(ex=>{const ja=str(ex.sentence),trans=str(ex.translation_cn);return {ja,meaningEn:hasLatin(trans)?trans:undefined,meaningZh:trans&&!hasLatin(trans)?zhTW(trans):undefined}}).filter(x=>x.ja)
  entries.push({id,word,reading,romaji:'',meaningsEn:!meaning&&original&&hasLatin(original)?[original]:[],meaningZh:meaning,pos:[str(v.category)||str(v.part_of_speech)].filter(Boolean),levels:[level],jmdictId:null,otherForms:[],examples,sourceIds:[str(v.id)||String(i)],sourceRefs:[{id:str(v.id)||String(i),level}],source,reviewStatus:'source_unverified'})
 })
 return {entries,origin,englishCount,missingCount,duplicateCount,reviewedCount,automaticCount}
}
export async function getNihongoLevel(level:JlptLevel):Promise<NihongoLoad>{
 const {data,origin}=await download(level)
 return normalizeNihongo(data,level,level==='N5'||level==='N2'?'Nihongo Quest':'WordMaster',origin)
}
export async function getWordMasterN2():Promise<NihongoLoad>{
 const key='n2',cached=fetched.get(key)||await idbRead(key)
 if(cached)return normalizeNihongo(cached,'N2','WordMaster','cached')
 const local=await fetch('/vocab/nihongo/wordmaster-n2.json').catch(()=>null)
 if(local?.ok){const data:unknown=await local.json();fetched.set(key,data);void idbWrite(key,data);return normalizeNihongo(data,'N2','WordMaster','bundled')}
 try{const res=await fetch(`${remoteRoot}jlpt_n2.json`);if(!res.ok)throw new Error(String(res.status));const data:unknown=await res.json();fetched.set(key,data);void idbWrite(key,data);return normalizeNihongo(data,'N2','WordMaster','remote')}
 catch{throw new Error('N2 WordMaster 詞庫取得失敗，請確認網路或執行預先下載腳本。')}
}

/** Optional direct JSON import: validate before saving; does not touch prior JLPT progress. */
export async function importWordMasterJson(level:JlptLevel,file:File):Promise<NihongoLoad>{
 if(file.size>12_000_000)throw new Error('檔案超過 12 MB')
 const parsed:unknown=JSON.parse(await file.text())
 const checked=normalizeNihongo(parsed,level,'WordMaster','cached')
 if(checked.entries.length<10)throw new Error('詞庫少於 10 筆，請確認級別和檔案。')
 const key=level.toLowerCase()
 fetched.set(key,parsed);await idbWrite(key,parsed)
 return checked
}
