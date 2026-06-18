import type { ScheduleEvent, ChildProfile } from '@/types'

export type ScheduleConflict = {
  child1: ChildProfile
  child2: ChildProfile
  event1: ScheduleEvent
  event2: ScheduleEvent
  overlapMinutes: number
}

const BUFFER_MINUTES = 30 // 이동 시간 여유

function getMinutes(timeStr: string): number {
  const d = new Date(timeStr)
  return d.getHours() * 60 + d.getMinutes()
}

export function detectConflicts(
  events: ScheduleEvent[],
  children: ChildProfile[],
  targetDow: number, // 0=Sun, 1=Mon, ...
  targetDate?: Date  // for non-recurring events
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const childMap = new Map(children.map(c => [c.id, c]))

  // Filter events active on this day
  const dayEvents = events.filter(e => {
    if (!e.child_id) return false
    if (e.is_recurring && e.recur_days) {
      return e.recur_days.includes(targetDow)
    }
    if (targetDate) {
      const eventDate = new Date(e.start_at)
      return eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
    }
    return false
  })

  // Group by child
  const byChild = new Map<string, ScheduleEvent[]>()
  dayEvents.forEach(e => {
    if (!e.child_id) return
    const arr = byChild.get(e.child_id) || []
    arr.push(e)
    byChild.set(e.child_id, arr)
  })

  const childIds = [...byChild.keys()]

  // Compare events between different children
  for (let i = 0; i < childIds.length; i++) {
    for (let j = i + 1; j < childIds.length; j++) {
      const events1 = byChild.get(childIds[i])!
      const events2 = byChild.get(childIds[j])!
      const child1 = childMap.get(childIds[i])
      const child2 = childMap.get(childIds[j])
      if (!child1 || !child2) continue

      for (const e1 of events1) {
        for (const e2 of events2) {
          // Skip if same location (they can go together)
          if (e1.location && e2.location && e1.location === e2.location) continue

          const start1 = getMinutes(e1.start_at)
          const end1 = e1.end_at ? getMinutes(e1.end_at) : start1 + 60
          const start2 = getMinutes(e2.start_at)
          const end2 = e2.end_at ? getMinutes(e2.end_at) : start2 + 60

          // Check overlap with buffer
          const bufferedEnd1 = end1 + BUFFER_MINUTES
          const bufferedEnd2 = end2 + BUFFER_MINUTES

          // Overlap when: start1 < bufferedEnd2 AND start2 < bufferedEnd1
          if (start1 < bufferedEnd2 && start2 < bufferedEnd1) {
            const overlapStart = Math.max(start1, start2)
            const overlapEnd = Math.min(end1, end2)
            const overlapMinutes = Math.max(0, overlapEnd - overlapStart)

            conflicts.push({ child1, child2, event1: e1, event2: e2, overlapMinutes })
          }
        }
      }
    }
  }

  return conflicts
}
