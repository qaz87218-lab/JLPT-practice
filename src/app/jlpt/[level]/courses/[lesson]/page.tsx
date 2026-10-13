import CourseLessonClient from './CourseLessonClient'
import { COURSE_LESSONS } from '@/lib/grammar-courses'
export function generateStaticParams() { return COURSE_LESSONS.map(lesson=>({level:lesson.level.toLowerCase(),lesson:lesson.id})) }
export default function Page() { return <CourseLessonClient/> }
