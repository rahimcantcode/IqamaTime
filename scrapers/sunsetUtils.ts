import axios from 'axios'
import { dallasDate } from '../lib/dallas-date'
import { normalizeTime } from './normalizeTime'

/** Calculation only for an explicit source-published relative iqamah rule. */
export async function sunsetPlus(offsetMinutes: number, input: { city: string; date: string }): Promise<string | null> {
  try {
    const date = input.date || dallasDate()
    const [year, month, day] = date.split('-')
    const url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(input.city)}&state=Texas&country=US&method=2`
    const { data } = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'IqamaTimeBot/1.0' } })
    // A cached response for another day is not today's sunset.
    if (data?.data?.date?.gregorian?.date !== `${day}-${month}-${year}`) return null
    const sunset = normalizeTime(data?.data?.timings?.Maghrib)
    const match = sunset?.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)
    if (!match) return null
    const hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0)
    const total = (hour * 60 + Number(match[2]) + offsetMinutes) % (24 * 60)
    return normalizeTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`)
  } catch {
    return null
  }
}
