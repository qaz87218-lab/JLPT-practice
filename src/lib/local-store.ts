import { useEffect, useState } from 'react'
import type { JlptLevel, JlptSection } from './types'

const STORAGE_KEY = 'jlpt-deep-practice-local-v1'
const EVENT_NAME = 'jlpt-local-updated'

export type LocalProgress = {
  level: JlptLevel
  section: JlptSection
  item_id: string
  status: 'new' | 'learning' | 'mastered'
  mastery: number
  correct_count: number
  wrong_count: number
  updated_at: string
}
export type LocalReadingAnswer = {
  choiceIndex: number // 0-based
  correct: boolean
  submittedAt: string
}
export type LocalCourseProgress = {
  readCompleted: boolean
  quizPassed: boolean
  attempts: number
  correctCount: number
  lastAnswer: number | null
  updatedAt: string
}
export type LocalStudyState = {
  schemaVersion: 1
  progress: Record<string, LocalProgress>
  bookmarks: Record<string, boolean>
  notes: Record<string, string>
  readingAnswers: Record<string, LocalReadingAnswer>
  courses: Record<string, LocalCourseProgress>
}
export function emptyState(): LocalStudyState {
  return { schemaVersion: 1, progress: {}, bookmarks: {}, notes: {}, readingAnswers: {}, courses: {} }
}
export function recordKey(level: JlptLevel, section: JlptSection, id: string) {
  return `${level}:${section}:${id}`
}
function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}
function validateState(raw: unknown): LocalStudyState {
  if (!isRecord(raw) || raw.schemaVersion !== 1 || !isRecord(raw.progress) || !isRecord(raw.bookmarks) || !isRecord(raw.notes)) {
    throw new Error('檔案不是本機版 JLPT 學習紀錄。')
  }
  const levels = new Set(['N5','N4','N3','N2','N1'])
  const sections = new Set(['vocabulary','grammar','reading','listening','mock'])
  const progress: LocalStudyState['progress'] = {}
  const bookmarks: LocalStudyState['bookmarks'] = {}
  const notes: LocalStudyState['notes'] = {}
  const readingAnswers: LocalStudyState['readingAnswers'] = {}
  const courses: LocalStudyState['courses'] = {}
  if (Object.keys(raw.progress).length > 200000) throw new Error('學習紀錄筆數異常。')
  for (const [key, value] of Object.entries(raw.progress)) {
    if (!isRecord(value)) throw new Error('學習進度格式不正確。')
    // v0.4.2 以前可能保存已移除的口說進度；舊備份仍可匯入，但不再載入舊模組。
    if (/^N[1-5]:speaking:/.test(key) && value.section === 'speaking') continue
    const level = value.level, section = value.section, id = value.item_id
    if (typeof level !== 'string' || !levels.has(level) || typeof section !== 'string' || !sections.has(section) || typeof id !== 'string' || recordKey(level as JlptLevel, section as JlptSection, id) !== key || !['new','learning','mastered'].includes(String(value.status))) throw new Error('學習進度格式不正確。')
    progress[key] = {level: level as JlptLevel, section: section as JlptSection, item_id:id,
      status: value.status as LocalProgress['status'], mastery: Number.isFinite(value.mastery) ? Math.max(0, Math.min(5, Number(value.mastery))) : 0,
      correct_count: Number.isFinite(value.correct_count) ? Math.max(0, Number(value.correct_count)) : 0,
      wrong_count: Number.isFinite(value.wrong_count) ? Math.max(0, Number(value.wrong_count)) : 0,
      updated_at: typeof value.updated_at === 'string' ? value.updated_at : new Date().toISOString() }
  }
  for (const [key, value] of Object.entries(raw.bookmarks)) {
    if (key.length < 512 && value === true && !/^N[1-5]:speaking:/.test(key)) bookmarks[key] = true
  }
  for (const [key, value] of Object.entries(raw.notes)) {
    if (key.length < 512 && typeof value === 'string' && !/^N[1-5]:speaking:/.test(key)) notes[key] = value.slice(0, 20000)
  }
  // v0.3.5-v0.3.7 備份不含 readingAnswers；匯入時視為空資料，不影響舊紀錄。
  if (raw.readingAnswers !== undefined) {
    if (!isRecord(raw.readingAnswers)) throw new Error('讀解作答紀錄格式不正確。')
    if (Object.keys(raw.readingAnswers).length > 200000) throw new Error('讀解作答紀錄筆數異常。')
    for (const [key, value] of Object.entries(raw.readingAnswers)) {
      if (!isRecord(value) || !key.startsWith('N2:reading:') || key.length > 512 || typeof value.choiceIndex !== 'number' || !Number.isInteger(value.choiceIndex) || value.choiceIndex < 0 || value.choiceIndex > 3 || typeof value.correct !== 'boolean' || typeof value.submittedAt !== 'string') {
        throw new Error('讀解作答紀錄格式不正確。')
      }
      readingAnswers[key] = {choiceIndex:value.choiceIndex as number,correct:value.correct,submittedAt:value.submittedAt}
    }
  }
  // v0.4.1 及更早版本不含課程進度。保留舊備份相容性。
  if (raw.courses !== undefined) {
    if (!isRecord(raw.courses) || Object.keys(raw.courses).length > 10000) throw new Error('課程進度格式不正確。')
    for (const [key, value] of Object.entries(raw.courses)) {
      if (!/^N[2345]:[a-z0-9-]+$/.test(key) || !isRecord(value) || typeof value.readCompleted !== 'boolean' || typeof value.quizPassed !== 'boolean' ||
          typeof value.attempts !== 'number' || !Number.isInteger(value.attempts) || value.attempts < 0 || value.attempts > 100000 ||
          typeof value.correctCount !== 'number' || !Number.isInteger(value.correctCount) || value.correctCount < 0 || value.correctCount > value.attempts ||
          (value.lastAnswer !== null && (typeof value.lastAnswer !== 'number' || !Number.isInteger(value.lastAnswer) || value.lastAnswer < 0 || value.lastAnswer > 3)) ||
          typeof value.updatedAt !== 'string') throw new Error('課程進度格式不正確。')
      courses[key] = {readCompleted:value.readCompleted,quizPassed:value.quizPassed,
        attempts:value.attempts,correctCount:value.correctCount,lastAnswer:value.lastAnswer as number | null,updatedAt:value.updatedAt}
    }
  }
  return { schemaVersion:1, progress, bookmarks, notes, readingAnswers, courses }
}
export function courseRecordKey(level: JlptLevel, lessonId: string) { return `${level}:${lessonId}` }
export function markCourseRead(level: JlptLevel, lessonId: string, readCompleted: boolean) {
  return updateLocalStudy(prev => {
    const key = courseRecordKey(level, lessonId)
    const current = prev.courses[key]
    return {...prev, courses:{...prev.courses, [key]:{
      readCompleted,quizPassed:current?.quizPassed??false, attempts:current?.attempts??0,
      correctCount:current?.correctCount??0,lastAnswer:current?.lastAnswer??null,updatedAt:new Date().toISOString(),
    }}}
  })
}
export function recordCourseAttempt(level: JlptLevel, lessonId: string, choice: number, answerIndex: number) {
  if (!Number.isInteger(choice) || choice < 0 || choice > 3 || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) throw new Error('題目選項錯誤。')
  const correct = choice === answerIndex
  updateLocalStudy(prev => {
    const key = courseRecordKey(level,lessonId)
    const current = prev.courses[key]
    return {...prev, courses:{...prev.courses,[key]:{
      readCompleted:current?.readCompleted??false, quizPassed:(current?.quizPassed??false)||correct,
      attempts:(current?.attempts??0)+1,correctCount:(current?.correctCount??0)+(correct?1:0),lastAnswer:choice,
      updatedAt:new Date().toISOString(),
    }}}
  })
  return correct
}
export function readLocalState(): LocalStudyState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const json = window.localStorage.getItem(STORAGE_KEY)
    return json ? validateState(JSON.parse(json) as unknown) : emptyState()
  } catch (err) {
    console.warn('本機學習資料讀取失敗；請確認瀏覽器是否允許網站儲存', err)
    return emptyState()
  }
}
function writeLocalState(value: LocalStudyState) {
  if (typeof window === 'undefined') throw new Error('只能在瀏覽器更新學習紀錄。')
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) }
  catch { throw new Error('無法儲存：瀏覽器可能停用網站儲存或空間已滿。') }
  window.dispatchEvent(new Event(EVENT_NAME))
}
export function updateLocalStudy(fn: (old: LocalStudyState) => LocalStudyState) {
  const next = fn(readLocalState())
  writeLocalState(next)
  return next
}
export function setLocalStatus(level: JlptLevel, section: JlptSection, itemId: string, status: LocalProgress['status']) {
  return updateLocalStudy(prev => {
    const key = recordKey(level,section,itemId)
    return { ...prev, progress: { ...prev.progress, [key]: {
      level,section,item_id:itemId, status, mastery: status==='mastered' ? 5 : status==='learning' ? 1 : 0,
      correct_count:prev.progress[key]?.correct_count ?? 0, wrong_count: prev.progress[key]?.wrong_count ?? 0,
      updated_at:new Date().toISOString(),
    } } }
  })
}
/** 讀解每次正式提交計入一次作答；保留最新答案供錯題複習。 */
export function recordLocalReadingAnswer(level: JlptLevel, questionId: string, choiceIndex: number, answerIndex: number) {
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 3 || !Number.isInteger(answerIndex) || answerIndex < 1 || answerIndex > 4) {
    throw new Error('選項資料不正確。')
  }
  const correct = choiceIndex === answerIndex - 1
  const now = new Date().toISOString()
  updateLocalStudy(prev => {
    const key = recordKey(level, 'reading', questionId)
    const prior = prev.progress[key]
    const reading = {choiceIndex,correct,submittedAt:now}
    return { ...prev,
      readingAnswers: {...prev.readingAnswers,[key]:reading},
      progress: {...prev.progress,[key]:{
        level,section:'reading' as const,item_id:questionId,
        status:correct?'learning' as const:'learning' as const,
        mastery:correct?Math.min(5,(prior?.mastery??0)+1):Math.max(0,(prior?.mastery??0)-1),
        correct_count:(prior?.correct_count??0)+(correct?1:0),
        wrong_count:(prior?.wrong_count??0)+(correct?0:1),
        updated_at:now,
      }},
    }
  })
  return correct
}

