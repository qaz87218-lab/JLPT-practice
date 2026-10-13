import fs from 'node:fs'
import vm from 'node:vm'
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'
import assert from 'node:assert/strict'
const code=fs.readFileSync('src/lib/local-store.ts','utf8')
const trans=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText
const memory=new Map()
const window={localStorage:{getItem:(k)=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},dispatchEvent:()=>{}}
const ctx={exports:{},require:(id)=>id==='react'?{useEffect:()=>{},useState:x=>[x,()=>{}]}:undefined,window,console,Event:class{},Date,JSON,Number,Set,Object,Error}
vm.runInNewContext(trans,ctx)
const store=ctx.exports
// old backup compatible (without courses field)
const old={schemaVersion:1,progress:{'N2:grammar:abc':{level:'N2',section:'grammar',item_id:'abc',status:'learning',mastery:1,correct_count:2,wrong_count:1,updated_at:'2026-01-01'}},bookmarks:{'N2:grammar:abc':true},notes:{'N2:grammar:abc':'old'},readingAnswers:{}}
window.localStorage.setItem('jlpt-deep-practice-local-v1',JSON.stringify(old))
assert.equal(Object.keys(store.readLocalState().courses).length,0)
store.markCourseRead('N2','n2-c01-01',true)
let state=store.readLocalState()
assert.equal(state.courses['N2:n2-c01-01'].readCompleted,true)
assert.equal(state.progress['N2:grammar:abc'].correct_count,2)
assert.equal(state.notes['N2:grammar:abc'],'old')
assert.equal(store.recordCourseAttempt('N2','n2-c01-01',1,0),false)
assert.equal(store.recordCourseAttempt('N2','n2-c01-01',0,0),true)
state=store.readLocalState()
assert.equal(state.courses['N2:n2-c01-01'].attempts,2)
assert.equal(state.courses['N2:n2-c01-01'].correctCount,1)
assert.equal(state.courses['N2:n2-c01-01'].quizPassed,true)
assert.equal(state.courses['N2:n2-c01-01'].readCompleted,true)
assert.equal(state.progress['N2:grammar:abc'].wrong_count,1)
console.log('Local storage compatibility, markRead, quiz attempts, and old progress preservation: passed')
