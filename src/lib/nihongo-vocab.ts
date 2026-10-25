import type { JlptLevel } from './types'
import type { VocabEntry } from './vocab-catalog'

// N5 and N2: user-provided Nihongo Quest local dictionaries.
// N4/N3/N1: WordMaster public JSON is deliberately loaded on demand; it is
// NOT bundled in this archive and the translation_cn field is not vetted zh-TW.
const remote: Partial<Record<JlptLevel, string>> = {
  N4:'https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/refs/heads/main/japanese/jlpt_n4.json',
  N3:'https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/refs/heads/main/japanese/jlpt_n3.json',
  N2:'https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/refs/heads/main/japanese/jlpt_n2.json',
  N1:'https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/refs/heads/main/japanese/jlpt_n1.json',
}
const local: Partial<Record<JlptLevel,string>> = {N5:'/vocab/nihongo/n5.json',N2:'/vocab/nihongo/n2.json'}
const obj=(x:unknown):x is Record<string,unknown>=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x)
const field=(x:unknown):string=>typeof x==='string'?x.trim():''
const hasEnglish=(value:string):boolean=>/[A-Za-z]/.test(value)
// Keep unique IDs deterministic across app updates; never reuse OpenJLPT IDs.
function makeId(level:JlptLevel,src:string,word:string,reading:string,category:string,ordinal:number){
  return `quest:${level.toLowerCase()}:${encodeURIComponent(src || `${word}|${reading}|${category}|${ordinal}`)}`
}
export type NihongoLoad = { entries:VocabEntry[]; origin:'local'|'remote'; englishCount:number; missingCount:number; duplicateCount:number }
export function normalizeNihongo(raw:unknown,level:JlptLevel,source:'Nihongo Quest'|'WordMaster'):NihongoLoad {
  const data=Array.isArray(raw)?raw:obj(raw)&&Array.isArray(raw.words)?raw.words:null
  if(!data||data.length===0||data.length>20000) throw new Error(`${level} 詞彙來源無效或筆數異常。`)
  const seen=new Set<string>()
  let englishCount=0, missingCount=0, duplicateCount=0
  const entries:VocabEntry[]=[]
  data.forEach((row,index)=>{
    if(!obj(row))throw new Error(`${level} 第 ${index+1} 筆不是詞彙物件。`)
    const word=field(row.word)||field(row.reading), reading=field(row.reading)||word
    const category=field(row.category)||field(row.part_of_speech)
    const original=source==='WordMaster'?field(row.translation_cn):field(row.meaning)
    if(!word||!reading)throw new Error(`${level} 第 ${index+1} 筆缺少日文或讀音。`)
    const token=JSON.stringify([word.normalize('NFC'),reading.normalize('NFC')])
    if(seen.has(token)){duplicateCount++;return} // same writing & reading, within the same level only
    seen.add(token)
    const english=hasEnglish(original)
    if(!original)missingCount++
    if(english)englishCount++
    const sourceId=field(row.id)||`${word}|${reading}`
    entries.push({
      id:makeId(level,sourceId,word,reading,category,index),word,reading,romaji:'',
      meaningsEn:english?[original]:[],meaningZh:original&&!english?original:null,
      pos:category?[category]:[],levels:[level],jmdictId:null,otherForms:[],examples:[],
      sourceIds:[sourceId],sourceRefs:[{id:sourceId,level}],source,reviewStatus:'source_unverified'
    })
  })
  return {entries,origin:source==='WordMaster'?'remote':'local',englishCount,missingCount,duplicateCount}
}
export async function getNihongoLevel(level:JlptLevel):Promise<NihongoLoad>{
  const url=local[level]||remote[level]
  if(!url)throw new Error(`${level} 尚未設定來源`)
  let response:Response
  try{response=await fetch(url,{cache:'no-store'})}catch{
    throw new Error(`${level} 單字下載失敗；此等級需要網路連接 WordMaster GitHub。`)
  }
  if(!response.ok)throw new Error(`${level} 單字載入失敗（HTTP ${response.status}）`)
  return normalizeNihongo(await response.json() as unknown,level,local[level]?'Nihongo Quest':'WordMaster')
}

// Restore access to the original Nihongo Quest v6.1 N2 WordMaster list
// without replacing the user's separate 1,430-item curated N2 dictionary.
export async function getWordMasterN2():Promise<NihongoLoad>{
  const url=remote.N2!
  let response:Response
  try{response=await fetch(url,{cache:'no-store'})}catch{
    throw new Error('WordMaster N2 原版資料無法下載；請檢查 GitHub 連線。')
  }
  if(!response.ok)throw new Error(`WordMaster N2 原版資料無法下載（HTTP ${response.status}）`)
  return normalizeNihongo(await response.json() as unknown,'N2','WordMaster')
}
