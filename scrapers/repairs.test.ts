import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dallasDate, previousDate } from '../lib/dallas-date'
import { normalizeTime } from './normalizeTime'
import { parseCMZTimes } from './icr'
import { parseMASAnnualSchedule } from './mas'
import { validatePrayerTimes } from './validation'

test('Dallas dates stay correct at UTC midnight and daylight-saving changes', () => {
  assert.equal(dallasDate(new Date('2026-10-28T02:00:00Z')), '2026-10-27')
  assert.equal(dallasDate(new Date('2026-11-02T05:30:00Z')), '2026-11-01')
  assert.equal(previousDate('2026-03-09'), '2026-03-08')
  assert.equal(previousDate('2026-01-01'), '2025-12-31')
})

test('CMZ uses labelled iqamah rather than adhan or responsive duplicates', () => {
  const times = parseCMZTimes(readFileSync('scrapers/fixtures/icr-cmz.html', 'utf8'))
  assert.deepEqual([times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha],
    ['7:00 AM', '2:00 PM', '5:15 PM', '6:50 PM', '8:15 PM'])
})

test('MAS selects the Dallas calendar day from the official annual data', () => {
  const script = readFileSync('scrapers/fixtures/mas-annual.txt', 'utf8')
  const times = parseMASAnnualSchedule(script, '2026-10-27')
  assert.deepEqual([times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha],
    ['6:45 AM', '1:45 PM', '5:00 PM', '6:46 PM', '8:15 PM'])
  assert.equal(times.jummah1, '1:30 PM')
  assert.throws(() => parseMASAnnualSchedule(script, '2027-01-01'), /wrong year/)
})

test('missing or malformed prayer times cannot be persisted as successful scrapes', () => {
  for (const invalid of ['0:30 AM', '13:20 PM', '7:90 AM']) assert.equal(normalizeTime(invalid), null)
  const times = parseCMZTimes(readFileSync('scrapers/fixtures/icr-cmz.html', 'utf8'))
  assert.throws(() => validatePrayerTimes({ ...times, masjidName: 'test', date: '2026-10-27', fajr: null }), /missing fajr/)
  assert.doesNotThrow(() => validatePrayerTimes({ ...times, masjidName: 'test', date: '2026-10-27' }))
})
