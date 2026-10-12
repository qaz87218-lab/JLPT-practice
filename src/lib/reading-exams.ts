import rawN2Reading from '@/data/n2-2018-07-reading.json'

export type ReadingExamQuestion = {
  id: string
  exam_id: string
  test_part: string
  passage_id: string
  number: number
  question_jp: string
  question_zh: string
  options_jp: string[]
  answer_index: number // 來源檔為 1-4；顯示時需轉為 0-based
  evidence_jp: string
  explanation_zh: string
  choices_explanation_zh: string[]
  related_vocabulary: string[]
  reading_skill: string
  editorial_status: string
  source_pdf_page: number
  answer_key_pdf_page: number
}
export type ReadingPassage = {
  id: string
  section: string
  sub: string
  title: string
  pages: number[]
  questions: number[]
  summary: string
  focus: string
  vocab: [string, string, string][]
}
export type ReadingExam = {
  schema_version: string
  exam: { exam_id:string; level:string;year:number; month:number; section:string;source_name:string;source_credit:string;source_verified_official:boolean;content_review_status:string;scope:string }
  passages: ReadingPassage[]
  questions: ReadingExamQuestion[]
}

export const N2_2018_07_READING = rawN2Reading as ReadingExam
export const readingAssetPath = (page: number) => `/reading/n2-2018-07/page${String(page).padStart(2,'0')}.jpg`
