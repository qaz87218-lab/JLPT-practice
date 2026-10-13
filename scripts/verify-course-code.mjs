import fs from 'node:fs'
import path from 'node:path'
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'
const cwd=process.cwd()
let files=[]
function walk(dir){ for(const ent of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(/\.tsx?$/.test(ent.name))files.push(p) }}
walk('src')
let problems=[]
for(const name of files){const res=ts.transpileModule(fs.readFileSync(name,'utf8'),{fileName:name,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}})
 for(const d of res.diagnostics||[]) if(d.category===ts.DiagnosticCategory.Error) problems.push({file:name,message:ts.flattenDiagnosticMessageText(d.messageText,' | ')})
}
if(problems.length){console.error(problems);process.exitCode=1}else console.log(`TS/TSX syntax: ${files.length} files passed`)
