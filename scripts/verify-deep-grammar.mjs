import fs from 'node:fs';import path from 'node:path';
const base=path.resolve('src/data');const notes=JSON.parse(fs.readFileSync(path.join(base,'grammar-deep-notes.json'),'utf8'));const bad=[];
const all=new Map(['n5','n4','n3','n2'].flatMap(l=>JSON.parse(fs.readFileSync(path.join(base,`try-${l}-grammar.json`),'utf8')).map(e=>[e.id,e])));
const keys=new Set(),counts={},examples=[];
for(const n of notes){
 if(keys.has(n.grammarId))bad.push('duplicate '+n.grammarId);keys.add(n.grammarId);
 if(!all.has(n.grammarId))bad.push('missing '+n.grammarId);
 if(!n.grammarId.startsWith(`JLPT-${n.level}-`))bad.push('level mismatch '+n.grammarId);
 for(const k of ['deepExplanation','reviewNote','sourceDocument','status'])if(!n[k])bad.push(n.grammarId+':missing '+k);
 if(n.level==='N2'){
  if(!Array.isArray(n.sourceReferences))bad.push(n.grammarId+':missing sourceReferences');
  if(n.sourceExample){
   const ex=n.sourceExample; examples.push(ex);
   for(const k of ['ja','reading','zh','document','page'])if(!ex[k])bad.push(n.grammarId+':example '+k);
   if(ex.document!=='N2文法 (有例句).pdf')bad.push(n.grammarId+':source example file');
   if(!(ex.page>=1&&ex.page<=8))bad.push(n.grammarId+':example page');
  }
 }
 counts[n.level]=(counts[n.level]||0)+1;
}
console.log(JSON.stringify({total:notes.length,byLevel:counts,N2SourceExamples:examples.length,unmatched:notes.filter(n=>n.level==='N2'&&n.status==='editorial_comparison_pending_source_match').map(n=>n.grammarId),issues:bad},null,2));if(bad.length)process.exit(1);
