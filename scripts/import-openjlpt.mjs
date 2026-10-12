/** Build-time import of OpenJLPT vocabulary. Node 20+; no API credentials/dependencies. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const levels=['N5','N4','N3','N2','N1']
const args=process.argv.slice(2)
const folderPos=args.indexOf('--from-dir')
const inputDir=folderPos>=0?args[folderPos+1]:null
const dryRun=args.includes('--dry-run')
const outputDir=path.join(root,'public','vocab')
const metaDir=path.join(root,'DATA_EXPORTS','VOCAB_OPENJLPT')
function parse(raw,level){
 if(!Array.isArray(raw)||raw.length<1||raw.length>10000)throw new Error(`${level}: 無效的 JSON 詞彙陣列`)
 return raw.map((row,i)=>{
  if(!row||typeof row!=='object'||typeof row.id!=='string'||!row.id||typeof row.word!=='string'||!row.word||typeof row.reading!=='string'||!row.reading||row.level!==level)throw new Error(`${level}: 第 ${i+1} 筆資料不合法`)
  return row
 })
}
async function load(level){
 const file=path.join(inputDir||'', `${level.toLowerCase()}.json`)
 if(inputDir)return parse(JSON.parse(await fs.readFile(file,'utf8')),level)
 const url=`https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/${level.toLowerCase()}.json`
 const res=await fetch(url,{signal:AbortSignal.timeout(50000)})
 if(!res.ok)throw new Error(`${level} 下載失敗 HTTP ${res.status}。可以下載 JSON 後改用 --from-dir。`)
 return parse(await res.json(),level)
}
let words=[]
try{for(const level of levels){const entries=await load(level);console.log(`${level}: ${entries.length} entries`);words.push(...entries)}}catch(e){console.error('匯入未完成：'+e.message);process.exitCode=1;process.exit()}
const keys=new Set(), ids=new Set();let duplicates=0, shared=0
const levelMap=new Map()
for(const word of words){
 if(ids.has(word.level+':'+word.id))throw new Error('來源 ID 在同級重複：'+word.id)
 ids.add(word.level+':'+word.id)
 const key=JSON.stringify([word.word.normalize('NFC'),word.reading.normalize('NFC'),word.jmdict_id??null])
 if(keys.has(key))duplicates++;keys.add(key)
 if(!levelMap.has(key))levelMap.set(key,new Set())
 levelMap.get(key).add(word.level)
}
shared=[...levelMap.values()].filter(s=>s.size>1).length
const stats={version:'v0.3.7',source:'OpenJLPT',license:'CC BY-SA 4.0',sourceUrl:'https://github.com/evanclan/OpenJLPT',retrievedAt:new Date().toISOString(),sourceCounts:Object.fromEntries(levels.map(level=>[level,words.filter(w=>w.level===level).length])),originalEntries:words.length,uniqueLexemes:keys.size,duplicateRows:duplicates,sharedAcrossLevels:shared,definition:'same word + reading + JMdict ID',translationZhStatus:'not_provided_by_source'}
console.log(JSON.stringify(stats,null,2))
if(!dryRun){
 await fs.mkdir(outputDir,{recursive:true});await fs.mkdir(metaDir,{recursive:true})
 for(const level of levels){const rows=words.filter(x=>x.level===level);await fs.writeFile(path.join(outputDir,`${level.toLowerCase()}.json`),JSON.stringify(rows),'utf8')}
 const merged=new Map()
 for(const w of words){
  const key=JSON.stringify([w.word.normalize('NFC'),w.reading.normalize('NFC'),w.jmdict_id??null])
  if(!merged.has(key))merged.set(key,{id:`openjlpt:${w.jmdict_id??'na'}:${encodeURIComponent(w.word)}:${encodeURIComponent(w.reading)}`,word:w.word,reading:w.reading,romaji:w.romaji||'',meaningZh:null,meaningsEn:[],pos:[],levels:[],jmdictId:w.jmdict_id??null,examples:[],sourceIds:[]})
  const rec=merged.get(key)
  if(!rec.levels.includes(w.level))rec.levels.push(w.level)
  if(!rec.sourceIds.includes(w.id))rec.sourceIds.push(w.id)
  for(const meaning of w.meanings||[])if(!rec.meaningsEn.includes(meaning))rec.meaningsEn.push(meaning)
  for(const pos of w.pos||[])if(!rec.pos.includes(pos))rec.pos.push(pos)
  for(const ex of w.examples||[])if(rec.examples.length<2&&!rec.examples.some(old=>ex.tatoeba_id?old.tatoebaId===ex.tatoeba_id:old.ja===ex.ja))rec.examples.push({ja:ex.ja,furigana:ex.furigana,meaningEn:ex.en,tatoebaId:ex.tatoeba_id})
 }
 const mergedRows=[...merged.values()]
 await fs.writeFile(path.join(metaDir,'normalized-vocab.json'),JSON.stringify(mergedRows),'utf8')
 const fields=['id','word','reading','romaji','level','part_of_speech','meaning_english','meaning_zh_pending','jmdict_id','example_ja','example_furigana','example_en','source_ids']
 const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"'
 const csv=[fields.map(quote).join(','),...mergedRows.map(r=>[r.id,r.word,r.reading,r.romaji,r.levels.join('|'),r.pos.join('|'),r.meaningsEn.join('; '),'',r.jmdictId,r.examples[0]?.ja??'',r.examples[0]?.furigana??'',r.examples[0]?.meaningEn??'',r.sourceIds.join('|')].map(quote).join(','))].join('\n')
 await fs.writeFile(path.join(metaDir,'normalized-vocab.csv'),'\uFEFF'+csv,'utf8')
 await fs.writeFile(path.join(metaDir,'import-manifest.json'),JSON.stringify(stats,null,2),'utf8')
 await fs.writeFile(path.join(outputDir,'manifest.json'),JSON.stringify(stats,null,2),'utf8')
 console.log(`Local browser content: ${outputDir}; refresh app and click the import button.`)
}
