import fs from 'node:fs'
import assert from 'node:assert/strict'
const counts={n5:520,n2:1430}
for(const [level,n] of Object.entries(counts)) {
 const a=JSON.parse(fs.readFileSync(new URL(`../public/vocab/nihongo/${level}.json`,import.meta.url),'utf-8'))
 assert.equal(a.length,n,`${level} 原始筆數`)
 assert.equal(new Set(a.map(w=>w.id)).size,n,`${level} ID 去重`)
 for(const [i,w] of a.entries())assert.ok(w.word&&w.reading&&w.id,`${level} 第 ${i+1} 筆缺少必要欄位`)
 console.log(`${level.toUpperCase()}: ${a.length} items; ${a.filter(x=>!x.meaning).length} items need Chinese translation review`)
}
const n2=JSON.parse(fs.readFileSync(new URL('../public/vocab/nihongo/n2.json',import.meta.url),'utf-8'))
assert.equal(n2.filter(x=>!x.meaning).length,2,'N2 原始空白詞義數量變動')
console.log('Nihongo vocabulary static-source checks passed')
