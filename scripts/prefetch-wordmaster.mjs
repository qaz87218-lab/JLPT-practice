#!/usr/bin/env node
// Run on an internet-connected computer before npm run build. Files are source materials, not teacher-reviewed zh-TW.
import fs from 'node:fs/promises'
import path from 'node:path'
const dir=path.resolve('public/vocab/nihongo')
await fs.mkdir(dir,{recursive:true})
let failed=0
for(const level of ['n4','n3','n2','n1']){
 const url=`https://raw.githubusercontent.com/lratusa/wordmaster-wordlists/main/japanese/jlpt_${level}.json`
 try{
  const res=await fetch(url,{signal:AbortSignal.timeout(25000)})
  if(!res.ok)throw new Error(`HTTP ${res.status}`)
  const json=await res.json()
  if(!json||!Array.isArray(json.words)||json.words.length<100)throw new Error('資料結構不合格')
  const file=path.join(dir,`wordmaster-${level}.json`)
  await fs.writeFile(file,JSON.stringify(json,null,2)+'\n','utf8')
  console.log(`${level}: saved ${json.words.length} records to ${file}`)
 }catch(e){failed++;console.error(`${level}: download failed: ${e.message}`)}
}
if(failed)process.exitCode=1
