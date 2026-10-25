import SectionClient from './SectionClient'
import { JLPT_LEVELS } from '@/data/jlpt'
import type { JlptSection } from '@/lib/types'
const SECTIONS: JlptSection[]=['vocabulary','grammar','reading','listening','mock']
export function generateStaticParams() { return JLPT_LEVELS.flatMap(level=>SECTIONS.map(section=>({level:level.toLowerCase(),section}))) }
export default function SectionPage() { return <SectionClient /> }
