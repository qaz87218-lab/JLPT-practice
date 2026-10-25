import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const src=fs.readFileSync(new URL('../src/lib/jlpt-rpg.ts',import.meta.url),'utf8')
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const data=new Map()
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}
const win={localStorage:storage,dispatchEvent:()=>{},addEventListener:()=>{},removeEventListener:()=>{}}
const fake={
 recordKey:(l,s,i)=>`${l}:${s}:${i}`,
 updateLocalStudy:fn=>{const s=JSON.parse(storage.getItem('jlpt-deep-practice-local-v1')??'null')||{schemaVersion:1,progress:{},bookmarks:{},notes:{},courses:{},readingAnswers:{}};const result=fn(s);storage.setItem('jlpt-deep-practice-local-v1',JSON.stringify(result));return result}
}
const module={exports:{}}
vm.runInNewContext(js,{module,exports:module.exports,require:name=>name==='./local-store'?fake:null,window:win,Event:class Event{},Date,Math,JSON,Set,Array,Number,Error,String,Boolean,console},{filename:'jlpt-rpg.js'})
const r=module.exports
for(let i=0;i<5;i++)r.recordVocabAnswer('N5','test-word',true)
assert.equal(r.readRpg().totalCorrect,5)
assert.equal(JSON.parse(storage.getItem('jlpt-deep-practice-local-v1')).progress['N5:vocabulary:test-word'].mastery,5)
r.recordVocabAnswer('N5','test-word',false)
assert.ok(r.readRpg().wrongKeys.includes('N5:vocabulary:test-word'))
r.recordVocabAnswer('N5','test-word',true)
assert.ok(!r.readRpg().wrongKeys.includes('N5:vocabulary:test-word'))
assert.equal(r.readRpg().revengeCount,1)
for(let i=0;i<6;i++)r.recordVocabAnswer('N4','test-word-'+i,true)
assert.ok(r.readRpg().daily[r.dailyKey()].bonus)
assert.ok(r.readRpg().xp>0)
console.log('PASS: 5-star mastery, XP, wrong-answer revenge and daily reward')
