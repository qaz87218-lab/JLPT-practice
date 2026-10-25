import fs from 'node:fs'
import path from 'node:path'
const project=path.resolve(import.meta.dirname,'..')
const data=JSON.parse(fs.readFileSync(path.join(project,'src/data/n2-archive-exams.json'),'utf8'))
const expected={'N2_2017_12':75,'N2_2018_12':73}
let count=0
for(const exam of data.exams){
 const target=expected[exam.exam_id];if(!target)throw Error(`Unexpected exam: ${exam.exam_id}`)
 if(exam.questions.length!==target)throw Error(`Bad length: ${exam.exam_id}`)
 if(exam.has_audio!==false)throw Error('Audio must not be claimed available')
 const seen=new Set()
 for(let n=1;n<=target;n++){
  const q=exam.questions[n-1]
  if(q.number!==n||seen.has(q.id)||!/^問題(?:[1-9]|1[0-4])$/.test(q.test_part))throw Error(`Bad question ${exam.exam_id} #${n}`)
  if(!Number.isInteger(q.answer_index)||q.answer_index<1||q.answer_index>4)throw Error('Wrong answer index')
  for(const p of [...q.source_pdf_pages,q.answer_pdf_page,q.explanation_pdf_page]){
   const filename=path.join(project,'public/reading',exam.exam_id.toLowerCase().replaceAll('_','-'),`page${String(p).padStart(2,'0')}.jpg`)
   if(!fs.existsSync(filename))throw Error(`Missing ${filename}`)
  }
  seen.add(q.id);count++
 }
}
if(count!==148)throw Error(`148 expected, got ${count}`)
const language=JSON.parse(fs.readFileSync(path.join(project,'src/data/n2-2018-07-language.json'),'utf8'))
const reading=JSON.parse(fs.readFileSync(path.join(project,'src/data/n2-2018-07-reading.json'),'utf8'))
if(language.questions.length!==54||reading.questions.length!==21)throw Error('Existing 2018 July 75Q mutated')
console.log(`OK: ${count} new archive questions + ${language.questions.length+reading.questions.length} previous = ${count+75} written questions. Asset pages present.`)
