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
export type LocalStudyState = {
  schemaVersion: 1
  progress: Record<string, LocalProgress>
  bookmarks: Record<string, boolean>
  notes: Record<string, string>
}
export function emptyState(): LocalStudyState {
  return { schemaVersion: 1, progress: {}, bookmarks: {}, notes: {} }
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
  const sections = new Set(['vocabulary','grammar','reading','listening','speaking','mock'])
  const progress: LocalStudyState['progress'] = {}
  const bookmarks: LocalStudyState['bookmarks'] = {}
  const notes: LocalStudyState['notes'] = {}
  if (Object.keys(raw.progress).length > 200000) throw new Error('學習紀錄筆數異常。')
  for (const [key, value] of Object.entries(raw.progress)) {
    if (!isRecord(value)) throw new Error('學習進度格式不正確。')
    const level = value.level, section = value.section, id = value.item_id
    if (typeof level !== 'string' || !levels.has(level) || typeof section !== 'string' || !sections.has(section) || typeof id !== 'string' || recordKey(level as JlptLevel, section as JlptSection, id) !== key || !['new','learning','mastered'].includes(String(value.status))) throw new Error('學習進度格式不正確。')
    progress[key] = {level: level as JlptLevel, section: section as JlptSection, item_id:id,
      status: value.status as LocalProgress['status'], mastery: Number.isFinite(value.mastery) ? Math.max(0, Math.min(5, Number(value.mastery))) : 0,
      correct_count: Number.isFinite(value.correct_count) ? Math.max(0, Number(value.correct_count)) : 0,
      wrong_count: Number.isFinite(value.wrong_count) ? Math.max(0, Number(value.wrong_count)) : 0,
      updated_at: typeof value.updated_at === 'string' ? value.updated_at : new Date().toISOString() }
  }
  for (const [key, value] of Object.entries(raw.bookmarks)) {
    if (key.length < 512 && value === true) bookmarks[key] = true
  }
  for (const [key, value] of Object.entries(raw.notes)) {
    if (key.length < 512 && typeof value === 'string') notes[key] = value.slice(0, 20000)
  }
  return { schemaVersion:1, progress, bookmarks, notes }
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
