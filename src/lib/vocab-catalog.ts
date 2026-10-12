import type { JlptLevel } from './types'

export type SourceExample = { ja: string; furigana?: string; en?: string; tatoeba_id?: number }
export type SourceWord = {
 id:string; word:string; reading:string; romaji?:string; meanings?:string[]; level:JlptLevel;
 pos?:string[]; jmdict_id?:number|null; other_forms?:string[]; examples?:SourceExample[]
}
export type VocabExample={ja:string;furigana?:string;meaningEn?:string;tatoebaId?:number}
export type VocabEntry={
 id:string; word:string; reading:string; romaji:string; meaningsEn:string[];
 meaningZh:string|null; pos:string[]; levels:JlptLevel[]; jmdictId:number|null;
 otherForms:string[]; examples:VocabExample[]; sourceIds:string[]; sourceRefs:{id:string;level:JlptLevel}[]; source:'OpenJLPT'; reviewStatus:'source_unverified'
}
export type VocabImportResult={entries:VocabEntry[];rawCounts:Record<JlptLevel,number>;rawTotal:number;uniqueTotal:number;duplicatesMerged:number;perLevel:Record<JlptLevel,number>}
export const VOCAB_LEVELS:JlptLevel[]=['N5','N4','N3','N2','N1']
const isObj=(x:unknown):x is Record<string,unknown> => !!x && typeof x==='object' && !Array.isArray(x)
function nonemptyArray(x:unknown): string[] { return Array.isArray(x)?x.filter((a):a is string=>typeof a==='string'&&a.trim().length>0):[] }
export function validateSourceWords(raw:unknown,expected?:JlptLevel): SourceWord[] {
 if(!Array.isArray(raw)||raw.length<1||raw.length>10000)throw new Error('來源不是有效的 OpenJLPT 詞彙陣列，或單次資料量異常。')
 return raw.map((row,i)=>{
  if(!isObj(row)||typeof row.id!=='string'||!row.id||typeof row.word!=='string'||!row.word||typeof row.reading!=='string'||!row.reading||!VOCAB_LEVELS.includes(row.level as JlptLevel)||expected&&row.level!==expected)throw new Error(`來源第 ${i+1} 筆資料格式或等級不符。`)
  const examples=Array.isArray(row.examples)?row.examples.filter(isObj).filter(e=>typeof e.ja==='string').slice(0,4).map(e=>({ja:String(e.ja),furigana:typeof e.furigana==='string'?e.furigana:undefined,en:typeof e.en==='string'?e.en:undefined,tatoeba_id:typeof e.tatoeba_id==='number'?e.tatoeba_id:undefined})):[]
  return {id:row.id,word:row.word,reading:row.reading,romaji:typeof row.romaji==='string'?row.romaji:'',level:row.level as JlptLevel,meanings:nonemptyArray(row.meanings),pos:nonemptyArray(row.pos),other_forms:nonemptyArray(row.other_forms),jmdict_id:typeof row.jmdict_id==='number'?row.jmdict_id:null,examples}
 })
}
// Homographs with different readings or JMdict senses remain separate records.
export function normalizeOpenJlpt(source:SourceWord[]):VocabImportResult {
 const counts=Object.fromEntries(VOCAB_LEVELS.map(l=>[l,0])) as Record<JlptLevel,number>
 const combined=new Map<string,VocabEntry>()
 const stableIds=new Set<string>()
 for(const w of source) {
  if(!VOCAB_LEVELS.includes(w.level))throw new Error('未知的 JLPT 等級。')
  counts[w.level]++
  if(stableIds.has(w.id)) { /* same original ID can occur in more than one level */ }
  stableIds.add(w.id)
  const key=JSON.stringify([w.word.normalize('NFC'),w.reading.normalize('NFC'),w.jmdict_id??null])
  const current=combined.get(key)
  if(current){
   if(!current.levels.includes(w.level))current.levels.push(w.level)
   if(!current.sourceIds.includes(w.id))current.sourceIds.push(w.id)
   if(!current.sourceRefs.some(ref=>ref.id===w.id&&ref.level===w.level))current.sourceRefs.push({id:w.id,level:w.level})
   for(const meaning of w.meanings??[])if(!current.meaningsEn.includes(meaning))current.meaningsEn.push(meaning)
   for(const pos of w.pos??[])if(!current.pos.includes(pos))current.pos.push(pos)
   for(const form of w.other_forms??[])if(!current.otherForms.includes(form))current.otherForms.push(form)
   for(const ex of w.examples??[])if(!current.examples.some(old=>ex.tatoeba_id?old.tatoebaId===ex.tatoeba_id:old.ja===ex.ja))current.examples.push({ja:ex.ja,furigana:ex.furigana,meaningEn:ex.en,tatoebaId:ex.tatoeba_id})
   current.examples=current.examples.slice(0,2)
  } else combined.set(key,{ id:`openjlpt:${w.jmdict_id??'na'}:${encodeURIComponent(w.word)}:${encodeURIComponent(w.reading)}`,word:w.word,reading:w.reading,romaji:w.romaji??'', meaningsEn:[...new Set(w.meanings??[])], meaningZh:null,pos:[...new Set(w.pos??[])],jmdictId:w.jmdict_id??null, levels:[w.level], otherForms:[...new Set(w.other_forms??[])], examples:(w.examples??[]).slice(0,2).map(e=>({ja:e.ja,furigana:e.furigana,meaningEn:e.en,tatoebaId:e.tatoeba_id})), sourceIds:[w.id],sourceRefs:[{id:w.id,level:w.level}],source:'OpenJLPT',reviewStatus:'source_unverified'})
 }
 const entries=[...combined.values()].map(w=>({...w,levels:w.levels.sort((a,b)=>VOCAB_LEVELS.indexOf(a)-VOCAB_LEVELS.indexOf(b))})).sort((a,b)=>VOCAB_LEVELS.indexOf(a.levels[0])-VOCAB_LEVELS.indexOf(b.levels[0])||a.reading.localeCompare(b.reading,'ja')||a.word.localeCompare(b.word,'ja'))
 const perLevel=Object.fromEntries(VOCAB_LEVELS.map(l=>[l,entries.filter(w=>w.levels.includes(l)).length])) as Record<JlptLevel,number>
 return {entries,rawCounts:counts,rawTotal:source.length,uniqueTotal:entries.length,duplicatesMerged:source.length-entries.length,perLevel}
}
