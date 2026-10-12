import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=join(dirname(fileURLToPath(import.meta.url)), '..')
const expected = {n5:46,n4:100,n3:127,n2:149,n1:129}
let items=0,examples=0
for(const [lv,expectedCount] of Object.entries(expected)) {
 const rows=JSON.parse(readFileSync(join(root,'src','data',`try-${lv}-grammar.json`),'utf8'))
 if(rows.length!==expectedCount) throw new Error(`${lv}: ${rows.length} !== ${expectedCount}`)
 const ids=new Set()
 for(const item of rows){
   if(ids.has(item.id))throw new Error(`${lv}: duplicate id ${item.id}`)
   ids.add(item.id)
   if(item.examples?.length!==2)throw new Error(`${lv}: missing 2 examples ${item.id}`)
   for(const ex of item.examples){if(!ex.ja||!ex.reading||!ex.zh)throw new Error(`${lv}: missing example field ${item.id}`)}
   if(lv==='n5'){
     if(!item.sourceTitle||!item.connection||!item.explanation||!item.usageCautions||item.reviewStatus!=='needs_review')throw new Error(`n5: incomplete detail ${item.id}`)
     for(const ex of item.examples){if(/\p{Script=Han}/u.test(ex.reading))throw new Error(`n5: kanji in reading ${item.id}`)}
   }
   examples+=2
 }
 items+=rows.length
}
if(items!==551||examples!==1102)throw new Error('Totals mismatch')
if(existsSync(join(root,'src','lib','supabase.ts')))throw new Error('Supabase module still present')
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
if(pkg.dependencies?.['@supabase/supabase-js'])throw new Error('Supabase dependency still present')
console.log(`VALIDATED: ${items} grammar items, ${examples} examples, no Supabase dependency`)
