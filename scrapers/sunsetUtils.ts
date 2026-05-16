import axios from 'axios'

function todayCT(): string {
  return new Date()
    .toLocaleDateString('en-GB', {
      timeZone: 'America/Chicago',
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    .replace(/\//g, '-')
}

/** Returns "~H:MM PM" (approximate) by adding offsetMinutes to today's Richardson sunset. */
export async function sunsetPlus(offsetMinutes: number): Promise<string | null> {
  try {
    const url = `https://api.aladhan.com/v1/timingsByCity/${todayCT()}?city=Richardson&country=US&method=2`
    const { data } = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    const sunsetStr: string = data?.data?.timings?.Sunset
    if (!sunsetStr) return null

    const [hStr, mStr] = sunsetStr.split(':')
    const totalMin = parseInt(hStr) * 60 + parseInt(mStr) + offsetMinutes
    const h24 = Math.floor(totalMin / 60) % 24
    const m   = totalMin % 60

    const period = h24 >= 12 ? 'PM' : 'AM'
    let h = h24 % 12
    if (h === 0) h = 12
    return `~${h}:${m.toString().padStart(2, '0')} ${period}`
  } catch {
    return null
  }
}
