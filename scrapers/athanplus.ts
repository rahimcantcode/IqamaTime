import * as cheerio from 'cheerio'
import type { TimesOnly } from './database'
import { normalizeTime } from './normalizeTime'
import { addFridayTime, emptyTimes } from './prayer-source-utils'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function calendarDate(label: string): string | null {
  const match = label.match(/\b([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})\b/)
  if (!match) return null
  const month = MONTHS.indexOf(match[1]) + 1
  if (!month) return null
  return `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`
}

/** The provider's active slide can already be tomorrow in Dallas. Never relabel it. */
export function parseAthanPlusTimes(html: string, date: string): TimesOnly {
  const $ = cheerio.load(html)
  const matches: number[] = []
  $('.carousel-item').each((index, slide) => {
    if (calendarDate($(slide).find('h2').text()) === date) matches.push(index)
  })
  if (matches.length !== 1) throw new Error(`AthanPlus has no unique schedule for Dallas date ${date}`)
  const index = matches[0]
  const times = emptyTimes()
  $('table').eq(index).find('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 3) return
    const name = cells.eq(0).text().replace(/\s+/g, ' ').trim().toLowerCase()
    const iqamah = normalizeTime(cells.eq(2).find('b').text().trim() || cells.eq(2).text().trim())
    if (name.includes('fajr')) times.fajr = iqamah
    else if (name.includes('dhuhr')) times.dhuhr = iqamah
    else if (name.includes('asr')) times.asr = iqamah
    else if (name.includes('maghrib')) times.maghrib = iqamah
    else if (name.includes('isha')) times.isha = iqamah
  })
  $('ul.month-calendar').eq(index).find('li').each((_, item) => {
    addFridayTime(times, $(item).find('b').text().trim())
  })
  return times
}
