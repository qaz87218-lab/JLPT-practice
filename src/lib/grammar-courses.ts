import raw from '@/data/grammar-courses.json'
import type { JlptLevel } from '@/lib/types'

export type CourseQuestion = {id:string;prompt:string;choices:string[];answerIndex:number;explanation:string}
export type GrammarCourseLesson = {
  id:string;level:JlptLevel;unitId:string;title:string;objective:string;pattern:string;
  explanation:string;nuance:string;example:{ja:string;reading:string;zh:string;provenance:string};
  caution:string;questions:CourseQuestion[];reviewStatus:string;
  source:{filename:string;section:string;pdfPage:number|null;note:string}
}
export type GrammarCourseUnit = {
  id:string;level:JlptLevel;title:string;sourceChapter:string;sourceFile:string;sourcePage:number|null;lessonIds:string[]
}
export const COURSE_UNITS = raw.units as unknown as GrammarCourseUnit[]
export const COURSE_LESSONS = raw.lessons as unknown as GrammarCourseLesson[]
export const getCourseUnits = (level:JlptLevel) => COURSE_UNITS.filter(x=>x.level===level)
export const getCourseLessons = (level:JlptLevel) => COURSE_LESSONS.filter(x=>x.level===level)
export const getCourseLesson = (level:JlptLevel,lessonId:string) => COURSE_LESSONS.find(x=>x.level===level&&x.id===lessonId)
export const getCourseUnit = (level:JlptLevel,unitId:string) => COURSE_UNITS.find(x=>x.level===level&&x.id===unitId)
