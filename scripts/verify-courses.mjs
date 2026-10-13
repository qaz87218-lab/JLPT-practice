import fs from 'node:fs'
import assert from 'node:assert/strict'
const root=new URL('../', import.meta.url)
const read=(path)=>fs.readFileSync(new URL(path,root),'utf8')
const data=JSON.parse(read('src/data/grammar-courses.json'))
const units=data.units,lessons=data.lessons
assert.equal(units.length,19)
assert.equal(lessons.length,48)
assert.equal(new Set(lessons.map(x=>x.id)).size,48)
assert.equal(new Set(units.map(x=>x.id)).size,19)
for(const u of units){assert.ok(u.sourceFile&&u.sourceChapter&&u.lessonIds.length>0);for(const id of u.lessonIds) assert.ok(lessons.some(x=>x.id===id&&x.unitId===u.id))}
for(const l of lessons){
 assert.ok(/N[2345]/.test(l.level)&&l.questions.length===1)
 assert.ok(l.id.startsWith(l.level.toLowerCase()+'-')&&units.some(u=>u.id===l.unitId))
 for(const key of ['title','objective','pattern','explanation','nuance','caution']) assert.ok(typeof l[key]==='string'&&l[key].length>5,`${l.id} ${key}`)
 assert.ok(l.example.ja&&l.example.reading&&l.example.zh)
 const q=l.questions[0];assert.ok(q.choices.length===4&&Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<4)
 if(l.level!=='N3') assert.ok(l.source.pdfPage!==null,`Source page missing: ${l.id}`)
}
for(const [level,n] of Object.entries({N5:15,N4:11,N3:10,N2:12})) assert.equal(lessons.filter(x=>x.level===level).length,n)
// old materials not modified
for (const [lv,count] of Object.entries({n5:46,n4:100,n3:127,n2:149,n1:129})) {
 const old=JSON.parse(read(`src/data/try-${lv}-grammar.json`))
 assert.equal(old.length,count)
}
const rd=JSON.parse(read('src/data/n2-2018-07-reading.json'))
const lang=JSON.parse(read('src/data/n2-2018-07-language.json'))
assert.ok(rd.questions.length===21)
assert.ok(lang.questions.length===54)
const type=read('src/lib/local-store.ts')
assert.ok(type.includes('courses: Record<string, LocalCourseProgress>')&&type.includes('recordCourseAttempt'))
console.log(JSON.stringify({units:units.length,lessons:lessons.length,selfCheckQuestions:lessons.reduce((n,l)=>n+l.questions.length,0),byLevel:Object.fromEntries(['N5','N4','N3','N2'].map(x=>[x,lessons.filter(l=>l.level===x).length])),originalGrammar:551,examQuestions:75,localProgress:true},null,2))