export function toggleLocalBookmark(level: JlptLevel, section: JlptSection, itemId: string) {
  return updateLocalStudy(prev => {
    const key = recordKey(level,section,itemId)
    const bookmarks = {...prev.bookmarks}
    if (bookmarks[key]) delete bookmarks[key]; else bookmarks[key] = true
    return {...prev, bookmarks}
  })
}
export function setLocalNote(level: JlptLevel, section: JlptSection, itemId: string, note: string) {
  return updateLocalStudy(prev => {
    const key = recordKey(level,section,itemId)
    const notes = {...prev.notes}
    if (note.trim()) notes[key] = note.slice(0,20000); else delete notes[key]
    return {...prev, notes}
  })
}
export function exportLocalBackup() {
  if (typeof document === 'undefined') return
  const backup = { application: 'JLPT Deep Practice (local)', exportedAt: new Date().toISOString(), state: readLocalState() }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)], {type:'application/json'}))
  const a = document.createElement('a'); a.href=url; a.download=`jlpt-local-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function importLocalBackup(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('備份檔案超過 10 MB。')
  const parsed: unknown = JSON.parse(await file.text())
  const raw = isRecord(parsed) && 'state' in parsed ? parsed.state : parsed
  const safe = validateState(raw)
  writeLocalState(safe)
}
export function useLocalStudy() {
  const [data,setData] = useState<LocalStudyState>(emptyState)
  useEffect(() => {
    const refresh = () => setData(readLocalState())
    refresh()
    window.addEventListener(EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => { window.removeEventListener(EVENT_NAME,refresh); window.removeEventListener('storage',refresh) }
  }, [])
  return data
}
