import type { JlptLevel, JlptLevelData, JlptSection, GrammarItem } from '@/lib/types'
import tryN5Grammar from './try-n5-grammar.json'
import tryN4Grammar from './try-n4-grammar.json'
import tryN3Grammar from './try-n3-grammar.json'
import tryN2Grammar from './try-n2-grammar.json'
import tryN1Grammar from './try-n1-grammar.json'
import { N2_2018_07_READING } from '@/lib/reading-exams'

export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export const JLPT_SECTION_META: Record<JlptSection, { title: string; description: string; icon: string }> = {
  vocabulary: {
    title: '單字',
    description: '詞彙、讀音、中文意思、例句與辨析',
    icon: '語',
  },
  grammar: {
    title: '文法',
    description: '句型、接續、語感、例句與相近文法比較',
    icon: '文',
  },
  reading: {
    title: '文章',
    description: '歷年讀解題、原文掃描、逐題判分與選項詳解',
    icon: '読',
  },
  listening: {
    title: '聽力',
    description: '逐句聽解、盲聽、跟讀與理解測驗（教材待匯入）',
    icon: '聴',
  },
  speaking: {
    title: '口說',
    description: '朗讀、情境會話、自由回答與錄音（教材待匯入）',
    icon: '話',
  },
  mock: {
    title: '模擬試題',
    description: '完整模擬考或已收錄的歷年考試分項練習',
    icon: '試',
  },
}

const emptyLevel = (): JlptLevelData => ({
  vocabulary: [],
  grammar: [],
  reading: [],
  listening: [],
  speaking: [],
  mockTests: [],
})

/**
 * 正式題庫入口。
 * N5文法46筆、N4文法100筆、N3文法127筆、N2文法149筆、N1文法129筆採用 TRY! 教科書索引及助理自編學習資料。
 * 其餘未提供教材的模組保持空白，不填造內容。
 */
export const JLPT_DATA: Record<JlptLevel, JlptLevelData> = {
  N5: { ...emptyLevel(), grammar: tryN5Grammar as GrammarItem[] },
  N4: { ...emptyLevel(), grammar: tryN4Grammar as GrammarItem[] },
  N3: { ...emptyLevel(), grammar: tryN3Grammar as GrammarItem[] },
  N2: { ...emptyLevel(), grammar: tryN2Grammar as GrammarItem[] },
  N1: { ...emptyLevel(), grammar: tryN1Grammar as GrammarItem[] },
}

export function getSectionCount(level: JlptLevel, section: JlptSection) {
  const data = JLPT_DATA[level]
  if (section === 'reading' && level === 'N2') return N2_2018_07_READING.questions.length
  if (section === 'mock' && level === 'N2') return 1 // 僅含2018/07讀解題組，並非完整模擬考
  if (section === 'mock') return data.mockTests.length
  return data[section].length
}

export function isJlptLevel(value: string): value is JlptLevel {
  return JLPT_LEVELS.includes(value as JlptLevel)
}

export function isJlptSection(value: string): value is JlptSection {
  return value === 'vocabulary' || value === 'grammar' || value === 'reading' || value === 'listening' || value === 'speaking' || value === 'mock'
}
