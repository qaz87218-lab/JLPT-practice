import type {JlptLevel} from './types'
import {recordKey,updateLocalStudy} from './local-store'

const STORAGE='jlpt-deep-practice-rpg-v1'
const EVENT='jlpt-rpg-updated'
export type RpgState={version:1;xp:number;combo:number;maxCombo:number;totalCorrect:number;totalAttempts:number;revengeCount:number;wrongKeys:string[];daily:Record<string,{attempts:number;correct:number;bosses:number;bonus:boolean}>;bossWins:Record<string,number>}
const initial=():RpgState=>({version:1,xp:0,combo:0,maxCombo:0,totalCorrect:0,totalAttempts:0,revengeCount:0,wrongKeys:[],daily:{},bossWins:{}})
const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export const dailyKey=()=>{
 const d=new Date(),yyyy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0')
 return `${yyyy}-${mm}-${dd}`
}
export function readRpg():RpgState{
 if(typeof window==='undefined')return initial()
 try{
  const s=JSON.parse(window.localStorage.getItem(STORAGE)||'null') as unknown
  if(!isObj(s)||s.version!==1||!Number.isFinite(s.xp)||!Array.isArray(s.wrongKeys)||!isObj(s.daily)||!isObj(s.bossWins))return initial()
  return s as unknown as RpgState
 }catch{return initial()}
}
function writeRpg(s:RpgState){
 if(typeof window==='undefined')throw new Error('此功能只能在瀏覽器中使用')
 try{window.localStorage.setItem(STORAGE,JSON.stringify(s))}
 catch{throw new Error('遊戲進度無法儲存；請檢查瀏覽器儲存空間。')}
 window.dispatchEvent(new Event(EVENT))
}
export function listenRpg(fn:()=>void){window.addEventListener(EVENT,fn);window.addEventListener('storage',fn);return ()=>{window.removeEventListener(EVENT,fn);window.removeEventListener('storage',fn)}}
export function levelForXp(xp:number){let level=1,used=0;for(;level<1000;level++){const need=Math.floor(80*Math.pow(level,1.22));if(used+need>xp)return {level,into:xp-used,need};used+=need}return {level,into:0,need:0}}
export function currentTitle(level:number){
 const titles:[[number,string],...[number,string][]]=[[1,'語境見習者'],[5,'詞彙探索者'],[10,'文法行者'],[20,'閱讀追跡者'],[35,'語彙獵人'],[50,'言語解析者'],[75,'五級巡禮者'],[100,'日語境界者']]
 return [...titles].reverse().find(x=>level>=x[0])?.[1]||titles[0][1]
}
export const bossName:Record<JlptLevel,string>={N5:'假名門衛',N4:'基礎句法獸',N3:'語境迷宮主',N2:'抽象語彙王',N1:'言語終境王'}
const multiplier:Record<JlptLevel,number>={N5:1,N4:1.2,N3:1.5,N2:1.8,N1:2.2}
export function recordVocabAnswer(level:JlptLevel,id:string,correct:boolean,bossDefeated=false){
 const key=recordKey(level,'vocabulary',id)
 const current=readRpg()
 const today=dailyKey()
 const day=current.daily[today]||{attempts:0,correct:0,bosses:0,bonus:false}
 const wrong=new Set(current.wrongKeys)
 if(correct){if(wrong.has(key)){wrong.delete(key);current.revengeCount++}}else wrong.add(key)
 current.totalAttempts++
 day.attempts++
 let gain=0
 if(correct){
  current.totalCorrect++;day.correct++;current.combo++
  current.maxCombo=Math.max(current.maxCombo,current.combo)
  gain=Math.floor((10+Math.min(15,current.combo-1))*multiplier[level])
 }else current.combo=0
 current.xp+=gain
 current.wrongKeys=Array.from(wrong).slice(-15000)
 if(bossDefeated){
  day.bosses++
  const previous=current.bossWins[level]||0
  current.bossWins[level]=previous+1
  gain+=previous?60:200
  current.xp+=previous?60:200
 }
 day.bonus=Boolean(day.bonus)
 if(!day.bonus&&day.attempts>=10&&day.correct>=7){gain+=50;current.xp+=50;day.bonus=true}
 current.daily[today]=day
 // Count only actual checked responses; do not treat a manually 'mastered' label as verified.
 updateLocalStudy(prev=>{
  const before=prev.progress[key]
  const stars=Math.max(0,Math.min(5,(before?.mastery??0)+(correct?1:-1)))
  return {...prev,progress:{...prev.progress,[key]:{
    level,section:'vocabulary',item_id:id,status:stars===5?'mastered':stars>0?'learning':'new',mastery:stars,
    correct_count:(before?.correct_count??0)+(correct?1:0),wrong_count:(before?.wrong_count??0)+(correct?0:1),updated_at:new Date().toISOString()
  }}}
 })
 writeRpg(current)
 return {gain,stars:Math.min(5,Math.max(0,readMastery(level,id))),combo:current.combo,bonus:day.bonus}
}
// Avoid an extra hook; the caller can read the updated mastery from local state.
function readMastery(level:JlptLevel,id:string){
 if(typeof window==='undefined')return 0
 try{const s=JSON.parse(window.localStorage.getItem('jlpt-deep-practice-local-v1')||'null');return s?.progress?.[recordKey(level,'vocabulary',id)]?.mastery||0}catch{return 0}
}
export const isReviewDue=(updated:string|undefined,stars:number)=>{
 if(!updated||stars<=0)return true
 const days=[0,1,3,7,14,30][Math.min(stars,5)]
 const time=Date.parse(updated)
 return !Number.isFinite(time)||Date.now()-time>=days*86400000
}
export function unlocks(state:RpgState){
 const a:string[]=[]
 if(state.totalCorrect>=100)a.push('百問斬')
 if(state.totalCorrect>=1000)a.push('千問斬')
 if(state.maxCombo>=10)a.push('十連不斷')
 if(state.maxCombo>=25)a.push('連鎖獵手')
 if(state.revengeCount>=25)a.push('逆轉者')
 if(Object.keys(state.bossWins).length>=5)a.push('五境討伐者')
 for(const lev of ['N5','N4','N3','N2','N1'] as JlptLevel[])if(state.bossWins[lev])a.push(`${lev} 討伐者`)
 return a
}
