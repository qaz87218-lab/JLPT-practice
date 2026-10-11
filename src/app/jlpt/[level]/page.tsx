import LevelClient from './LevelClient'
import { JLPT_LEVELS } from '@/data/jlpt'
export function generateStaticParams() { return JLPT_LEVELS.map(level=>({level:level.toLowerCase()})) }
export default function LevelPage() { return <LevelClient /> }
