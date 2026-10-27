export function dallasDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

export function previousDate(date: string): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) - 86400000).toISOString().slice(0, 10)
}

export function dallasMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
  }).formatToParts(now)
  return Number(parts.find(p => p.type === 'hour')?.value) * 60 + Number(parts.find(p => p.type === 'minute')?.value)
}

export function dallasTimeToDate(hour: number, minute: number, now = new Date()): Date {
  const wall = Date.parse(`${dallasDate(now)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`)
  let target = wall
  // Re-evaluate the offset at the target instant to handle DST transition days.
  for (let i = 0; i < 3; i++) {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', timeZoneName: 'longOffset',
    }).formatToParts(new Date(target)).find(p => p.type === 'timeZoneName')?.value
    const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (!match) throw new Error('Dallas timezone offset unavailable')
    const minutes = (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '-' ? -1 : 1)
    target = wall - minutes * 60000
  }
  return new Date(target)
}
