'use client'
import {useEffect,useMemo,useState} from 'react'
import type {JlptLevel} from '@/lib/types'
import type {VocabEntry} from '@/lib/vocab-catalog'
import {recordKey,useLocalStudy} from '@/lib/local-store'
import {bossName,currentTitle,dailyKey,isReviewDue,levelForXp,listenRpg,readRpg,recordVocabAnswer,unlocks,type RpgState} from '@/lib/jlpt-rpg'

type Mode='normal'|'wrong'|'review'|'boss'
type Card={word:VocabEntry;options:string[];correct:string}
const shuffle=<T,>(items:T[]):T[]=>{
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a
}
function question(word:VocabEntry,available:VocabEntry[]):Card|null{
 const correct=word.meaningZh
 if(!correct)return null
 const others=shuffle(available.filter(x=>x.id!==word.id&&x.meaningZh&&x.meaningZh!==correct)).slice(0,3)
 if(others.length<3)return null
 return {word,options:shuffle([correct,...others.map(x=>x.meaningZh!)]),correct}
}
export default function VocabArena({level,words,source}:{level:JlptLevel;words:VocabEntry[];source:string}){
 const study=useLocalStudy()
 const [rpg,setRpg]=useState<RpgState|null>(null)
 const [mode,setMode]=useState<Mode>('normal'),[current,setCurrent]=useState<Card|null>(null)
 const [chosen,setChosen]=useState<string|null>(null),[feedback,setFeedback]=useState('')
 const [bossHp,setBossHp]=useState(180),[heroHp,setHeroHp]=useState(100),[battleDone,setBattleDone]=useState(false)
 const [err,setErr]=useState(''),[show,setShow]=useState(false)
 useEffect(()=>{setRpg(readRpg());return listenRpg(()=>setRpg(readRpg()))},[])
 useEffect(()=>{setCurrent(null);setChosen(null);setFeedback('');setShow(false)},[level,source])
 const available=useMemo(()=>words.filter(w=>w.meaningZh&&w.meaningZh.trim().length>0),[words])
 const wrong=useMemo(()=>new Set(rpg?.wrongKeys||[]),[rpg])
 const pool=useMemo(()=>available.filter(w=>{
  const k=recordKey(level,'vocabulary',w.id)
  const p=study.progress[k]
  if(mode==='wrong')return wrong.has(k)
  if(mode==='review')return !!p&&isReviewDue(p.updated_at,p.mastery)
  return true
 }),[available,level,study,wrong,mode])
 const profile=levelForXp(rpg?.xp??0)
 const daily=rpg?.daily[dailyKey()]||{attempts:0,correct:0,bosses:0,bonus:false}
 const start=(which:Mode)=>{
  setMode(which);setShow(true);setErr('');setChosen(null);setFeedback('');setBattleDone(false);setBossHp(180);setHeroHp(100)
  const p=available.filter(w=>{
   const k=recordKey(level,'vocabulary',w.id),progress=study.progress[k]
   if(which==='wrong')return wrong.has(k)
   if(which==='review')return !!progress&&isReviewDue(progress.updated_at,progress.mastery)
   return true
  })
  if(p.length<4){setCurrent(null);setFeedback('可作答的題目不足四題，或目前沒有符合的錯題／到期複習。');return}
  setCurrent(question(shuffle(p)[0],available))
 }
 const next=()=>{
  if(battleDone)return
  const options=pool.filter(x=>x.id!==current?.word.id)
  if(options.length===0){setCurrent(null);setFeedback('本輪題目已完成。');return}
  setCurrent(question(shuffle(options)[0],available));setChosen(null);setFeedback('')
 }
 const pick=(answer:string)=>{
  if(!current||chosen!==null||battleDone)return
  const ok=answer===current.correct
  const win=mode==='boss'&&ok&&bossHp<=30
  try{
   const res=recordVocabAnswer(level,current.word.id,ok,win)
   setChosen(answer)
   setFeedback(`${ok?'正確':'答錯'}：${current.word.word}＝${current.correct}。${ok?`+${res.gain} EXP`:'連擊中斷'}`)
   if(mode==='boss'){
    if(ok)setBossHp(h=>Math.max(0,h-30));else setHeroHp(h=>Math.max(0,h-25))
    if(win||(!ok&&heroHp<=25))setBattleDone(true)
   }
  }catch(e){setErr(e instanceof Error?e.message:String(e))}
 }
 return <section className="vocab-arena" aria-label="JLPT 單字 RPG 練習">
 <div className="rpg-header"><div><span className="hero-kicker">JLPT ADVENTURE · {level}</span><h2>單字冒險與實戰測驗</h2><p className="muted small">參考 BJT 的 EXP、連擊、五星掌握、錯題復仇與 Boss 系統；只有實際答題才獲得分數。</p></div>
 <div className="rpg-profile"><b>Lv.{profile.level} · {currentTitle(profile.level)}</b><div className="progress-track"><span style={{width:`${profile.need?100*profile.into/profile.need:100}%`}}/></div><small>{rpg?.xp??0} EXP 累積 · {profile.into}/{profile.need} 升級經驗</small></div></div>
 <div className="rpg-stats"><span>🔥 Combo {rpg?.combo??0}</span><span>⭐ 已答對 {rpg?.totalCorrect??0}</span><span>↩ 待復仇 {rpg?.wrongKeys.length??0}</span><span>🏅 已獲稱號 {unlocks(rpg||readRpg()).length}</span></div>
 <div className="rpg-daily"><b>每日任務 · {dailyKey()}</b><span>作答 {Math.min(daily.attempts,10)}/10</span><span>答對 {Math.min(daily.correct,7)}/7</span><span>{daily.bonus?'今日獎勵 +50 EXP 已領取':'雙條件達成自動獲得 50 EXP'}</span></div>
 <div className="rpg-modes"><button className="primary-button" onClick={()=>start('normal')}>隨機練習</button><button className="ghost-button bordered" onClick={()=>start('wrong')}>錯題復仇</button><button className="ghost-button bordered" onClick={()=>start('review')}>到期複習</button><button className="ghost-button bordered" onClick={()=>start('boss')}>挑戰 {bossName[level]}</button></div>
 <p className="muted small">可出題的繁中單字：{available.length}/{words.length}。英文未校訂詞義不會被用作中文選項，以免誤學。</p>
 {show&&<div className="rpg-question" aria-live="polite">
  {mode==='boss'&&<div className="rpg-battle"><b>⚔ {bossName[level]}</b><span>Boss HP {bossHp}/180</span><span>自身 HP {heroHp}/100</span></div>}
  {current&&!(battleDone)&&<>
    <p className="hero-kicker">請選擇最合適的繁體中文意思</p><div className="rpg-word">{current.word.word}<small> {current.word.reading!==current.word.word?`（${current.word.reading}）`:''}</small></div>
    <div className="rpg-options">{current.options.map(x=><button type="button" key={x} className={chosen===null?'ghost-button bordered':x===current.correct?'rpg-correct':x===chosen?'rpg-incorrect':'ghost-button bordered'} disabled={chosen!==null} onClick={()=>pick(x)}>{x}</button>)}</div>
  </>}
  {feedback&&<p role="status" className="rpg-feedback">{feedback}</p>}
  {battleDone&&<p><b>{bossHp===0?'討伐成功！':'挑戰失敗'}</b>。可重新挑戰。</p>}
  {chosen!==null&&!battleDone&&<button className="primary-button" onClick={next}>下一題</button>}
  {battleDone&&<button className="primary-button" onClick={()=>start('boss')}>重新挑戰</button>}
  {err&&<p role="alert" className="form-message">{err}</p>}
 </div>}
 {rpg&&unlocks(rpg).length>0&&<details className="rpg-titles"><summary>已解鎖稱號（{unlocks(rpg).length}）</summary><p>{unlocks(rpg).join('・')}</p></details>}
 </section>
}
