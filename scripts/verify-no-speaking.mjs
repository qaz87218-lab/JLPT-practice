import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const src = (file) => readFileSync(new URL('../'+file, import.meta.url), 'utf8')
const planned = ['vocabulary','grammar','reading','listening']
const code = src('src/lib/jlpt-planner.ts')
const required = src('src/lib/types.ts')
const level = src('src/app/jlpt/[level]/LevelClient.tsx')
const route = src('src/app/jlpt/[level]/[section]/page.tsx')
const home = src('src/app/jlpt/page.tsx')
const meta = src('src/data/jlpt.ts')
const pkg = JSON.parse(src('package.json'))
assert.equal(pkg.version,'0.4.3')
assert(!required.includes("| 'speaking'"))
assert(!required.includes('SpeakingItem'))
for (const f of [level,route,home,meta,code]) assert(!f.includes("'speaking'") && !f.includes('口說'))
assert(code.includes("['vocabulary', 'grammar', 'reading', 'listening']"))
for (const item of planned) assert(meta.includes(item))
assert(!level.includes('五大學習模組'))
assert(!route.includes('speaking'))
console.log('PASS: removed speaking from UI, section types, static routes, and planner; app version 0.4.3')
