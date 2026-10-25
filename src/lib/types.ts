export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export type JlptSection = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'mock'
export type JlptLearningSection = Exclude<JlptSection, 'mock'>

export type VocabularyItem = {
  id: string
  term: string
  reading: string
  meaningZh: string
  partOfSpeech?: string
  tags?: string[]
  exampleJa?: string
  exampleZh?: string
  explanation?: string
}

export type GrammarExample = {
  ja: string
  reading?: string
  zh: string
}

export type GrammarItem = {
  id: string
  pattern: string
  reading?: string
  meaningZh: string
  connection?: string
  explanation?: string
  nuance?: string
  examples?: GrammarExample[]
  usageCautions?: string
  similarGrammar?: string
  sourceTitle?: string
  sourceId?: string
  chapterNumber?: number
  sourceBookPage?: number
  sourcePdfPage?: number
  itemType?: 'main' | 'plus'
  provenance?: string
  reviewStatus?: 'needs_review' | 'verified'
  tags?: string[]
}

export type ChoiceQuestion = {
  id: string
  prompt: string
  choices: string[]
  answerIndex: number
  explanation?: string
}

export type ReadingItem = {
  id: string
  title: string
  passage: string
  translationZh?: string
  questions: ChoiceQuestion[]
  explanation?: string
  tags?: string[]
}

export type MockQuestion = ChoiceQuestion & {
  section?: 'vocabulary' | 'grammar' | 'reading'
}

export type MockTest = {
  id: string
  title: string
  timeLimitMinutes?: number
  questions: MockQuestion[]
}

export type ListeningLine = { speaker?: string; startMs?: number; endMs?: number; ja: string; reading?: string; zh?: string }
export type ListeningItem = { id: string; title: string; audioPath?: string; durationSeconds?: number; lines: ListeningLine[]; questions: ChoiceQuestion[] }

export type JlptLevelData = {
  vocabulary: VocabularyItem[]
  grammar: GrammarItem[]
  reading: ReadingItem[]
  listening: ListeningItem[]
  mockTests: MockTest[]
}

export type JlptStudySettings = {
  user_id: string
  current_level: JlptLevel
  target_level: JlptLevel
  daily_minutes: number
  study_days: number[]
  skill_weights: Record<JlptLearningSection, number>
  skill_self_assessment: Partial<Record<JlptLearningSection, number>>
}

export type JlptMaterialReference = {
  sourceId: string
  sourceEntryId: string
  bookPage: number | null
  pdfPage: number | null
  verificationStatus: 'index_only' | 'needs_review' | 'verified'
}


export type JlptProgress = {
  id: string
  user_id: string
  level: JlptLevel
  section: JlptSection
  item_id: string
  status: 'new' | 'learning' | 'mastered'
  mastery: number
  correct_count: number
  wrong_count: number
  last_result: boolean | null
  updated_at: string
}

export type JlptBookmark = {
  id: string
  user_id: string
  level: JlptLevel
  section: JlptSection
  item_id: string
  created_at: string
}

export type JlptNote = {
  id: string
  user_id: string
  level: JlptLevel
  section: JlptSection
  item_id: string
  note: string
  created_at: string
  updated_at: string
}

export type JlptMockAttempt = {
  id: string
  user_id: string
  level: JlptLevel
  test_id: string
  score: number | null
  correct_count: number
  total_questions: number
  duration_seconds: number | null
  answers: Record<string, unknown> | null
  completed_at: string
}
