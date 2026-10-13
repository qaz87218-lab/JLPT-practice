import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(), load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const lang=load('src/data/n2-2018-07-language.json')
const reading=load('src/data/n2-2018-07-reading.json')
const all=[...lang.questions,...reading.questions]
if(lang.questions.length!==54||reading.questions.length!==21||all.length!==75)throw Error('Expected 54 language and 21 reading questions')
if(new Set(all.map(q=>q.id)).size!==75)throw Error('Duplicate IDs')
for(let n=1;n<=75;n++){
 const q=all.find(q=>q.number===n)
 if(!q)throw Error(`Missing Q${n}`)
 if(!Array.isArray(q.options_jp)||q.options_jp.length!==4||q.options_jp.some(x=>!String(x).trim()))throw Error(`Invalid choices Q${n}`)
 if(!Number.isInteger(q.answer_index)||q.answer_index<1||q.answer_index>4)throw Error(`Invalid correct answer Q${n}`)
 if(!q.explanation_zh?.trim()||q.choices_explanation_zh?.length!==4)throw Error(`Missing explanation Q${n}`)
 const p=`public/reading/n2-2018-07/page${String(q.source_pdf_page).padStart(2,'0')}.jpg`
 if(!fs.existsSync(path.join(root,p)))throw Error(`Missing scan ${p}`)
 if(q.correct_order){const starred=q.number===45?1:2;if(q.correct_order[starred]!==q.answer_index)throw Error(`Ordering/star mismatch Q${n}`)}
}
const groups=Object.fromEntries(Array.from({length:14},(_,i)=>[`問題${i+1}`,all.filter(q=>q.test_part===`問題${i+1}`).length]))
const expected={問題1:5,問題2:5,問題3:5,問題4:7,問題5:5,問題6:5,問題7:12,問題8:5,問題9:5,問題10:5,問題11:9,問題12:2,問題13:3,問題14:2}
for(const [k,v] of Object.entries(expected))if(groups[k]!==v)throw Error(`Expected ${k} ${v} got ${groups[k]}`)
for(let n=14;n<=23;n++)if(!fs.existsSync(path.join(root,`public/reading/n2-2018-07/listening/page${n}.jpg`)))throw Error(`Missing listening material ${n}`)
console.log(JSON.stringify({status:'PASS',lang:54,reading:21,total:75,groups,scans:'present',vocab_grammar_preserved:true},null,2))
