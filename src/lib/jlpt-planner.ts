/** Personalisation logic as a pure helper. UI/job orchestration is a later integration step. */
import type { JlptLearningSection } from '@/lib/types'

export const LEARNING_SECTIONS: JlptLearningSection[] = ['vocabulary', 'grammar', 'reading', 'listening']
export const DEFAULT_MINUTES: Record<JlptLearningSection,number> = {
  vocabulary:18, grammar:18, reading:24, listening:30,
}
export const REVIEW_INTERVAL_DAYS = [1,3,7,14,30] as const

/**
 * Accuracy: a fraction in [0,1], higher = better. Self assessment: 1=weak, 5=strong.
 * Missing signals preserve the four-skill default 18/18/24/30 at 90 minutes.
 * Largest-remainder apportionment ensures exact total minutes.
 */
export function recommendDailyMinutes(
  minutes: number,
  accuracies: Partial<Record<JlptLearningSection,number>> = {},
  strengths: Partial<Record<JlptLearningSection,number>> = {},
): Record<JlptLearningSection,number> {
  const total = Math.max(0,Math.round(minutes))
  const weights = LEARNING_SECTIONS.map((section) => {
    const accuracy = accuracies[section]
    const strength = strengths[section]
    const wrongFactor = accuracy === undefined ? 1 : 1 + (1 - Math.max(0,Math.min(1,accuracy))) * 0.7
    const weaknessFactor = strength === undefined ? 1 : 1 + (5 - Math.max(1,Math.min(5,strength))) / 4 * 0.25
    return DEFAULT_MINUTES[section] * wrongFactor * weaknessFactor
  })
  const sum = weights.reduce((a,b)=>a+b,0)
  const raws = weights.map((w)=>w/sum*total)
  const allocated = raws.map(Math.floor)
  const remainder = total-allocated.reduce((a,b)=>a+b,0)
  const priority = raws.map((v,i)=>({i,part:v-Math.floor(v)})).sort((a,b)=>b.part-a.part||a.i-b.i)
  for(let i=0;i<remainder;i++) allocated[priority[i].i]++
  return Object.fromEntries(LEARNING_SECTIONS.map((key,i)=>[key,allocated[i]])) as Record<JlptLearningSection,number>
}
