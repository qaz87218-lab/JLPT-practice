import fs from 'node:fs';import path from 'node:path';
const base=path.resolve('src/data');const notes=JSON.parse(fs.readFileSync(path.join(base,'grammar-deep-notes.json'),'utf8'));let bad=[];
const all=new Map(['n5','n4','n3'].flatMap(l=>JSON.parse(fs.readFileSync(path.join(base,`try-${l}-grammar.json`),'utf8')).map(e=>[e.id,e])));
const keys=new Set();for(const n of notes){if(keys.has(n.grammarId))bad.push('duplicate '+n.grammarId);keys.add(n.grammarId);if(!all.has(n.grammarId))bad.push('missing '+n.grammarId);for(const k of ['deepExplanation','reviewNote','sourceDocument'])if(!n[k])bad.push(n.grammarId+':'+k);}
console.log(JSON.stringify({supplementNotes:notes.length,matched:[...keys].filter(k=>all.has(k)).length,byLevel:Object.fromEntries(['N5','N4','N3'].map(l=>[l,notes.filter(n=>n.level===l).length])),issues:bad},null,2));if(bad.length)process.exit(1);
