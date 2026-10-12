import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const input=JSON.parse(readFileSync(path.join(root,'src/data/n2-2018-07-reading.json'),'utf8'))
const questions=input.questions,passages=input.passages
assert.equal(input.exam.exam_id,'JLPT-N2-2018-07')
assert.equal(questions.length,21)
assert.equal(passages.length,11)
const reference=[2,4,1,3,4,3,4,1,4,2,1,2,1,3,1,3,4,3,2,3,2] // PDF p35 official-status unverified answer table
const ids=new Set(),numbs=new Set(),byPassage=new Map(passages.map(p=>[p.id,p]))
for(const [i,q] of questions.entries()){
  assert.equal(q.number,55+i,`Question number ${i}`)
  assert.equal(q.answer_index,reference[i],`Answer Q${q.number}`)
  assert.equal(q.options_jp.length,4,`Options Q${q.number}`)
  assert.equal(q.choices_explanation_zh.length,4,`Explanations Q${q.number}`)
  assert.equal(typeof q.explanation_zh,'string')
  assert(q.explanation_zh.length>12,`Explanation Q${q.number}`)
  assert(q.evidence_jp.length>4,`Evidence Q${q.number}`)
  assert(!ids.has(q.id),`duplicate ${q.id}`);ids.add(q.id)
  assert(!numbs.has(q.number),`duplicate ${q.number}`);numbs.add(q.number)
  const p=byPassage.get(q.passage_id)
  assert(p,`Missing passage Q${q.number}`)
  assert(p.questions.includes(q.number),`Passage not referencing Q${q.number}`)
  assert(p.pages.includes(q.source_pdf_page),`Wrong source page Q${q.number}`)
  assert.equal(q.answer_key_pdf_page,35)
}
for(const p of passages){
  for(const page of p.pages) assert(existsSync(path.join(root,'public/reading/n2-2018-07',`page${String(page).padStart(2,'0')}.jpg`)),`Missing scanned page ${page}`)
}
const jlpt=readFileSync(path.join(root,'src/data/jlpt.ts'),'utf8')
const route=readFileSync(path.join(root,'src/app/jlpt/[level]/[section]/SectionClient.tsx'),'utf8')
assert(jlpt.includes('N2_2018_07_READING.questions.length'),'reading count missing')
assert(route.includes("params.section==='reading'") && route.includes('ReadingPracticeClient'),'reading route missing')
console.log(`PASSED: ${questions.length} N2 reading questions, ${passages.length} passage groups, ${new Set(passages.flatMap(x=>x.pages)).size} scanned pages, all answers match user-supplied key`)
