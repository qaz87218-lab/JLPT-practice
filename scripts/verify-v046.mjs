import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const cwd=process.cwd()
const read=file=>fs.readFileSync(path.join(cwd,file),'utf8')
const vocab=(level,amount)=>{
 const rows=JSON.parse(read(`public/vocab/nihongo/${level}.json`))
 if(rows.length!==amount)throw Error(`${level} records expected ${amount} got ${rows.length}`)
 const ids=new Set(),pairs=new Set()
 for(const row of rows){
  if(!row.id||!row.word||!row.reading||typeof row.meaning!=='string'||ids.has(row.id))throw Error(`${level} malformed or duplicated ID`)
  ids.add(row.id);pairs.add(`${row.word}/${row.reading}`)
 }
 console.log(`${level}: ${rows.length} rows; ${rows.filter(r=>!r.meaning).length} blank translations; ${rows.length-pairs.size} duplicate pairs`)
}
vocab('n5',520);vocab('n2',1430)
const files=['src/lib/jlpt-rpg.ts','src/lib/nihongo-vocab.ts','src/app/jlpt/[level]/[section]/VocabArena.tsx','src/app/jlpt/[level]/[section]/VocabularyClient.tsx']
for(const f of files){
 const out=ts.transpileModule(read(f),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.Preserve,module:ts.ModuleKind.ESNext}})
 const errors=out.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)||[]
 if(errors.length)throw Error(`${f}: `+errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join(' / '))
}
for(const token of ['recordVocabAnswer','isReviewDue','bossWins','dailyKey'])if(!read('src/lib/jlpt-rpg.ts').includes(token))throw Error('Missing RPG '+token)
for(const token of ['importWordMasterJson','idbWrite','reviewed-overrides.json','s2t-char-map.json'])if(!read('src/lib/nihongo-vocab.ts').includes(token))throw Error('Missing import/cache/zhTW '+token)
console.log('PASS: source validation + RPG module/transpilation checks (not full Next.js build)')
