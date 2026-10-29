import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseAthanPlusTimes } from './athanplus'
import { parseQalamTimes } from './qalam'
import { parseAllenTimes } from './allen'
import { addFridayTime, emptyTimes } from './prayer-source-utils'
import { prayerTimeNote } from '../lib/prayer-source-notes'

const fixture = (name: string) => readFileSync(`scrapers/fixtures/${name}`, 'utf8')

test('AthanPlus never relabels tomorrow as today when the provider active date is ahead', () => {
  const html = fixture('athanplus-dated.html')
  assert.throws(() => parseAthanPlusTimes(html, '2026-10-29'), /no unique schedule/)
  const tomorrow = parseAthanPlusTimes(html, '2026-10-30')
  assert.equal(tomorrow.fajr, '6:45 AM')
  assert.equal(tomorrow.jummah1, '1:45 PM')
  assert.equal(tomorrow.jummah2, '3:00 PM')
  const sunday = parseAthanPlusTimes(html, '2026-11-01')
  assert.equal(sunday.fajr, '6:00 AM')
  assert.throws(() => parseAthanPlusTimes('<table><tr><td>Fajr</td><td>6:00 AM</td><td>7:00 AM</td></tr></table>', '2026-10-29'), /no unique schedule/)
})

test('Qalam periods use the requested Dallas calendar day including DST and year rollover', async () => {
  const html = fixture('qalam-periods.html')
  const sunset = async (offset: number, input: { city: string; date: string }) => {
    assert.equal(offset, 5)
    assert.equal(input.city, 'Carrollton')
    return '6:43 PM'
  }
  assert.equal((await parseQalamTimes(html, '2026-10-31', sunset)).fajr, '7:00 AM')
  assert.equal((await parseQalamTimes(html, '2026-11-01', sunset)).fajr, '6:15 AM')
  await assert.rejects(parseQalamTimes(html, '2026-10-01', sunset), /no active period/)
  const rollover = html.replace('From 10/15', 'From 12/15').replace('From 11/1', 'From 1/1')
  assert.equal((await parseQalamTimes(rollover, '2027-01-02', sunset)).fajr, '6:15 AM')
})

test('relative Maghrib calculation requires a published rule; missing iqama never becomes adhan', async () => {
  let calls = 0
  const sunset = async (offset: number, input: { city: string; date: string }) => {
    calls++
    assert.equal(offset, 5)
    assert.equal(input.city, 'Allen')
    assert.equal(input.date, '2026-10-29')
    return '6:43 PM'
  }
  const html = fixture('allen-table.html')
  const actual = await parseAllenTimes(html, '2026-10-29', sunset)
  assert.equal(actual.maghrib, '6:43 PM')
  assert.equal(actual.fajr, '6:45 AM')
  assert.equal(calls, 1)
  const missing = await parseAllenTimes('<table><tr><td><p class="prayer-label">Fajr</p></td><td><p class="btn">6:15 AM</p></td></tr></table>', '2026-10-29', sunset)
  assert.equal(missing.fajr, null)
  assert.equal(missing.maghrib, null)
  assert.equal(calls, 1)
  assert.equal((await parseQalamTimes(fixture('qalam-periods.html').replace('Sunset (5 minutes after Adhan)', 'Check with masjid'), '2026-10-29', sunset)).maghrib, null)
})

test('Friday starts remain distinct across repeated responsive markup and retain all three', () => {
  const times = emptyTimes()
  for (const time of ['1:30 PM', '2:30 PM', '1:30 PM', '3:30 PM', '2:30 PM']) addFridayTime(times, time)
  assert.deepEqual([times.jummah1, times.jummah2, times.jummah3], ['1:30 PM', '2:30 PM', '3:30 PM'])
})

test('sunset-based provenance is limited to the affected source and prayer', () => {
  assert.match(prayerTimeNote('Islamic Association of Allen', 'maghrib')!, /verify/)
  assert.equal(prayerTimeNote('Islamic Association of Allen', 'fajr'), undefined)
  assert.equal(prayerTimeNote('EPIC Masjid', 'maghrib'), undefined)
})

test('Qalam Friday means khutbah start, not a later salah fallback', async () => {
  const html = '<div>Jumu’ah<p>Khutbah: 2:00 PM<br>Salah: 2:30 PM</p></div>'
  assert.equal((await parseQalamTimes(html, '2026-10-29')).jummah1, '2:00 PM')
  assert.equal((await parseQalamTimes(html.replace('Khutbah: 2:00 PM', ''), '2026-10-29')).jummah1, null)
})

test('default database seed only populates the directory, never made-up current prayers', () => {
  const seed = readFileSync('supabase/seed.sql', 'utf8')
  assert.doesNotMatch(seed, /insert\s+into\s+prayer_times/i)
  assert.doesNotMatch(seed, /current_date|\d{1,2}:\d{2}\s*(?:AM|PM)/)
  assert.match(seed, /'Qalam Masjid',\s*'Carrollton'/)
  assert.match(seed, /'McKinney Islamic Association',\s*'McKinney',\s*'https:\/\/mckinneymasjid\.org'/)
  assert.match(seed, /'MAS Dallas'/)
})
